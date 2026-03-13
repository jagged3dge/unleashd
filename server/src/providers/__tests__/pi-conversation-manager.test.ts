import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PiConversationManager } from '../pi-conversation-manager';
import { PiRpcClient } from '../pi-rpc-client';

// Mock PiRpcClient to avoid spawning actual processes
vi.mock('../pi-rpc-client', () => {
  return {
    PiRpcClient: class MockPiRpcClient {
      start = vi.fn().mockResolvedValue(undefined);
      stop = vi.fn().mockResolvedValue(undefined);
      sendPrompt = vi.fn().mockResolvedValue('cmd-id');
      setModel = vi.fn().mockResolvedValue('model-cmd-id');
      sendAbort = vi.fn().mockResolvedValue(undefined);
      onEvent = vi.fn();
      isRunning = vi.fn().mockReturnValue(true);
    },
  };
});

describe('PiConversationManager', () => {
  let manager: PiConversationManager;

  beforeEach(() => {
    manager = new PiConversationManager();
    vi.clearAllMocks();
  });

  describe('RED: conversation lifecycle', () => {
    it('should create a conversation', async () => {
      const id = 'conv-123';
      await expect(
        manager.createConversation(id, {
          model: 'sonnet',
          workingDirectory: '/tmp/test',
        })
      ).resolves.not.toThrow();
    });

    it('should track created conversations', async () => {
      const id = 'conv-123';
      await manager.createConversation(id, { model: 'sonnet' });
      
      expect(manager.hasConversation(id)).toBe(true);
    });

    it('should not have non-existent conversations', () => {
      expect(manager.hasConversation('non-existent')).toBe(false);
    });

    it('should stop a conversation', async () => {
      const id = 'conv-123';
      await manager.createConversation(id, { model: 'sonnet' });
      await manager.stopConversation(id);
      
      expect(manager.hasConversation(id)).toBe(false);
    });

    it('should handle stopping non-existent conversation', async () => {
      await expect(
        manager.stopConversation('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('RED: message sending', () => {
    it('should have sendMessage method', () => {
      expect(manager.sendMessage).toBeDefined();
      expect(typeof manager.sendMessage).toBe('function');
    });

    it('should reject message for non-existent conversation', async () => {
      await expect(
        manager.sendMessage('non-existent', 'Hello')
      ).rejects.toThrow();
    });
  });

  describe('RED: event handling', () => {
    it('should accept event callback registration', () => {
      const callback = vi.fn();
      manager.onEvent(callback);
      
      // Callback should be stored
      expect(callback).not.toHaveBeenCalled();
    });

    it('should allow per-conversation event callbacks', async () => {
      const id = 'conv-123';
      const callback = vi.fn();
      
      await manager.createConversation(id, { model: 'sonnet' });
      manager.onConversationEvent(id, callback);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('RED: model changes', () => {
    it('should have setModel method', () => {
      expect(manager.setModel).toBeDefined();
      expect(typeof manager.setModel).toBe('function');
    });

    it('should reject model change for non-existent conversation', async () => {
      await expect(
        manager.setModel('non-existent', 'opus')
      ).rejects.toThrow();
    });
  });

  describe('RED: abort operations', () => {
    it('should have abort method', () => {
      expect(manager.abort).toBeDefined();
      expect(typeof manager.abort).toBe('function');
    });

    it('should handle abort for non-existent conversation', async () => {
      await expect(
        manager.abort('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('RED: multiple conversations', () => {
    it('should manage multiple conversations', async () => {
      await manager.createConversation('conv-1', { model: 'sonnet' });
      await manager.createConversation('conv-2', { model: 'opus' });
      
      expect(manager.hasConversation('conv-1')).toBe(true);
      expect(manager.hasConversation('conv-2')).toBe(true);
    });

    it('should stop conversations independently', async () => {
      await manager.createConversation('conv-1', { model: 'sonnet' });
      await manager.createConversation('conv-2', { model: 'opus' });
      
      await manager.stopConversation('conv-1');
      
      expect(manager.hasConversation('conv-1')).toBe(false);
      expect(manager.hasConversation('conv-2')).toBe(true);
    });
  });

  describe('RED: session management', () => {
    it('should accept sessionId in options', async () => {
      await expect(
        manager.createConversation('conv-123', {
          model: 'sonnet',
          sessionId: 'existing-session-id',
        })
      ).resolves.not.toThrow();
    });

    it('should accept resume flag', async () => {
      await expect(
        manager.createConversation('conv-123', {
          model: 'sonnet',
          sessionId: 'session-id',
          resume: true,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('RED: cleanup', () => {
    it('should have stopAll method', () => {
      expect(manager.stopAll).toBeDefined();
      expect(typeof manager.stopAll).toBe('function');
    });

    it('should stop all conversations', async () => {
      await manager.createConversation('conv-1', { model: 'sonnet' });
      await manager.createConversation('conv-2', { model: 'opus' });
      
      await manager.stopAll();
      
      expect(manager.hasConversation('conv-1')).toBe(false);
      expect(manager.hasConversation('conv-2')).toBe(false);
    });
  });
});
