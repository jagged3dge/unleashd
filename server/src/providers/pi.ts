import type { ModelInfo } from '@unleashd/shared';
import type { Provider } from './index';

/**
 * Pi provider configuration.
 * 
 * Pi is a universal AI agent CLI that provides access to multiple AI providers
 * (Anthropic, OpenAI, Google) through a single interface with RPC mode support.
 * 
 * Models are specified in the format: provider/model[:thinking_level]
 * Example: anthropic/claude-3-5-sonnet-latest:high
 */

/**
 * Available models through Pi.
 * Pi supports models from multiple providers with optional thinking levels.
 */
const PI_MODELS: ModelInfo[] = [
  // Anthropic models
  {
    id: 'anthropic/claude-3-5-sonnet-latest',
    displayName: 'Claude 3.5 Sonnet (via Pi)',
    isDefault: true,
  },
  {
    id: 'anthropic/claude-3-5-haiku-latest',
    displayName: 'Claude 3.5 Haiku (via Pi)',
    isDefault: false,
  },
  {
    id: 'anthropic/claude-3-opus-latest',
    displayName: 'Claude 3 Opus (via Pi)',
    isDefault: false,
  },
  
  // OpenAI models
  {
    id: 'openai/gpt-4o',
    displayName: 'GPT-4o (via Pi)',
    isDefault: false,
  },
  {
    id: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o Mini (via Pi)',
    isDefault: false,
  },
  {
    id: 'openai/o1',
    displayName: 'OpenAI o1 (via Pi)',
    isDefault: false,
  },
  {
    id: 'openai/o1-mini',
    displayName: 'OpenAI o1-mini (via Pi)',
    isDefault: false,
  },
  
  // Google models
  {
    id: 'google/gemini-2.0-flash-thinking-exp-1219',
    displayName: 'Gemini 2.0 Flash Thinking (via Pi)',
    isDefault: false,
  },
  {
    id: 'google/gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash (via Pi)',
    isDefault: false,
  },
  {
    id: 'google/gemini-1.5-pro-latest',
    displayName: 'Gemini 1.5 Pro (via Pi)',
    isDefault: false,
  },
];

const piProvider: Provider = {
  name: 'pi',

  listModels(): ModelInfo[] {
    return PI_MODELS;
  },
};

export default piProvider;
