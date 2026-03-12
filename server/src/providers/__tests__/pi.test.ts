import { describe, it, expect } from 'vitest';
import piProvider from '../pi';

describe('PiProvider', () => {
  describe('RED: provider name', () => {
    it('should have name "pi"', () => {
      expect(piProvider.name).toBe('pi');
    });
  });

  describe('RED: listModels', () => {
    it('should return non-empty array', () => {
      const models = piProvider.listModels();
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include Anthropic models', () => {
      const models = piProvider.listModels();
      const anthropicModels = models.filter(m => m.id.startsWith('anthropic/'));
      expect(anthropicModels.length).toBeGreaterThan(0);
    });

    it('should include OpenAI models', () => {
      const models = piProvider.listModels();
      const openaiModels = models.filter(m => m.id.startsWith('openai/'));
      expect(openaiModels.length).toBeGreaterThan(0);
    });

    it('should include Google models', () => {
      const models = piProvider.listModels();
      const googleModels = models.filter(m => m.id.startsWith('google/'));
      expect(googleModels.length).toBeGreaterThan(0);
    });

    it('should have exactly one default model', () => {
      const models = piProvider.listModels();
      const defaultModels = models.filter(m => m.isDefault);
      expect(defaultModels).toHaveLength(1);
    });

    it('should have claude-3-5-sonnet-latest as default', () => {
      const models = piProvider.listModels();
      const defaultModel = models.find(m => m.isDefault);
      expect(defaultModel?.id).toBe('anthropic/claude-3-5-sonnet-latest');
    });

    it('should have proper display names', () => {
      const models = piProvider.listModels();
      models.forEach(model => {
        expect(model.displayName).toBeTruthy();
        expect(model.displayName).toContain('via Pi');
      });
    });
  });
});
