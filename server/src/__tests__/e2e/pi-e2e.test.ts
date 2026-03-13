/**
 * End-to-End Tests for Pi Provider Integration
 * 
 * These tests use the REAL pi binary in RPC mode.
 * Following TDD: These tests SHOULD FAIL initially and drive implementation.
 * 
 * Requirements:
 * - Pi CLI installed: npm install -g @anthropic-ai/pi
 * - API key configured: ANTHROPIC_API_KEY environment variable
 * 
 * Test Strategy:
 * - Spawn real server process
 * - Create real pi conversations
 * - Send real messages to pi
 * - Verify responses, persistence, streaming
 * - Clean up processes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { WebSocket } from 'ws';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Test configuration
const SERVER_PORT = 3456; // Different from default to avoid conflicts
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const WS_URL = `ws://localhost:${SERVER_PORT}`;
const TEST_TIMEOUT = 60000; // 60 seconds for real API calls

interface TestContext {
  serverProcess: ChildProcess | null;
  websocket: WebSocket | null;
  testDir: string;
  conversationId: string | null;
}

const ctx: TestContext = {
  serverProcess: null,
  websocket: null,
  testDir: '',
  conversationId: null,
};

/**
 * Helper: Wait for condition with timeout
 */
async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Helper: Start server process
 */
async function startServer(): Promise<ChildProcess> {
  const serverProcess = spawn('node', ['dist/server.js'], {
    cwd: path.join(__dirname, '../../../'),
    env: {
      ...process.env,
      PORT: SERVER_PORT.toString(),
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server failed to start within 10 seconds'));
    }, 10000);

    serverProcess.stdout?.on('data', (chunk) => {
      const output = chunk.toString();
      if (output.includes('WebSocket server ready') || output.includes('Server listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr?.on('data', (chunk) => {
      console.error('Server stderr:', chunk.toString());
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  return serverProcess;
}

/**
 * Helper: Stop server process
 */
async function stopServer(proc: ChildProcess): Promise<void> {
  if (!proc.pid) return;
  
  proc.kill('SIGTERM');
  
  try {
    await Promise.race([
      once(proc, 'exit'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Server did not exit')), 5000)
      ),
    ]);
  } catch {
    proc.kill('SIGKILL');
  }
}

/**
 * Helper: Create WebSocket connection
 */
async function connectWebSocket(): Promise<WebSocket> {
  const ws = new WebSocket(WS_URL);
  
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
    setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
  });

  return ws;
}

/**
 * Helper: HTTP request wrapper
 */
async function request<T = any>(
  method: string,
  endpoint: string,
  body?: any
): Promise<T> {
  const url = `${SERVER_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

/**
 * Helper: Collect WebSocket events
 */
class EventCollector {
  private events: any[] = [];
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        this.events.push(event);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', data.toString());
      }
    });
  }

  getEvents(): any[] {
    return this.events;
  }

  getEventsByType(type: string): any[] {
    return this.events.filter(e => e.type === type);
  }

  waitForEvent(type: string, timeout = 5000): Promise<any> {
    const existing = this.events.find(e => e.type === type);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event type: ${type}`));
      }, timeout);

      const handler = (data: Buffer) => {
        try {
          const event = JSON.parse(data.toString());
          if (event.type === type) {
            clearTimeout(timer);
            this.ws.off('message', handler);
            resolve(event);
          }
        } catch (error) {
          // Ignore parse errors
        }
      };

      this.ws.on('message', handler);
    });
  }

  clear(): void {
    this.events = [];
  }
}

// =============================================================================
// TEST SUITE: Pi Provider E2E Tests
// =============================================================================

