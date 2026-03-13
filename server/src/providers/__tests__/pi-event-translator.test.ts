import { describe, it, expect } from 'vitest';
import { PiEventTranslator } from '../pi-event-translator';
import type { PiRpcEvent } from '../pi-rpc-types';
import type { ProviderEvent } from '../index';

describe('PiEventTranslator', () => {
  const translator = new PiEventTranslator();

  describe('agent_start event', () => {
    it('should translate to message_start', () => {
      const piEvent: PiRpcEvent = { type: 'agent_start' };
      const result = translator.translate(piEvent);
      expect(result).toEqual({ type: 'message_start' });
    });
  });

  describe('text_delta event', () => {
    it('should translate to text_delta', () => {
      const piEvent: PiRpcEvent = {
        type: 'text_delta',
        delta: 'Hello',
        index: 0,
      };
      const result = translator.translate(piEvent);
      expect(result).toEqual({ type: 'text_delta', text: 'Hello' });
    });
  });

  describe('thinking_delta event', () => {
    it('should translate to text_delta with prefix', () => {
      const piEvent: PiRpcEvent = {
        type: 'thinking_delta',
        delta: 'Let me think...',
        index: 0,
      };
      const result = translator.translate(piEvent);
      expect(result).toEqual({
        type: 'text_delta',
        text: '[Thinking] Let me think...',
      });
    });
  });

  describe('tool_execution_start event', () => {
    it('should translate to tool_use', () => {
      const piEvent: PiRpcEvent = {
        type: 'tool_execution_start',
        toolCallId: 'call_123',
        toolName: 'bash',
        args: { command: 'ls' },
      };
      const result = translator.translate(piEvent);
      expect(result).toEqual({
        type: 'tool_use',
        name: 'bash',
        input: { command: 'ls' },
      });
    });
  });

  describe('message_end event', () => {
    it('should translate to message_complete with success', () => {
      const piEvent: PiRpcEvent = {
        type: 'message_end',
        message: { role: 'assistant', content: 'Done' },
      };
      const result = translator.translate(piEvent);
      expect(result).toEqual({
        type: 'message_complete',
        reason: 'success',
      });
    });
  });

  describe('agent_end event', () => {
    it('should translate to message_complete with success', () => {
      const piEvent: PiRpcEvent = {
        type: 'agent_end',
      };
      const result = translator.translate(piEvent);
      expect(result).toEqual({
        type: 'message_complete',
        reason: 'success',
      });
    });
  });

  describe('unhandled events', () => {
    it('should return null for tool_execution_end', () => {
      const piEvent: PiRpcEvent = {
        type: 'tool_execution_end',
        toolCallId: 'call_123',
        result: 'output',
        isError: false,
      };
      const result = translator.translate(piEvent);
      expect(result).toBeNull();
    });
  });
});
