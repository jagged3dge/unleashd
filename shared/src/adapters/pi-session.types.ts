/**
 * Pi Session Type Definitions
 *
 * Zod schemas and TypeScript types for pi JSONL session format.
 * These types match the format documented in pi-session-format.md
 */

import { z } from 'zod';

// =============================================================================
// Content Blocks
// =============================================================================

/**
 * Text content block
 */
const TextBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

/**
 * Thinking content block (extended thinking)
 */
export const PiThinkingBlockSchema = z.object({
  type: z.literal('thinking'),
  thinking: z.string(),
});

/**
 * Tool use block
 */
const ToolUseBlockSchema = z.object({
  type: z.literal('toolUse'),
  id: z.string(),
  name: z.string(),
  input: z.record(z.any()),
});

/**
 * Image block
 */
const ImageBlockSchema = z.object({
  type: z.literal('image'),
  source: z.object({
    type: z.string(),
    media_type: z.string().optional(),
    data: z.string().optional(),
    url: z.string().optional(),
  }),
});

/**
 * Union of all content block types
 */
const ContentBlockSchema = z.union([
  TextBlockSchema,
  PiThinkingBlockSchema,
  ToolUseBlockSchema,
  ImageBlockSchema,
]);

// =============================================================================
// Cost and Usage
// =============================================================================

/**
 * Cost information for API usage
 */
export const PiCostInfoSchema = z.object({
  input: z.number(),
  output: z.number(),
  cacheRead: z.number().optional(),
  cacheWrite: z.number().optional(),
  total: z.number(),
});

export type PiCostInfo = z.infer<typeof PiCostInfoSchema>;

/**
 * Token usage statistics
 */
export const PiUsageStatsSchema = z.object({
  input: z.number(),
  output: z.number(),
  cacheRead: z.number().optional(),
  cacheWrite: z.number().optional(),
  cost: PiCostInfoSchema.optional(),
});

export type PiUsageStats = z.infer<typeof PiUsageStatsSchema>;

// =============================================================================
// Message Types
// =============================================================================

/**
 * User message
 */
export const PiUserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.union([
    z.string(),
    z.array(ContentBlockSchema),
  ]),
  timestamp: z.number(),
  attachments: z.array(z.any()).optional(),
});

export type PiUserMessage = z.infer<typeof PiUserMessageSchema>;

/**
 * Assistant message
 */
export const PiAssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z.array(ContentBlockSchema),
  api: z.string(),
  provider: z.string(),
  model: z.string(),
  usage: PiUsageStatsSchema.optional(),
  stopReason: z.enum(['end_turn', 'max_tokens', 'tool_use', 'error', 'aborted']).optional(),
  timestamp: z.number(),
});

export type PiAssistantMessage = z.infer<typeof PiAssistantMessageSchema>;

/**
 * Tool result message
 */
export const PiToolResultMessageSchema = z.object({
  role: z.literal('toolResult'),
  toolUseId: z.string(),
  toolName: z.string(),
  content: z.array(ContentBlockSchema),
  isError: z.boolean(),
  timestamp: z.number(),
});

export type PiToolResultMessage = z.infer<typeof PiToolResultMessageSchema>;

/**
 * System message (for compaction summaries)
 */
export const PiSystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
  type: z.literal('compaction').optional(),
  timestamp: z.number(),
  originalMessages: z.number().optional(),
});

export type PiSystemMessage = z.infer<typeof PiSystemMessageSchema>;

/**
 * Union of all session entry types
 */
export const PiSessionEntrySchema = z.discriminatedUnion('role', [
  PiUserMessageSchema,
  PiAssistantMessageSchema,
  PiToolResultMessageSchema,
  PiSystemMessageSchema,
]);

export type PiSessionEntry = z.infer<typeof PiSessionEntrySchema>;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if object is a valid PiUserMessage
 */
export function isPiUserMessage(obj: unknown): obj is PiUserMessage {
  return PiUserMessageSchema.safeParse(obj).success;
}

/**
 * Check if object is a valid PiAssistantMessage
 */
export function isPiAssistantMessage(obj: unknown): obj is PiAssistantMessage {
  return PiAssistantMessageSchema.safeParse(obj).success;
}

/**
 * Check if object is a valid PiToolResultMessage
 */
export function isPiToolResult(obj: unknown): obj is PiToolResultMessage {
  return PiToolResultMessageSchema.safeParse(obj).success;
}

/**
 * Check if object is a valid PiSystemMessage
 */
export function isPiSystemMessage(obj: unknown): obj is PiSystemMessage {
  return PiSystemMessageSchema.safeParse(obj).success;
}

/**
 * Check if object is any valid PiSessionEntry
 */
export function isPiSessionEntry(obj: unknown): obj is PiSessionEntry {
  return PiSessionEntrySchema.safeParse(obj).success;
}

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Thinking block type
 */
export type PiThinkingBlock = z.infer<typeof PiThinkingBlockSchema>;

/**
 * Text block type
 */
export type PiTextBlock = z.infer<typeof TextBlockSchema>;

/**
 * Tool use block type
 */
export type PiToolUseBlock = z.infer<typeof ToolUseBlockSchema>;

/**
 * Content block union type
 */
export type PiContentBlock = z.infer<typeof ContentBlockSchema>;
