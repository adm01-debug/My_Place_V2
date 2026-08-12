// =====================================================
// RATE LIMITING UTILITY FOR EDGE FUNCTIONS
// =====================================================
// Use in Supabase Edge Functions to prevent abuse

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================
// TYPES
// =====================================================

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for storage */
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

// =====================================================
// IN-MEMORY RATE LIMITER (for single instance)
// =====================================================

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimitInMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowSeconds } = config;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const existing = inMemoryStore.get(key);

  if (!existing || now >= existing.resetAt) {
    // New window
    const resetAt = now + windowMs;
    inMemoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(resetAt),
    };
  }

  if (existing.count >= maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(existing.resetAt),
      retryAfter,
    };
  }

  // Increment counter
  existing.count++;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: new Date(existing.resetAt),
  };
}

// =====================================================
// SUPABASE-BACKED RATE LIMITER (distributed)
// =====================================================

export async function checkRateLimitSupabase(
  supabase: SupabaseClient,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds, keyPrefix = 'rate_limit' } = config;
  const fullKey = `${keyPrefix}:${key}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    // Count requests in current window
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', fullKey)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if we can't check
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(now.getTime() + windowSeconds * 1000),
      };
    }

    const currentCount = count || 0;

    if (currentCount >= maxRequests) {
      // Rate limited
      const resetAt = new Date(now.getTime() + windowSeconds * 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: windowSeconds,
      };
    }

    // Record this request
    await supabase.from('rate_limits').insert({
      key: fullKey,
      created_at: now.toISOString(),
    });

    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetAt: new Date(now.getTime() + windowSeconds * 1000),
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail open
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(now.getTime() + windowSeconds * 1000),
    };
  }
}

// =====================================================
// RESPONSE HELPERS
// =====================================================

export function getRateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

export function createRateLimitResponse(
  result: RateLimitResult,
  config: RateLimitConfig
): Response {
  const headers = getRateLimitHeaders(result, config);

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

// =====================================================
// MIDDLEWARE WRAPPER
// =====================================================

type EdgeHandler = (req: Request) => Promise<Response>;

interface RateLimitMiddlewareOptions extends RateLimitConfig {
  /** Function to extract key from request (default: IP) */
  keyExtractor?: (req: Request) => string;
  /** Use Supabase for distributed rate limiting */
  distributed?: boolean;
  /** Supabase client (required if distributed) */
  supabase?: SupabaseClient;
}

export function withRateLimit(
  handler: EdgeHandler,
  options: RateLimitMiddlewareOptions
): EdgeHandler {
  const {
    maxRequests,
    windowSeconds,
    keyExtractor = (req) => req.headers.get('x-forwarded-for') || 'anonymous',
    distributed = false,
    supabase,
  } = options;

  return async (req: Request): Promise<Response> => {
    const key = keyExtractor(req);
    const config: RateLimitConfig = { maxRequests, windowSeconds };

    let result: RateLimitResult;

    if (distributed && supabase) {
      result = await checkRateLimitSupabase(supabase, key, config);
    } else {
      result = checkRateLimitInMemory(key, config);
    }

    if (!result.allowed) {
      return createRateLimitResponse(result, config);
    }

    // Call the original handler
    const response = await handler(req);

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(result, config);
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

// =====================================================
// PRESETS
// =====================================================

export const RATE_LIMIT_PRESETS = {
  /** Standard API endpoint: 100 requests per minute */
  standard: { maxRequests: 100, windowSeconds: 60 },
  
  /** Strict endpoint: 20 requests per minute */
  strict: { maxRequests: 20, windowSeconds: 60 },
  
  /** Auth endpoints: 5 requests per minute */
  auth: { maxRequests: 5, windowSeconds: 60 },
  
  /** PDF generation: 10 requests per 5 minutes */
  pdfGeneration: { maxRequests: 10, windowSeconds: 300 },
  
  /** Push notifications: 50 requests per minute */
  push: { maxRequests: 50, windowSeconds: 60 },
  
  /** Sync endpoints: 30 requests per minute */
  sync: { maxRequests: 30, windowSeconds: 60 },
} as const;

// =====================================================
// USAGE EXAMPLE
// =====================================================

/*
// In your Edge Function:

import { withRateLimit, RATE_LIMIT_PRESETS } from './rate-limit.ts';

const handler = async (req: Request): Promise<Response> => {
  // Your logic here
  return new Response(JSON.stringify({ success: true }));
};

// Apply rate limiting
const rateLimitedHandler = withRateLimit(handler, {
  ...RATE_LIMIT_PRESETS.standard,
  keyExtractor: (req) => {
    // Use user ID if authenticated, otherwise IP
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Extract user ID from JWT
      return extractUserId(authHeader);
    }
    return req.headers.get('x-forwarded-for') || 'anonymous';
  },
});

Deno.serve(rateLimitedHandler);
*/

export default {
  checkRateLimitInMemory,
  checkRateLimitSupabase,
  getRateLimitHeaders,
  createRateLimitResponse,
  withRateLimit,
  RATE_LIMIT_PRESETS,
};
