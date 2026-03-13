import { describe, it, expect, beforeEach } from 'vitest';
import { PiProtocolHandler } from '../pi-protocol-handler';
import type { PiRpcCommand, PiRpcResponse } from '../pi-rpc-types';

describe('PiProtocolHandler', () => {
  let handler: PiProtocolHandler;

  beforeEach(() => {
    handler = new PiProtocolHandler();
  });

  describe('command serialization', () => {
    it('should serialize prompt command to JSONL', () => {
      const cmd: PiRpcCommand = {
        type: 'prompt',
        id: '123',
        message: 'Hello',
      };
      const line = handler.serializeCommand(cmd);
      expect(line).toBe('{"type":"prompt","id":"123","message":"Hello"}\n');
    });

    it('should serialize abort command', () => {
      const cmd: PiRpcCommand = {
        type: 'abort',
        id: '456',
      };
      const line = handler.serializeCommand(cmd);
      expect(line).toContain('"type":"abort"');
      expect(line).toContain('"id":"456"');
      expect(line.endsWith('\n')).toBe(true);
    });

    it('should serialize set_model command', () => {
      const cmd: PiRpcCommand = {
        type: 'set_model',
        id: '789',
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-latest',
      };
      const line = handler.serializeCommand(cmd);
      expect(line).toContain('"type":"set_model"');
      expect(line).toContain('"provider":"anthropic"');
    });
  });

  describe('response parsing', () => {
    it('should parse successful response', () => {
      const line = '{"id":"123","type":"response","command":"prompt","success":true}\n';
      const response = handler.parseResponse(line);
      expect(response).toBeDefined();
      expect(response?.success).toBe(true);
      expect(response?.id).toBe('123');
    });

    it('should parse error response', () => {
      const line = '{"id":"456","type":"response","command":"prompt","success":false,"error":"Failed"}\n';
      const response = handler.parseResponse(line);
      expect(response?.success).toBe(false);
      expect(response?.error).toBe('Failed');
    });

    it('should return null for invalid JSON', () => {
      const line = 'not valid json\n';
      const response = handler.parseResponse(line);
      expect(response).toBeNull();
    });

    it('should return null for non-response lines', () => {
      const line = '{"type":"agent_start"}\n';
      const response = handler.parseResponse(line);
      expect(response).toBeNull();
    });
  });

  describe('line buffering', () => {
    it('should buffer partial lines', () => {
      const chunk1 = '{"type":"res';
      const chunk2 = 'ponse","id":"123"';
      const chunk3 = ',"success":true}\n';

      const lines1 = handler.processChunk(chunk1);
      expect(lines1).toHaveLength(0);

      const lines2 = handler.processChunk(chunk2);
      expect(lines2).toHaveLength(0);

      const lines3 = handler.processChunk(chunk3);
      expect(lines3).toHaveLength(1);
    });

    it('should handle multiple lines in one chunk', () => {
      const chunk = '{"type":"agent_start"}\n{"type":"text_delta","delta":"Hi"}\n';
      const lines = handler.processChunk(chunk);
      expect(lines).toHaveLength(2);
    });

    it('should handle line with partial at end', () => {
      const chunk = '{"type":"agent_start"}\n{"type":"text';
      const lines = handler.processChunk(chunk);
      expect(lines).toHaveLength(1);
    });
  });

  describe('correlation tracking', () => {
    it('should track pending commands', () => {
      const cmd: PiRpcCommand = {
        type: 'prompt',
        id: '123',
        message: 'test',
      };
      handler.trackCommand(cmd);
      expect(handler.isPending('123')).toBe(true);
    });

    it('should clear pending on response', () => {
      const cmd: PiRpcCommand = {
        type: 'prompt',
        id: '123',
        message: 'test',
      };
      handler.trackCommand(cmd);
      handler.clearPending('123');
      expect(handler.isPending('123')).toBe(false);
    });

    it('should timeout old commands', async () => {
      const cmd: PiRpcCommand = {
        type: 'prompt',
        id: '123',
        message: 'test',
      };
      handler.trackCommand(cmd);
      
      // Wait a bit then check timeout
      await new Promise(resolve => setTimeout(resolve, 10));
      const timedOut = handler.getTimedOutCommands(5); // 5ms timeout
      expect(timedOut.length).toBeGreaterThan(0);
      expect(timedOut[0].command.id).toBe('123');
    });
  });
});
