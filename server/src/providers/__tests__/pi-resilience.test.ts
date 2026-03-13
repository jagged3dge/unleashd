import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker, RetryStrategy, TimeoutWrapper, ResilienceWrapper } from '../pi-resilience';

describe('Resilience Patterns', () => {
  describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      breaker = new CircuitBreaker(3, 1000); // threshold=3, timeout=1000ms
    });

    describe('RED: closed state', () => {
      it('should start in closed state', () => {
        expect(breaker.getState()).toBe('CLOSED');
      });

      it('should execute successful operations', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await breaker.execute(fn);
        
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('should remain closed on single failure', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('fail'));
        
        await expect(breaker.execute(fn)).rejects.toThrow('fail');
        expect(breaker.getState()).toBe('CLOSED');
      });
    });

    describe('RED: open state transition', () => {
      it('should open after threshold failures', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('fail'));
        
        // Fail 3 times (threshold)
        await expect(breaker.execute(fn)).rejects.toThrow();
        await expect(breaker.execute(fn)).rejects.toThrow();
        await expect(breaker.execute(fn)).rejects.toThrow();
        
        expect(breaker.getState()).toBe('OPEN');
      });

      it('should reject requests when open', async () => {
        const fn = vi.fn();
        
        // Trigger open state
        const failing = vi.fn().mockRejectedValue(new Error('fail'));
        for (let i = 0; i < 3; i++) {
          await expect(breaker.execute(failing)).rejects.toThrow();
        }
        
        // Now it should reject without calling function
        await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe('RED: half-open state transition', () => {
      it('should transition to half-open after timeout', async () => {
        const failing = vi.fn().mockRejectedValue(new Error('fail'));
        
        // Open the circuit
        for (let i = 0; i < 3; i++) {
          await expect(breaker.execute(failing)).rejects.toThrow();
        }
        
        expect(breaker.getState()).toBe('OPEN');
        
        // Wait for timeout
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        // Next calls should attempt (half-open) and succeed
        const success = vi.fn().mockResolvedValue('ok');
        
        // Need 3 successful calls to close (halfOpenAttempts = 3)
        await breaker.execute(success);
        expect(breaker.getState()).toBe('HALF_OPEN'); // Still half-open
        
        await breaker.execute(success);
        expect(breaker.getState()).toBe('HALF_OPEN'); // Still half-open
        
        await breaker.execute(success);
        expect(breaker.getState()).toBe('CLOSED'); // Now closed
        
        expect(success).toHaveBeenCalledTimes(3);
      });
    });

    describe('RED: reset to closed', () => {
      it('should reset to closed on success', async () => {
        const failing = vi.fn().mockRejectedValue(new Error('fail'));
        const success = vi.fn().mockResolvedValue('ok');
        
        // Partially fail (not enough to open)
        await expect(breaker.execute(failing)).rejects.toThrow();
        
        // Success should reset counter
        await breaker.execute(success);
        
        expect(breaker.getState()).toBe('CLOSED');
      });

      it('should have manual reset', () => {
        const failing = vi.fn().mockRejectedValue(new Error('fail'));
        
        // Open the circuit
        for (let i = 0; i < 3; i++) {
          breaker.execute(failing).catch(() => {});
        }
        
        breaker.reset();
        expect(breaker.getState()).toBe('CLOSED');
      });
    });
  });

  describe('RetryStrategy', () => {
    let retry: RetryStrategy;

    beforeEach(() => {
      retry = new RetryStrategy(3, 100); // maxAttempts=3, baseDelay=100ms
    });

    describe('RED: successful retry', () => {
      it('should retry failed operations', async () => {
        let attempts = 0;
        const fn = vi.fn().mockImplementation(async () => {
          attempts++;
          if (attempts < 3) throw new Error('fail');
          return 'success';
        });

        const result = await retry.execute(fn);
        
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
      });

      it('should succeed on first attempt if no error', async () => {
        const fn = vi.fn().mockResolvedValue('immediate success');
        
        const result = await retry.execute(fn);
        
        expect(result).toBe('immediate success');
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    describe('RED: max retries exceeded', () => {
      it('should fail after max attempts', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('always fails'));
        
        await expect(retry.execute(fn)).rejects.toThrow();
        expect(fn).toHaveBeenCalledTimes(3);
      });
    });

    describe('RED: exponential backoff', () => {
      it('should use exponential backoff', async () => {
        const delays: number[] = [];
        const fn = vi.fn().mockRejectedValue(new Error('fail'));
        
        const start = Date.now();
        await retry.execute(fn).catch(() => {});
        const duration = Date.now() - start;
        
        // Should wait: 0ms + 100ms + 200ms = 300ms minimum
        expect(duration).toBeGreaterThanOrEqual(250);
      });
    });

    describe('RED: shouldRetry predicate', () => {
      it('should not retry non-retryable errors', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
        const shouldRetry = vi.fn().mockReturnValue(false);
        
        await expect(retry.execute(fn, shouldRetry)).rejects.toThrow('non-retryable');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(shouldRetry).toHaveBeenCalledTimes(1);
      });

      it('should retry retryable errors', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('retryable'));
        const shouldRetry = vi.fn().mockReturnValue(true);
        
        await expect(retry.execute(fn, shouldRetry)).rejects.toThrow();
        expect(fn).toHaveBeenCalledTimes(3);
        expect(shouldRetry).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('TimeoutWrapper', () => {
    let timeout: TimeoutWrapper;

    beforeEach(() => {
      timeout = new TimeoutWrapper(1000); // 1000ms default timeout
    });

    describe('RED: successful completion', () => {
      it('should complete fast operations', async () => {
        const fn = vi.fn().mockResolvedValue('fast');
        
        const result = await timeout.execute(fn);
        
        expect(result).toBe('fast');
        expect(fn).toHaveBeenCalled();
      });
    });

    describe('RED: timeout trigger', () => {
      it('should timeout slow operations', async () => {
        const fn = vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return 'slow';
        });
        
        await expect(timeout.execute(fn, 500)).rejects.toThrow('timed out after 500ms');
      });

      it('should use default timeout', async () => {
        const fn = vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return 'slow';
        });
        
        await expect(timeout.execute(fn)).rejects.toThrow('timed out after 1000ms');
      });
    });

    describe('RED: custom timeout', () => {
      it('should accept custom timeout', async () => {
        const fn = vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
          return 'ok';
        });
        
        const result = await timeout.execute(fn, 500);
        expect(result).toBe('ok');
      });
    });
  });

  describe('ResilienceWrapper (composition)', () => {
    let wrapper: ResilienceWrapper;

    beforeEach(() => {
      wrapper = new ResilienceWrapper();
    });

    describe('RED: composable patterns', () => {
      it('should apply all patterns', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        
        const result = await wrapper.execute(fn);
        
        expect(result).toBe('success');
      });

      it('should handle failures with retry and circuit breaker', async () => {
        let attempts = 0;
        const fn = vi.fn().mockImplementation(async () => {
          attempts++;
          if (attempts < 2) throw new Error('fail');
          return 'success';
        });
        
        const result = await wrapper.execute(fn);
        
        expect(result).toBe('success');
        expect(attempts).toBe(2);
      });
    });

    describe('RED: reset capability', () => {
      it('should have reset method', () => {
        expect(wrapper.reset).toBeDefined();
        expect(typeof wrapper.reset).toBe('function');
      });
    });
  });
});
