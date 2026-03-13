import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PiEventStream } from '../pi-event-stream';
import type { PiRpcEvent } from '../pi-rpc-types';

describe('PiEventStream', () => {
  let stream: PiEventStream;
  let events: PiRpcEvent[];

  beforeEach(() => {
    events = [];
    stream = new PiEventStream((event) => {
      events.push(event);
    });
  });

  describe('event parsing', () => {
    it('should parse agent_start event', () => {
      const line = '{"type":"agent_start"}\n';
      stream.processLine(line);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('agent_start');
    });

    it('should parse text_delta event', () => {
      const line = '{"type":"text_delta","delta":"Hello","index":0}\n';
      stream.processLine(line);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('text_delta');
      if (events[0].type === 'text_delta') {
        expect(events[0].delta).toBe('Hello');
      }
    });

    it('should parse thinking_delta event', () => {
      const line = '{"type":"thinking_delta","delta":"Thinking...","index":0}\n';
      stream.processLine(line);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('thinking_delta');
    });

    it('should ignore invalid events', () => {
      const line = '{"invalid":"data"}\n';
      stream.processLine(line);
      expect(events).toHaveLength(0);
    });

    it('should ignore responses (not events)', () => {
      const line = '{"id":"123","type":"response","command":"prompt","success":true}\n';
      stream.processLine(line);
      expect(events).toHaveLength(0);
    });
  });

  describe('event callback', () => {
    it('should call callback for each event', () => {
      const callback = vi.fn();
      const s = new PiEventStream(callback);
      
      s.processLine('{"type":"agent_start"}\n');
      s.processLine('{"type":"text_delta","delta":"Hi","index":0}\n');
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should provide event to callback', () => {
      const callback = vi.fn();
      const s = new PiEventStream(callback);
      
      s.processLine('{"type":"agent_start"}\n');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'agent_start' })
      );
    });
  });

  describe('multiple events', () => {
    it('should handle stream of events', () => {
      stream.processLine('{"type":"agent_start"}\n');
      stream.processLine('{"type":"text_delta","delta":"H","index":0}\n');
      stream.processLine('{"type":"text_delta","delta":"i","index":0}\n');
      stream.processLine('{"type":"message_end","message":{"role":"assistant","content":"Hi"}}\n');
      
      expect(events).toHaveLength(4);
      expect(events[0].type).toBe('agent_start');
      expect(events[1].type).toBe('text_delta');
      expect(events[2].type).toBe('text_delta');
      expect(events[3].type).toBe('message_end');
    });
  });
});
