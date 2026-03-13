import { describe, it, expect } from 'vitest';
import { extractThinking, hasThinking, filterThinking } from '../pi-thinking';

describe('Pi Thinking Extraction', () => {
  describe('RED: extractThinking', () => {
    it('should extract single thinking block', () => {
      const content = [
        { type: 'thinking', thinking: 'Let me think...' },
        { type: 'text', text: 'Answer' },
      ];
      const result = extractThinking(content);
      
      expect(result.thinkingBlocks).toHaveLength(1);
      expect(result.thinkingBlocks[0]).toBe('Let me think...');
    });

    it('should extract multiple thinking blocks', () => {
      const content = [
        { type: 'thinking', thinking: 'First thought' },
        { type: 'text', text: 'Some text' },
        { type: 'thinking', thinking: 'Second thought' },
      ];
      const result = extractThinking(content);
      
      expect(result.thinkingBlocks).toHaveLength(2);
      expect(result.thinkingBlocks[0]).toBe('First thought');
      expect(result.thinkingBlocks[1]).toBe('Second thought');
    });

    it('should extract text content without thinking', () => {
      const content = [
        { type: 'thinking', thinking: 'Thinking...' },
        { type: 'text', text: 'Response' },
      ];
      const result = extractThinking(content);
      
      expect(result.textContent).toBe('Response');
    });

    it('should handle no thinking blocks', () => {
      const content = [
        { type: 'text', text: 'Just text' },
      ];
      const result = extractThinking(content);
      
      expect(result.thinkingBlocks).toHaveLength(0);
      expect(result.hasThinking).toBe(false);
    });

    it('should set hasThinking flag correctly', () => {
      const withThinking = [
        { type: 'thinking', thinking: 'Thought' },
        { type: 'text', text: 'Text' },
      ];
      const withoutThinking = [
        { type: 'text', text: 'Text' },
      ];
      
      expect(extractThinking(withThinking).hasThinking).toBe(true);
      expect(extractThinking(withoutThinking).hasThinking).toBe(false);
    });
  });

  describe('RED: hasThinking helper', () => {
    it('should detect thinking in content', () => {
      const content = [
        { type: 'thinking', thinking: 'Thought' },
        { type: 'text', text: 'Text' },
      ];
      expect(hasThinking(content)).toBe(true);
    });

    it('should return false for no thinking', () => {
      const content = [
        { type: 'text', text: 'Text' },
      ];
      expect(hasThinking(content)).toBe(false);
    });
  });

  describe('RED: filterThinking', () => {
    it('should remove thinking blocks', () => {
      const content = [
        { type: 'thinking', thinking: 'Thought' },
        { type: 'text', text: 'Text' },
      ];
      const filtered = filterThinking(content);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('text');
    });

    it('should keep non-thinking blocks', () => {
      const content = [
        { type: 'text', text: 'Text' },
        { type: 'toolUse', id: '123', name: 'read', input: {} },
      ];
      const filtered = filterThinking(content);
      
      expect(filtered).toHaveLength(2);
    });
  });
});
