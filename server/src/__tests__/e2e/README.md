# End-to-End Testing for Pi Provider

## Overview

These E2E tests verify the complete integration of the Pi provider with unleashd, using the **real pi binary** in RPC mode.

## Test Philosophy: TDD

Following Test-Driven Development:
- **RED**: Tests written first, they FAIL (current state)
- **GREEN**: Implement features to make tests pass
- **REFACTOR**: Clean up implementation while keeping tests green

## Current Status: 🔴 RED (All Tests Failing)

```
Test Files  1 failed (1)
Tests       10 failed (10)
```

**Expected!** These tests drive the implementation.

## Prerequisites

### 1. Install Pi CLI

```bash
npm install -g @anthropic-ai/pi
```

Verify installation:
```bash
which pi
# Should output: /usr/local/bin/pi (or similar)
```

### 2. Configure API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or create `.env` file in project root:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Build the Project

```bash
pnpm build
```

## Running E2E Tests

### Full E2E Suite (with real API)

```bash
# Set API key first
export ANTHROPIC_API_KEY="sk-ant-..."

# Run E2E tests
pnpm test:e2e
```

### Skip if Binary Missing

Tests automatically skip if:
- `pi` binary not found
- `ANTHROPIC_API_KEY` not set

You'll see:
```
⚠️  Pi binary not found - skipping E2E tests
   Install with: npm install -g @anthropic-ai/pi
```

### Run Specific Test

```bash
pnpm test:e2e --grep "should send message"
```

## Test Coverage

### ✅ Infrastructure Tests (work without API)
1. **Server Startup** - Spawns server on test port
2. **WebSocket Connection** - Establishes WS connection
3. **HTTP API** - REST endpoints respond
4. **Conversation Creation** - POST /api/conversations

### 🔴 Integration Tests (need real pi binary)
5. **Message Sending** - Send message, receive response
6. **Message Persistence** - Messages saved to conversation
7. **Thinking Blocks** - High thinking mode
8. **Queue Processing** - Multiple messages sequentially
9. **Stop/Resume** - Conversation lifecycle
10. **Tool Execution** - Read file tool
11. **Session Resume** - Resume after restart
12. **Streaming** - Real-time chunk delivery

## Expected Failures (TDD RED phase)

### Test 2: "should send message to pi and receive text response"
```
Error: Timeout waiting for event type: stream_chunk
```
**Why:** We don't broadcast stream chunks yet (only log them)
**Fix:** Implement streaming in sendMessageViaRpc()

### Test 3: "should persist messages to conversation history"
```
AssertionError: expected undefined to be defined
```
**Why:** Messages not saved to conversation.messages
**Fix:** Accumulate text chunks and persist on message_complete

### Test 4: "should receive and display thinking blocks"
```
Error: Timeout waiting for event type: thinking_chunk
```
**Why:** Thinking events not broadcast
**Fix:** Broadcast thinking events to WebSocket

### Test 8: "should execute read_file tool"
```
Error: Timeout waiting for event type: tool_use
```
**Why:** Tool execution not implemented
**Fix:** Handle tool_use events and execute tools

### Test 9: "should resume existing session"
```
AssertionError: expected '' to contain 'testuser'
```
**Why:** Session resume not fully wired
**Fix:** Pass sessionId and resume: true to RPC client

## Test Utilities

### EventCollector

Collects WebSocket events for assertions:

```typescript
const collector = new EventCollector(websocket);

// Wait for specific event
const event = await collector.waitForEvent('stream_chunk', 5000);

// Get all events of type
const chunks = collector.getEventsByType('stream_chunk');

// Clear for next test
collector.clear();
```

### Request Helper

Simple HTTP wrapper:

```typescript
const conversation = await request('POST', '/api/conversations', {
  provider: 'pi',
  model: 'sonnet',
});
```

### WaitFor Helper

Poll for conditions:

```typescript
await waitFor(async () => {
  const state = await request('GET', `/api/conversations/${id}`);
  return !state.isRunning;
}, 5000);
```

## Development Workflow

### 1. Run Tests (RED)
```bash
pnpm test:e2e
```

All tests should fail with clear error messages.

### 2. Implement Feature (GREEN)
```bash
# Fix streaming
vim server/src/server.ts

# Run tests again
pnpm test:e2e
```

Tests start passing one by one.

### 3. Refactor (REFACTOR)
```bash
# Clean up code
# Run tests to ensure nothing broke
pnpm test:e2e
```

All tests still pass.

## Debugging

### Verbose Server Output

```bash
VERBOSE=1 pnpm test:e2e
```

### Check Server Logs

Server stderr/stdout printed during tests:
```
Server stderr: [conv-123] Pi event: text
Server stderr: [conv-123] Pi text chunk: Hello!
```

### Manual Testing

Start server and test manually:

```bash
# Terminal 1: Start server
PORT=3456 pnpm start

# Terminal 2: Create conversation
curl -X POST http://localhost:3456/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"provider":"pi","model":"sonnet"}'

# Send message
curl -X POST http://localhost:3456/api/queue-message \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"<ID>","content":"Hello!"}'

# Watch WebSocket
websocat ws://localhost:3456
```

## Performance

E2E tests make real API calls, which are:
- **Slow**: 5-30 seconds per test
- **Expensive**: Use real API credits
- **Flaky**: Network/API issues

Run sparingly:
- ✅ Before major commits
- ✅ CI/CD pipeline
- ❌ Not on every file save

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install pi CLI
        run: npm install -g @anthropic-ai/pi
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Run E2E tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: pnpm test:e2e
```

## Cost Estimation

Approximate API costs per test run:
- Test 2 (send message): ~$0.01
- Test 3 (persistence): ~$0.01
- Test 4 (thinking): ~$0.03 (high thinking)
- Test 5 (multiple messages): ~$0.03
- Test 8 (tool execution): ~$0.02
- Test 9 (resume): ~$0.02

**Total per run:** ~$0.12

**100 runs:** ~$12

Use wisely! Consider mock tests for rapid iteration.

## Next Steps

1. ✅ Tests written (RED phase complete)
2. ⏭️ Implement streaming (GREEN phase)
3. ⏭️ Implement persistence (GREEN phase)
4. ⏭️ Implement thinking (GREEN phase)
5. ⏭️ Implement tools (GREEN phase)
6. ⏭️ Implement resume (GREEN phase)
7. ⏭️ All tests pass (GREEN complete)
8. ⏭️ Refactor if needed (REFACTOR phase)

## References

- TDD: https://en.wikipedia.org/wiki/Test-driven_development
- Pi CLI Docs: https://github.com/anthropics/anthropic-sdk-typescript
- Vitest E2E: https://vitest.dev/guide/
- WebSocket Testing: https://github.com/websockets/ws
