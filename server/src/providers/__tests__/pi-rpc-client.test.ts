import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PiRpcClient } from '../pi-rpc-client';

describe('PiRpcClient', () => {
  let client: PiRpcClient;

  beforeEach(() => {
    client = new PiRpcClient();
  });

  describe('lifecycle', () => {
    it('should initialize in stopped state', () => {
      expect(client.isRunning()).toBe(false);
    });

    it('should accept start options', () => {
      expect(() => {
        client.start({ model: 'sonnet' });
      }).not.toThrow();
    });
  });

  describe('command sending', () => {
    it('should have sendPrompt method', () => {
      expect(client.sendPrompt).toBeDefined();
      expect(typeof client.sendPrompt).toBe('function');
    });

    it('should have sendAbort method', () => {
      expect(client.sendAbort).toBeDefined();
      expect(typeof client.sendAbort).toBe('function');
    });

    it('should have setModel method', () => {
      expect(client.setModel).toBeDefined();
      expect(typeof client.setModel).toBe('function');
    });

    it('should reject commands when not running', async () => {
      await expect(client.sendPrompt('test')).rejects.toThrow('Process not running');
    });
  });

  describe('event handling', () => {
    it('should have onEvent method', () => {
      expect(client.onEvent).toBeDefined();
      expect(typeof client.onEvent).toBe('function');
    });

    it('should accept event callback', () => {
      const callback = vi.fn();
      client.onEvent(callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should have stop method', () => {
      expect(client.stop).toBeDefined();
      expect(typeof client.stop).toBe('function');
    });

    it('should have isRunning method', () => {
      expect(client.isRunning).toBeDefined();
      expect(typeof client.isRunning).toBe('function');
    });
  });
});