describe('Pi Provider E2E Tests', () => {
  
  beforeAll(async () => {
    // Skip if pi binary not installed
    try {
      const { execSync } = require('node:child_process');
      execSync('which pi', { stdio: 'ignore' });
    } catch {
      console.warn('⚠️  Pi binary not found - skipping E2E tests');
      console.warn('   Install with: npm install -g @anthropic-ai/pi');
      return;
    }

    // Skip if no API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set - skipping E2E tests');
      return;
    }

    // Create temporary test directory
    ctx.testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pi-e2e-test-'));
    
    // Start server
    console.log('Starting test server...');
    ctx.serverProcess = await startServer();
    console.log('Test server started');

  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Stop server
    if (ctx.serverProcess) {
      await stopServer(ctx.serverProcess);
    }

    // Cleanup test directory
    if (ctx.testDir) {
      await fs.rm(ctx.testDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    // Connect WebSocket
    ctx.websocket = await connectWebSocket();
  });

  afterEach(async () => {
    // Delete conversation if created
    if (ctx.conversationId) {
      try {
        await request('DELETE', `/api/conversations/${ctx.conversationId}`);
      } catch {
        // Ignore deletion errors
      }
      ctx.conversationId = null;
    }

    // Close WebSocket
    if (ctx.websocket) {
      ctx.websocket.close();
      ctx.websocket = null;
    }
  });

  // ===========================================================================
  // TEST 1: Create Pi Conversation
  // ===========================================================================
  
  it('should create a pi conversation via HTTP API', async () => {
    const response = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.provider).toBe('pi');
    expect(response.model).toBe('sonnet');
    
    ctx.conversationId = response.id;
  });

  // ===========================================================================
  // TEST 2: Send Message and Receive Response
  // ===========================================================================
  
  it('should send message to pi and receive text response', async () => {
    // Create conversation
    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    // Set up event collector
    const collector = new EventCollector(ctx.websocket!);

    // Send message
    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Say exactly: "Hello from Pi E2E test"',
    });

    // Wait for text response events
    // EXPECTED TO FAIL: We don't broadcast stream chunks yet
    const textEvent = await collector.waitForEvent('stream_chunk', 10000);
    expect(textEvent).toBeDefined();
    expect(textEvent.chunk).toContain('Hello');

    // Wait for completion
    const completeEvent = await collector.waitForEvent('message_complete', 30000);
    expect(completeEvent).toBeDefined();
    expect(completeEvent.conversationId).toBe(ctx.conversationId);

  }, TEST_TIMEOUT);

  // ===========================================================================
  // TEST 3: Message Persistence
  // ===========================================================================
  
  it('should persist messages to conversation history', async () => {
    // Create conversation
    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    const collector = new EventCollector(ctx.websocket!);

    // Send message
    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Reply with: "Test message"',
    });

    // Wait for completion
    await collector.waitForEvent('message_complete', 30000);

    // Get conversation state
    const state = await request('GET', `/api/conversations/${ctx.conversationId}`);

    // EXPECTED TO FAIL: Messages not persisted yet
    expect(state.messages).toBeDefined();
    expect(state.messages.length).toBeGreaterThanOrEqual(2); // user + assistant
    
    const userMessage = state.messages.find((m: any) => m.role === 'user');
    expect(userMessage).toBeDefined();
    expect(userMessage.content).toContain('Test message');
    
    const assistantMessage = state.messages.find((m: any) => m.role === 'assistant');
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage.content).toBeTruthy();

  }, TEST_TIMEOUT);

  // ===========================================================================
  // TEST 4: Thinking Blocks
  // ===========================================================================
  
  it('should receive and display thinking blocks', async () => {
    // Create conversation with high thinking level
    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet:high', // High thinking mode
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    const collector = new EventCollector(ctx.websocket!);

    // Send message that requires thinking
    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Explain the SOLID principles in software design.',
    });

    // EXPECTED TO FAIL: Thinking events not broadcast yet
    const thinkingEvent = await collector.waitForEvent('thinking_chunk', 30000);
    expect(thinkingEvent).toBeDefined();
    expect(thinkingEvent.thinking).toBeTruthy();

    // Wait for completion
    await collector.waitForEvent('message_complete', 60000);

    // Verify thinking in message
    const state = await request('GET', `/api/conversations/${ctx.conversationId}`);
    const assistantMessage = state.messages.find((m: any) => m.role === 'assistant');
    
    // EXPECTED TO FAIL: Thinking blocks not stored yet
    expect(assistantMessage.thinking).toBeDefined();
    expect(assistantMessage.thinking.length).toBeGreaterThan(0);

  }, TEST_TIMEOUT);

  // ===========================================================================
  // TEST 5: Multiple Messages (Queue Processing)
  // ===========================================================================
  
  it('should process multiple queued messages sequentially', async () => {
    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    const collector = new EventCollector(ctx.websocket!);

    // Queue 3 messages
    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Message 1: Reply with "First"',
    });

    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Message 2: Reply with "Second"',
    });

    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Message 3: Reply with "Third"',
    });

    // Wait for all 3 completions
    await collector.waitForEvent('message_complete', 30000);
    await collector.waitForEvent('message_complete', 30000);
    await collector.waitForEvent('message_complete', 30000);

    // Verify all messages processed
    const state = await request('GET', `/api/conversations/${ctx.conversationId}`);
    
    // EXPECTED TO FAIL: Messages not persisted
    expect(state.messages.length).toBe(6); // 3 user + 3 assistant
    expect(state.queue.length).toBe(0); // All dequeued

  }, TEST_TIMEOUT);

  // ===========================================================================
  // TEST 6: Stop Conversation
  // ===========================================================================
  
  it('should stop running conversation', async () => {
    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    const collector = new EventCollector(ctx.websocket!);

    // Send long message
    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Write a very long essay about software architecture.',
    });

    // Wait a bit for it to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stop conversation
    ctx.websocket!.send(JSON.stringify({
      type: 'stop_conversation',
      conversationId: ctx.conversationId,
    }));

    // Verify status updated
    await waitFor(async () => {
      const state = await request('GET', `/api/conversations/${ctx.conversationId}`);
      return !state.isRunning;
    }, 5000);

    const state = await request('GET', `/api/conversations/${ctx.conversationId}`);
    expect(state.isRunning).toBe(false);

  }, TEST_TIMEOUT);

  // ===========================================================================
  // TEST 7: Error Handling (Invalid Model)
  // ===========================================================================
  
  it('should handle invalid model gracefully', async () => {
    // Try to create conversation with invalid model
    await expect(async () => {
      await request('POST', '/api/conversations', {
        provider: 'pi',
        model: 'invalid-model-xyz',
        workingDirectory: ctx.testDir,
      });
    }).rejects.toThrow();

  });

  // ===========================================================================
  // TEST 8: Tool Execution (Read File)
  // ===========================================================================
  
  it('should execute read_file tool', async () => {
    // Create test file
    const testFile = path.join(ctx.testDir, 'test.txt');
    await fs.writeFile(testFile, 'Hello from test file!');

    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    const collector = new EventCollector(ctx.websocket!);

    // Ask pi to read the file
    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: `Read the file test.txt and tell me what it contains.`,
    });

    // EXPECTED TO FAIL: Tool execution not implemented
    const toolEvent = await collector.waitForEvent('tool_use', 30000);
    expect(toolEvent).toBeDefined();
    expect(toolEvent.toolName).toBe('read_file');

    // Wait for completion
    await collector.waitForEvent('message_complete', 60000);

    // Verify response mentions file content
    const state = await request('GET', `/api/conversations/${ctx.conversationId}`);
    const assistantMessage = state.messages[state.messages.length - 1];
    expect(assistantMessage.content).toContain('Hello from test file');

  }, TEST_TIMEOUT);

  // ===========================================================================
  // TEST 9: Session Resume
  // ===========================================================================
  
  it('should resume existing session after server restart', async () => {
    // Create conversation and send message
    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    const collector = new EventCollector(ctx.websocket!);

    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'My name is TestUser',
    });

    await collector.waitForEvent('message_complete', 30000);

    // Get session ID
    const state1 = await request('GET', `/api/conversations/${ctx.conversationId}`);
    const sessionId = state1.sessionId;

    // "Restart server" by stopping and starting conversation
    // (In real scenario would restart actual server)
    ctx.websocket!.send(JSON.stringify({
      type: 'stop_conversation',
      conversationId: ctx.conversationId,
    }));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send another message (should resume)
    collector.clear();
    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'What is my name?',
    });

    await collector.waitForEvent('message_complete', 30000);

    // EXPECTED TO FAIL: Resume not fully implemented
    const state2 = await request('GET', `/api/conversations/${ctx.conversationId}`);
    const lastMessage = state2.messages[state2.messages.length - 1];
    
    // Should remember the name from previous message
    expect(lastMessage.content.toLowerCase()).toContain('testuser');

  }, TEST_TIMEOUT);

  // ===========================================================================
  // TEST 10: Streaming Performance
  // ===========================================================================
  
  it('should stream text chunks in real-time', async () => {
    const conversation = await request('POST', '/api/conversations', {
      provider: 'pi',
      model: 'sonnet',
      workingDirectory: ctx.testDir,
    });
    ctx.conversationId = conversation.id;

    const collector = new EventCollector(ctx.websocket!);
    const chunkTimestamps: number[] = [];

    // Track chunk arrival times
    ctx.websocket!.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        if (event.type === 'stream_chunk') {
          chunkTimestamps.push(Date.now());
        }
      } catch {
        // Ignore
      }
    });

    await request('POST', '/api/queue-message', {
      conversationId: ctx.conversationId,
      content: 'Count from 1 to 20, one number per line.',
    });

    await collector.waitForEvent('message_complete', 30000);

    // EXPECTED TO FAIL: Streaming not implemented
    expect(chunkTimestamps.length).toBeGreaterThan(5); // Should receive multiple chunks
    
    // Chunks should arrive over time, not all at once
    const firstChunk = chunkTimestamps[0];
    const lastChunk = chunkTimestamps[chunkTimestamps.length - 1];
    const duration = lastChunk - firstChunk;
    
    expect(duration).toBeGreaterThan(100); // Should take more than 100ms for streaming

  }, TEST_TIMEOUT);

});
