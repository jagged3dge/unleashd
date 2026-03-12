/**
 * Pi RPC Protocol Type Definitions
 *
 * This module defines the complete type system for bidirectional RPC communication
 * with the Pi agent CLI process. The protocol consists of:
 *
 * 1. Commands (client → pi): Actions to perform
 * 2. Responses (pi → client): Correlated command results
 * 3. Events (pi → client): Streaming updates (no correlation)
 *
 * Protocol Flow:
 * - Client sends PiRpcCommand with unique ID
 * - Pi sends PiRpcResponse with matching ID
 * - Pi emits PiRpcEvents during processing (no ID)
 */

import { z } from 'zod';

// =============================================================================
// Command Types (Client → Pi)
// =============================================================================

/**
 * Prompt command - send a new message to the agent
 */
const PromptCommandSchema = z.object({
  type: z.literal('prompt'),
  id: z.string(),
  message: z.string(),
  images: z.array(z.any()).optional(), // ImageContent from pi
});

/**
 * Steer command - interrupt and redirect agent's current task
 */
const SteerCommandSchema = z.object({
  type: z.literal('steer'),
  id: z.string(),
  message: z.string(),
});

/**
 * Follow-up command - continue conversation with additional context
 */
const FollowUpCommandSchema = z.object({
  type: z.literal('follow_up'),
  id: z.string(),
  message: z.string(),
});

/**
 * Abort command - cancel current agent operation
 */
const AbortCommandSchema = z.object({
  type: z.literal('abort'),
  id: z.string(),
});

/**
 * Set model command - change the AI model
 */
const SetModelCommandSchema = z.object({
  type: z.literal('set_model'),
  id: z.string(),
  provider: z.string(),
  modelId: z.string(),
});

/**
 * Set thinking level command - adjust reasoning depth
 */
const SetThinkingLevelSchema = z.object({
  type: z.literal('set_thinking_level'),
  id: z.string(),
  level: z.enum(['off', 'minimal', 'low', 'medium', 'high', 'xhigh']),
});

/**
 * Union of all command types
 */
export const PiRpcCommandSchema = z.discriminatedUnion('type', [
  PromptCommandSchema,
  SteerCommandSchema,
  FollowUpCommandSchema,
  AbortCommandSchema,
  SetModelCommandSchema,
  SetThinkingLevelSchema,
]);

export type PiRpcCommand = z.infer<typeof PiRpcCommandSchema>;

// =============================================================================
// Response Types (Pi → Client, Correlated)
// =============================================================================

/**
 * Response to a command - always includes the original command ID
 */
export const PiRpcResponseSchema = z.object({
  id: z.string(), // Matches command ID
  type: z.literal('response'),
  command: z.string(), // Command type that was executed
  success: z.boolean(),
  data: z.any().optional(), // Success payload
  error: z.string().optional(), // Error message
});

export type PiRpcResponse = z.infer<typeof PiRpcResponseSchema>;

// =============================================================================
// Event Types (Pi → Client, Streaming)
// =============================================================================

/**
 * Agent started processing
 */
const AgentStartEventSchema = z.object({
  type: z.literal('agent_start'),
});

/**
 * Text delta - streaming text content
 */
const TextDeltaEventSchema = z.object({
  type: z.literal('text_delta'),
  delta: z.string(),
  index: z.number(),
});

/**
 * Thinking delta - streaming reasoning content
 */
const ThinkingDeltaEventSchema = z.object({
  type: z.literal('thinking_delta'),
  delta: z.string(),
  index: z.number(),
});

/**
 * Tool execution started
 */
const ToolExecutionStartEventSchema = z.object({
  type: z.literal('tool_execution_start'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.any(),
});

/**
 * Tool execution completed
 */
const ToolExecutionEndEventSchema = z.object({
  type: z.literal('tool_execution_end'),
  toolCallId: z.string(),
  result: z.any(),
  isError: z.boolean(),
});

/**
 * Message completed
 */
const MessageEndEventSchema = z.object({
  type: z.literal('message_end'),
  message: z.object({
    role: z.string(),
    content: z.any(),
  }),
});

/**
 * Agent finished processing (final event)
 */
const AgentEndEventSchema = z.object({
  type: z.literal('agent_end'),
  messages: z.array(z.any()).optional(),
});

/**
 * Auto-compaction started
 */
const AutoCompactionStartEventSchema = z.object({
  type: z.literal('auto_compaction_start'),
});

/**
 * Auto-compaction ended
 */
const AutoCompactionEndEventSchema = z.object({
  type: z.literal('auto_compaction_end'),
  summary: z.string().optional(),
});

/**
 * Union of all event types
 */
export const PiRpcEventSchema = z.discriminatedUnion('type', [
  AgentStartEventSchema,
  TextDeltaEventSchema,
  ThinkingDeltaEventSchema,
  ToolExecutionStartEventSchema,
  ToolExecutionEndEventSchema,
  MessageEndEventSchema,
  AgentEndEventSchema,
  AutoCompactionStartEventSchema,
  AutoCompactionEndEventSchema,
]);

export type PiRpcEvent = z.infer<typeof PiRpcEventSchema>;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if an object is a valid PiRpcCommand
 */
export function isPiRpcCommand(obj: unknown): obj is PiRpcCommand {
  return PiRpcCommandSchema.safeParse(obj).success;
}

/**
 * Check if an object is a valid PiRpcResponse
 */
export function isPiRpcResponse(obj: unknown): obj is PiRpcResponse {
  return PiRpcResponseSchema.safeParse(obj).success;
}

/**
 * Check if an object is a valid PiRpcEvent
 */
export function isPiRpcEvent(obj: unknown): obj is PiRpcEvent {
  return PiRpcEventSchema.safeParse(obj).success;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extract the type field from a command
 */
export type CommandType = PiRpcCommand['type'];

/**
 * Extract the type field from an event
 */
export type EventType = PiRpcEvent['type'];

/**
 * Thinking levels supported by pi
 */
export type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
