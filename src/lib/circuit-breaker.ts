// =====================================================
// CIRCUIT BREAKER — Resilience pattern for external calls
// =====================================================

import { createLogger } from './logger';

const log = createLogger('CircuitBreaker');

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number; // ms
  name?: string;
}

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30_000;
    this.name = options.name ?? 'default';
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'half-open';
        log.info(`Circuit ${this.name} half-open, testing...`);
      } else {
        log.warn(`Circuit ${this.name} open, using fallback`);
        if (fallback) return fallback();
        throw new Error(`Circuit breaker ${this.name} is open`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      log.info(`Circuit ${this.name} recovered, closing`);
    }
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      log.error(`Circuit ${this.name} opened after ${this.failures} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
  }
}

// Pre-configured circuit breakers for common services
export const circuitBreakers = {
  supabase: new CircuitBreaker({ name: 'supabase', failureThreshold: 5, resetTimeout: 30_000 }),
  bitrix24: new CircuitBreaker({ name: 'bitrix24', failureThreshold: 3, resetTimeout: 60_000 }),
  edgeFunctions: new CircuitBreaker({ name: 'edge-functions', failureThreshold: 3, resetTimeout: 45_000 }),
};

export { CircuitBreaker };
export default CircuitBreaker;
