/**
 * Pi Resilience Patterns
 *
 * Production-ready resilience patterns for RPC communication:
 * - Circuit Breaker: Prevent cascading failures
 * - Retry Strategy: Exponential backoff
 * - Timeout Wrapper: Prevent hanging
 *
 * These patterns are composable for robust error handling.
 */

/**
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit Breaker Pattern
 *
 * Prevents cascading failures by stopping requests to failing services.
 * States:
 * - CLOSED: Normal operation
 * - OPEN: Too many failures, reject requests
 * - HALF_OPEN: Testing if service recovered
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 60 seconds
    private readonly halfOpenAttempts: number = 3
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should attempt recovery
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenAttempts) {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Retry Strategy with Exponential Backoff
 *
 * Retries failed operations with increasing delays.
 * Delay formula: baseDelay * 2^attempt
 */
export class RetryStrategy {
  constructor(
    private readonly maxAttempts: number = 3,
    private readonly baseDelay: number = 1000,
    private readonly maxDelay: number = 30000,
    private readonly multiplier: number = 2
  ) {}

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    shouldRetry: (error: any) => boolean = () => true
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (!shouldRetry(error) || attempt === this.maxAttempts - 1) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.baseDelay * Math.pow(this.multiplier, attempt),
          this.maxDelay
        );

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Timeout Wrapper
 *
 * Prevents operations from hanging indefinitely.
 */
export class TimeoutWrapper {
  constructor(private readonly defaultTimeout: number = 30000) {}

  /**
   * Execute a function with timeout protection
   */
  async execute<T>(fn: () => Promise<T>, timeout = this.defaultTimeout): Promise<T> {
    return Promise.race([
      fn(),
      this.createTimeoutPromise<T>(timeout),
    ]);
  }

  /**
   * Create a promise that rejects after timeout
   */
  private createTimeoutPromise<T>(ms: number): Promise<T> {
    return new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms);
    });
  }
}

/**
 * Composable Resilience Wrapper
 *
 * Combines all resilience patterns for maximum robustness.
 * Execution order: CircuitBreaker → Retry → Timeout → Function
 */
export class ResilienceWrapper {
  private circuitBreaker: CircuitBreaker;
  private retryStrategy: RetryStrategy;
  private timeoutWrapper: TimeoutWrapper;

  constructor() {
    this.circuitBreaker = new CircuitBreaker();
    this.retryStrategy = new RetryStrategy();
    this.timeoutWrapper = new TimeoutWrapper();
  }

  /**
   * Execute with all resilience patterns
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.execute(() =>
      this.retryStrategy.execute(() =>
        this.timeoutWrapper.execute(fn)
      )
    );
  }

  /**
   * Reset all patterns
   */
  reset(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Get circuit breaker state (for monitoring)
   */
  getCircuitState(): CircuitState {
    return this.circuitBreaker.getState();
  }
}
