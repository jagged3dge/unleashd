import { describe, it, expect } from 'vitest';
import {
  isPiRpcCommand,
  isPiRpcResponse,
  isPiRpcEvent,
  PiRpcCommandSchema,
  PiRpcResponseSchema,
  PiRpcEventSchema,
  type PiRpcCommand,
  type PiRpcResponse,
  type PiRpcEvent,
} from '../pi-rpc-types';

describe('Pi RPC Types', () => {
  describe('RED: PiRpcCommand validation', () => {
    it('should validate prompt command', () => {
      const cmd: PiRpcCommand = {
        type: 'prompt',
        id: '123',
        message: 'Hello',
      };
      const result = PiRpcCommandSchema.safeParse(cmd);
      expect(result.success).toBe(true);
    });

    it('should validate steer command', () => {
      const cmd: PiRpcCommand = {
        type: 'steer',
        id: '123',
        message: 'Go this way',
      };
      const result = PiRpcCommandSchema.safeParse(cmd);
      expect(result.success).toBe(true);
    });

    it('should validate abort command', () => {
      const cmd: PiRpcCommand = {
        type: 'abort',
        id: '123',
      };
      const result = PiRpcCommandSchema.safeParse(cmd);
      expect(result.success).toBe(true);
    });

    it('should validate set_model command', () => {
      const cmd: PiRpcCommand = {
        type: 'set_model',
        id: '123',
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-latest',
      };
      const result = PiRpcCommandSchema.safeParse(cmd);
      expect(result.success).toBe(true);
    });

    it('should reject invalid command type', () => {
      const cmd = {
        type: 'invalid',
        id: '123',
      };
      const result = PiRpcCommandSchema.safeParse(cmd);
      expect(result.success).toBe(false);
    });
  });

  describe('RED: PiRpcResponse validation', () => {
    it('should validate successful response', () => {
      const response: PiRpcResponse = {
        id: '123',
        type: 'response',
        command: 'prompt',
        success: true,
        data: { result: 'ok' },
      };
      const result = PiRpcResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should validate error response', () => {
      const response: PiRpcResponse = {
        id: '123',
        type: 'response',
        command: 'prompt',
        success: false,
        error: 'Something went wrong',
      };
      const result = PiRpcResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe('RED: PiRpcEvent validation', () => {
    it('should validate agent_start event', () => {
      const event: PiRpcEvent = {
        type: 'agent_start',
      };
      const result = PiRpcEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate text_delta event', () => {
      const event: PiRpcEvent = {
        type: 'text_delta',
        delta: 'Hello ',
        index: 0,
      };
      const result = PiRpcEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate thinking_delta event', () => {
      const event: PiRpcEvent = {
        type: 'thinking_delta',
        delta: 'Let me think...',
        index: 0,
      };
      const result = PiRpcEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate tool_execution_start event', () => {
      const event: PiRpcEvent = {
        type: 'tool_execution_start',
        toolCallId: 'call_123',
        toolName: 'read',
        args: { file: 'test.ts' },
      };
      const result = PiRpcEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate message_end event', () => {
      const event: PiRpcEvent = {
        type: 'message_end',
        message: {
          role: 'assistant',
          content: 'Done',
        },
      };
      const result = PiRpcEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe('RED: Type guards', () => {
    it('should identify PiRpcCommand', () => {
      const cmd = { type: 'prompt', id: '123', message: 'test' };
      expect(isPiRpcCommand(cmd)).toBe(true);
    });

    it('should identify PiRpcResponse', () => {
      const response = {
        id: '123',
        type: 'response',
        command: 'prompt',
        success: true,
      };
      expect(isPiRpcResponse(response)).toBe(true);
    });

    it('should identify PiRpcEvent', () => {
      const event = { type: 'agent_start' };
      expect(isPiRpcEvent(event)).toBe(true);
    });

    it('should reject non-RPC objects', () => {
      const obj = { random: 'data' };
      expect(isPiRpcCommand(obj)).toBe(false);
      expect(isPiRpcResponse(obj)).toBe(false);
      expect(isPiRpcEvent(obj)).toBe(false);
    });
  });
});
