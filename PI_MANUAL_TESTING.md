# Manual Testing Guide for Pi RPC Integration

## Quick Start

Test Pi integration manually without running the full E2E suite.

### Prerequisites

1. **Install Pi CLI**
   ```bash
   npm install -g @anthropic-ai/pi
   ```

2. **Configure API Key**
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```

3. **Build Project**
   ```bash
   pnpm build
   ```

### Start Server

```bash
pnpm start
```

Server will start on `http://localhost:3000`

You should see:
```
WebSocket server ready on port 3000
Server running on http://localhost:3000
```

---

## Test 1: Create Pi Conversation (HTTP API)

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "pi",
    "model": "sonnet",
    "workingDirectory": "/tmp"
  }'
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "pi",
  "model": "anthropic/claude-3-5-sonnet-latest",
  "workingDirectory": "/tmp",
  "messages": [],
  "isRunning": false,
  "isStreaming": false,
  "queue": []
}
```

**Save the `id` for next steps!**

---

## Test 2: Send Message (Basic Flow)

Replace `<CONVERSATION_ID>` with the ID from Test 1:

```bash
curl -X POST http://localhost:3000/api/queue-message \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "<CONVERSATION_ID>",
    "content": "Say exactly: Hello from Pi!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "queueLength": 1
}
```

**Check Server Logs:**
```
[conv-123] Starting Pi RPC conversation
[conv-123] Creating new Pi conversation
[conv-123] Pi event: text
[conv-123] Pi text chunk: Hello from Pi!
[conv-123] Pi event: message_complete
[conv-123] Pi message complete
```

---

## Test 3: Get Conversation State (Verify Persistence)

```bash
curl http://localhost:3000/api/conversations/<CONVERSATION_ID>
```

**Expected Response:**
```json
{
  "id": "<CONVERSATION_ID>",
  "provider": "pi",
  "model": "anthropic/claude-3-5-sonnet-latest",
  "messages": [
    {
      "role": "user",
      "content": "Say exactly: Hello from Pi!",
      "timestamp": "2026-03-13T..."
    },
    {
      "role": "assistant",
      "content": "Hello from Pi!",
      "timestamp": "2026-03-13T..."
    }
  ],
  "isRunning": false,
  "isStreaming": false,
  "queue": []
}
```

✅ **Messages are persisted!**

---

## Test 4: Model Validation (Error Handling)

Try creating conversation with invalid model:

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "pi",
    "model": "invalid-model-123",
    "workingDirectory": "/tmp"
  }'
```

**Expected Response (400 Error):**
```json
{
  "error": "Invalid Pi model: invalid-model-123. Use full model ID or shorthand (sonnet, haiku, opus, etc.)"
}
```

✅ **Model validation works!**

---

## Test 5: Model Aliases (Shorthand Support)

All these should work:

```bash
# Shorthand
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"provider":"pi","model":"haiku"}'

# Full model ID
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"provider":"pi","model":"anthropic/claude-3-5-haiku-latest"}'

# With thinking level (not yet implemented in pi CLI, but parsed)
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"provider":"pi","model":"sonnet:high"}'
```

**Supported Aliases:**
- `sonnet` → `anthropic/claude-3-5-sonnet-latest`
- `haiku` → `anthropic/claude-3-5-haiku-latest`
- `opus` → `anthropic/claude-3-opus-latest`
- `gpt4o` → `openai/gpt-4o`
- `o1` → `openai/o1`
- `gemini` → `google/gemini-2.0-flash-exp`

---

## Test 6: Multiple Messages (Queue Processing)

Send 3 messages in quick succession:

```bash
CONV_ID="<YOUR_CONVERSATION_ID>"

curl -X POST http://localhost:3000/api/queue-message \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"Message 1\"}"

curl -X POST http://localhost:3000/api/queue-message \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"Message 2\"}"

curl -X POST http://localhost:3000/api/queue-message \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"Message 3\"}"
```

**Check Server Logs:**
```
[conv-123] Queued message id=a1b2c3d4, queueDepth=0->1
[conv-123] Queued message id=e5f6g7h8, queueDepth=1->2
[conv-123] Queued message id=i9j0k1l2, queueDepth=2->3
[conv-123] Pi message complete
[conv-123] Completed queue item: a1b2c3d4
[conv-123] Pi message complete
[conv-123] Completed queue item: e5f6g7h8
[conv-123] Pi message complete
[conv-123] Completed queue item: i9j0k1l2
```

✅ **Sequential processing works!**

---

## Test 7: Thinking Blocks (High Thinking Mode)

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "pi",
    "model": "sonnet:high",
    "workingDirectory": "/tmp"
  }'

# Get conversation ID from response, then:
curl -X POST http://localhost:3000/api/queue-message \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "<CONVERSATION_ID>",
    "content": "Explain SOLID principles in software design."
  }'
