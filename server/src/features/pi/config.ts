import { z } from 'zod';

export const PiConfigSchema = z.object({
  model: z.string(),
  thinking: z.enum(['off', 'minimal', 'low', 'medium', 'high', 'xhigh']),
  tools: z.array(z.string()).optional(),
  sessionDir: z.string().optional(),
});

export type PiConfig = z.infer<typeof PiConfigSchema>;

export function loadConfig(): PiConfig {
  return {
    model: 'sonnet',
    thinking: 'medium',
  };
}
