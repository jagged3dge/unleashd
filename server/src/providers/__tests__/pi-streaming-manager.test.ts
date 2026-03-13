import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PiStreamingManager } from '../pi-streaming-manager';

describe('PiStreamingManager', () => {
  let manager: PiStreamingManager;
  let broadcastMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    broadcastMock = vi.fn();
    manager = new PiStreamingManager(broadcastMock);
  });

  describe('RED: streaming state management', () => {
    it('should start streaming', () => {
      manager.startStreaming('conv-123');
      expect(manager.isStreaming('conv-123')).toBe(true);
    });

    it('should not be streaming initially', () => {
      expect(manager.isStreaming('conv-123')).toBe(false);
    });

    it('should complete streaming', () => {
      manager.startStreaming('conv-123');
      manager.completeStreaming('conv-123');
      expect(manager.isStreaming('conv-123')).toBe(false);
    });

    it('should handle complete on non-streaming conversation', () => {
      expect(() => {
        manager.completeStreaming('non-existent');
      }).not.toThrow();
    });
  });

  describe('RED: text delta streaming', () => {
    it('should append text delta', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'Hello');
      
      expect(broadcastMock).toHaveBeenCalledWith(
        'conv-123',
        'Hello',
        false // not thinking
      );
    });

    it('should buffer multiple text deltas', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'Hello ');
      manager.appendTextDelta('conv-123', 'world');
      
      expect(broadcastMock).toHaveBeenCalledTimes(2);
      const buffer = manager.getBuffer('conv-123');
      expect(buffer.text).toBe('Hello world');
    });

    it('should not append to non-streaming conversation', () => {
      manager.appendTextDelta('non-existent', 'text');
      expect(broadcastMock).not.toHaveBeenCalled();
    });
  });

  describe('RED: thinking delta streaming', () => {
    it('should append thinking delta separately', () => {
      manager.startStreaming('conv-123');
      manager.appendThinkingDelta('conv-123', 'Let me think...');
      
      expect(broadcastMock).toHaveBeenCalledWith(
        'conv-123',
        'Let me think...',
        true // is thinking
      );
    });

    it('should buffer thinking separately from text', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'Answer: ');
      manager.appendThinkingDelta('conv-123', 'reasoning...');
      manager.appendTextDelta('conv-123', '42');
      
      const buffer = manager.getBuffer('conv-123');
      expect(buffer.text).toBe('Answer: 42');
      expect(buffer.thinking).toBe('reasoning...');
    });
  });

  describe('RED: stream completion', () => {
    it('should return buffered content on completion', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'Complete message');
      
      const content = manager.completeStreaming('conv-123');
      expect(content.text).toBe('Complete message');
    });

    it('should return both text and thinking on completion', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'Answer');
      manager.appendThinkingDelta('conv-123', 'Reasoning');
      
      const content = manager.completeStreaming('conv-123');
      expect(content.text).toBe('Answer');
      expect(content.thinking).toBe('Reasoning');
    });

    it('should clear buffer after completion', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'text');
      manager.completeStreaming('conv-123');
      
      manager.startStreaming('conv-123'); // start new stream
      const buffer = manager.getBuffer('conv-123');
      expect(buffer.text).toBe('');
    });
  });

  describe('RED: stream interruption (abort)', () => {
    it('should abort streaming', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'Incomplete');
      
      manager.abortStreaming('conv-123');
      
      expect(manager.isStreaming('conv-123')).toBe(false);
    });

    it('should return partial content on abort', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'Partial');
      
      const content = manager.abortStreaming('conv-123');
      expect(content.text).toBe('Partial');
    });

    it('should handle abort on non-streaming conversation', () => {
      expect(() => {
        manager.abortStreaming('non-existent');
      }).not.toThrow();
    });
  });

  describe('RED: buffer management', () => {
    it('should get current buffer', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'buffered text');
      
      const buffer = manager.getBuffer('conv-123');
      expect(buffer.text).toBe('buffered text');
      expect(buffer.thinking).toBe('');
    });

    it('should return empty buffer for non-streaming', () => {
      const buffer = manager.getBuffer('non-existent');
      expect(buffer.text).toBe('');
      expect(buffer.thinking).toBe('');
    });

    it('should track buffer size', () => {
      manager.startStreaming('conv-123');
      manager.appendTextDelta('conv-123', 'test');
      
      const size = manager.getBufferSize('conv-123');
      expect(size).toBe(4); // 'test'.length
    });
  });

  describe('RED: multiple conversations', () => {
    it('should manage streaming for multiple conversations', () => {
      manager.startStreaming('conv-1');
      manager.startStreaming('conv-2');
      
      manager.appendTextDelta('conv-1', 'Message 1');
      manager.appendTextDelta('conv-2', 'Message 2');
      
      expect(manager.getBuffer('conv-1').text).toBe('Message 1');
      expect(manager.getBuffer('conv-2').text).toBe('Message 2');
    });

    it('should complete streams independently', () => {
      manager.startStreaming('conv-1');
      manager.startStreaming('conv-2');
      
      manager.completeStreaming('conv-1');
      
      expect(manager.isStreaming('conv-1')).toBe(false);
      expect(manager.isStreaming('conv-2')).toBe(true);
    });
  });
});
