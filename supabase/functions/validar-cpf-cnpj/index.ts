const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  type: 'cpf' | 'cnpj' | 'auto';
  value: string;
}

interface ValidationResponse {
  valid: boolean;
  type: 'cpf' | 'cnpj';
  formatted: string;
  raw: string;
  error?: string;
}

// Rate limiting in-memory
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 minute
  const maxReqs = 30;
  const entry = requestCounts.get(ip);
  
  if (!entry || now >= entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + window });
    return false;
  }
  
  if (entry.count >= maxReqs) return true;
  entry.count++;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: ValidationRequest = await req.json();
    const { type = 'auto', value } = body;

    if (!value || typeof value !== 'string') {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Value is required and must be a string' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Max length guard
    if (value.length > 30) {
      return new Response(JSON.stringify({ valid: false, error: 'Value too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanValue = value.replace(/\D/g, '');
    let result: ValidationResponse;

    if (type === 'cpf' || (type === 'auto' && cleanValue.length === 11)) {
      result = validateCPF(cleanValue);
    } else if (type === 'cnpj' || (type === 'auto' && cleanValue.length === 14)) {
      result = validateCNPJ(cleanValue);
    } else {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Invalid document length' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function validateCPF(cpf: string): ValidationResponse {
  const raw = cpf;
  
  if (cpf.length !== 11) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'CPF must have 11 digits' };
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'Invalid CPF pattern' };
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'Invalid CPF checksum' };
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'Invalid CPF checksum' };
  }

  const formatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return { valid: true, type: 'cpf', formatted, raw };
}

function validateCNPJ(cnpj: string): ValidationResponse {
  const raw = cnpj;

  if (cnpj.length !== 14) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'CNPJ must have 14 digits' };
  }

  if (/^(\d)\1{13}$/.test(cnpj)) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'Invalid CNPJ pattern' };
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cnpj.charAt(12))) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'Invalid CNPJ checksum' };
  }

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cnpj.charAt(13))) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'Invalid CNPJ checksum' };
  }

  const formatted = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return { valid: true, type: 'cnpj', formatted, raw };
}
