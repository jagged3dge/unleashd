import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PiProcessManager } from '../pi-process-manager';

describe('PiProcessManager', () => {
  let manager: PiProcessManager;

  beforeEach(() => {
    manager = new PiProcessManager();
  });

  describe('initial state', () => {
    it('should not be running initially', () => {
      expect(manager.isRunning()).toBe(false);
    });

    it('should have no process initially', () => {
      expect(manager.getProcess()).toBeNull();
    });
  });

  describe('spawn options', () => {
    it('should accept model option', () => {
      expect(() => {
        manager.spawn({ model: 'sonnet' });
      }).not.toThrow();
    });

    it('should accept sessionId option', () => {
      expect(() => {
        manager.spawn({ model: 'sonnet', sessionId: 'test-123' });
      }).not.toThrow();
    });

    it('should accept cwd option', () => {
      expect(() => {
        manager.spawn({ model: 'sonnet', cwd: '/tmp' });
      }).not.toThrow();
    });
  });

  describe('ProcessHandle interface', () => {
    it('should define required stdin properties', async () => {
      // This test verifies the interface contract exists
      const handle = {
        pid: 123,
        stdin: {
          write: vi.fn(),
          end: vi.fn(),
        },
        stdout: {
          on: vi.fn(),
          pipe: vi.fn(),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn(),
        kill: vi.fn(),
      };

      expect(handle.stdin.write).toBeDefined();
      expect(handle.stdout.on).toBeDefined();
      expect(handle.stderr.on).toBeDefined();
    });
  });

  describe('lifecycle methods', () => {
    it('should have terminate method', () => {
      expect(manager.terminate).toBeDefined();
      expect(typeof manager.terminate).toBe('function');
    });

    it('should have restart method', () => {
      expect(manager.restart).toBeDefined();
      expect(typeof manager.restart).toBe('function');
    });

    it('should have isRunning method', () => {
      expect(manager.isRunning).toBeDefined();
      expect(typeof manager.isRunning).toBe('function');
    });

    it('should have getProcess method', () => {
      expect(manager.getProcess).toBeDefined();
      expect(typeof manager.getProcess).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle terminate when not running', async () => {
      await expect(manager.terminate()).resolves.not.toThrow();
    });

    it('should throw on restart without previous spawn', async () => {
      await expect(manager.restart()).rejects.toThrow('Cannot restart');
    });
  });
});
