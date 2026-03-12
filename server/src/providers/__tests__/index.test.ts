import { describe, it, expect } from 'vitest';
import { getProvider, providers } from '../index';

describe('Provider Registry', () => {
  describe('RED: getProvider', () => {
    it('should return claude provider', () => {
      const provider = getProvider('claude');
      expect(provider.name).toBe('claude');
    });

    it('should return codex provider', () => {
      const provider = getProvider('codex');
      expect(provider.name).toBe('codex');
    });

    it('should return opencode provider', () => {
      const provider = getProvider('opencode');
      expect(provider.name).toBe('opencode');
    });

    it('should return gemini provider', () => {
      const provider = getProvider('gemini');
      expect(provider.name).toBe('gemini');
    });

    it('should return pi provider', () => {
      const provider = getProvider('pi');
      expect(provider.name).toBe('pi');
    });

    it('should throw for unknown provider', () => {
      // @ts-expect-error - testing runtime behavior
      expect(() => getProvider('unknown')).toThrow('Unknown provider');
    });
  });

  describe('RED: providers registry', () => {
    it('should include all providers', () => {
      expect(providers).toHaveProperty('claude');
      expect(providers).toHaveProperty('codex');
      expect(providers).toHaveProperty('opencode');
      expect(providers).toHaveProperty('gemini');
      expect(providers).toHaveProperty('pi');
    });

    it('should have exactly 5 providers', () => {
      expect(Object.keys(providers)).toHaveLength(5);
    });
  });
});