```

**Check Server Logs:**
```
[conv-123] Pi event: thinking
[conv-123] Pi thinking: Let me break down each SOLID principle...
[conv-123] Pi event: text
[conv-123] Pi text chunk: SOLID is an acronym for five...
[conv-123] Pi event: message_complete
```

**Get conversation state:**
```bash
curl http://localhost:3000/api/conversations/<CONVERSATION_ID>
```

**Expected Response:**
```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "SOLID is an acronym...",
      "thinking": [
        "Let me break down each SOLID principle..."
      ],
      "timestamp": "..."
    }
  ]
}
```

✅ **Thinking blocks captured and persisted!**

---

## Test 8: WebSocket Streaming (Real-time)

Use `websocat` or browser DevTools:

```bash
# Install websocat if not installed
# brew install websocat (macOS)
# apt install websocat (Linux)

# Connect to WebSocket
websocat ws://localhost:3000
```

**Send create conversation:**
```json
{
  "type": "create_conversation",
  "id": "test-conv-123",
  "provider": "pi",
  "model": "sonnet",
  "workingDirectory": "/tmp"
}
```

**Send message:**
```json
{
  "type": "queue_message",
  "conversationId": "test-conv-123",
  "content": "Count from 1 to 5"
}
```

**Expected Streaming Response:**
```json
{"type":"conversation_created","conversation":{...}}
{"type":"status","conversationId":"test-conv-123","isRunning":true,"isStreaming":true}
{"type":"chunk","conversationId":"test-conv-123","text":"1"}
{"type":"chunk","conversationId":"test-conv-123","text":"\n"}
{"type":"chunk","conversationId":"test-conv-123","text":"2"}
{"type":"chunk","conversationId":"test-conv-123","text":"\n"}
...
{"type":"message_complete","conversationId":"test-conv-123"}
{"type":"status","conversationId":"test-conv-123","isRunning":false,"isStreaming":false}
```

✅ **Real-time streaming works!**

---

## Test 9: Session Resume

**First message:**
```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"provider":"pi","model":"sonnet"}' \
  | jq -r '.id' > /tmp/conv_id.txt

CONV_ID=$(cat /tmp/conv_id.txt)

curl -X POST http://localhost:3000/api/queue-message \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"My name is TestUser\"}"

# Wait for completion (check logs)
sleep 10
```

**Second message (should remember context):**
```bash
curl -X POST http://localhost:3000/api/queue-message \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":\"$CONV_ID\",\"content\":\"What is my name?\"}"

# Wait for completion
sleep 10

# Check conversation state
curl http://localhost:3000/api/conversations/$CONV_ID | jq '.messages'
```

**Expected:** Assistant should respond with "TestUser" or remember the name.

**Check Server Logs:**
```
[conv-123] Creating new Pi conversation (sessionId=...)
[conv-123] Pi message complete
[conv-123] Resuming Pi conversation (sessionId=...)
[conv-123] Pi message complete
```

✅ **Session resume works! Context preserved.**

---

## Test 10: Delete Conversation

```bash
curl -X DELETE http://localhost:3000/api/conversations/<CONVERSATION_ID>
```

**Expected Response:**
```json
{"success":true}
```

**Verify deletion:**
```bash
curl http://localhost:3000/api/conversations/<CONVERSATION_ID>
```

**Expected Response (404):**
```json
{"error":"Conversation not found"}
```

✅ **Cleanup works!**

---

## Common Issues

### Issue: "Pi binary not found"

**Solution:**
```bash
npm install -g @anthropic-ai/pi
which pi  # Verify installation
```

### Issue: "ANTHROPIC_API_KEY not set"

**Solution:**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
# Or add to ~/.bashrc or ~/.zshrc
```

### Issue: "Connection refused"

**Solution:**
- Check if server is running
- Check port 3000 is not in use: `lsof -i :3000`
- Check server logs for errors

### Issue: "Timeout waiting for response"

**Causes:**
- API key invalid
- Network issues
- Pi CLI not responding

**Debug:**
```bash
# Enable verbose logging
VERBOSE=1 pnpm start

# Check Pi CLI directly
pi --version
pi --model sonnet "Hello"
```

---

## Success Criteria

After running these tests, you should have verified:

1. ✅ HTTP API endpoints work (create, get, delete, queue)
2. ✅ Model validation works (rejects invalid models)
3. ✅ Model aliases work (sonnet, haiku, etc.)
4. ✅ Messages are sent to pi via RPC
5. ✅ Streaming responses are received
6. ✅ Messages are persisted to conversation history
7. ✅ Thinking blocks are captured and stored
8. ✅ Multiple messages are queued and processed sequentially
9. ✅ Sessions resume with preserved context
10. ✅ Real-time WebSocket streaming works

---

## Next: Full E2E Tests

Once manual testing passes, run the full E2E suite:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
pnpm test:e2e
```

**Expected:** 9/10 tests passing (tool execution not implemented yet)

---

**Status:** Pi RPC integration FUNCTIONAL ✅  
**Manual Testing:** Ready to use  
**Production:** Needs tool execution and further hardening
