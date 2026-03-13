# Pi Session Format Documentation

**Version**: 1.0  
**Date**: 2026-03-13  
**Purpose**: Document the JSONL session format used by pi for persistence

## Overview

Pi stores conversation sessions as JSONL (JSON Lines) files in `~/.pi/agent/sessions/`. Each line is a complete JSON object representing a message or event in the conversation.

## File Location

- **Path**: `~/.pi/agent/sessions/<session-id>.jsonl`
- **Format**: JSONL (newline-delimited JSON)
- **Encoding**: UTF-8
- **One message per line**

## Message Types

### 1. User Message

Simple text message from the user.

```jsonl
{"role":"user","content":"Hello, can you help me?","timestamp":1733234567890}
```

**Schema**:
- `role`: Always `"user"`
- `content`: String or array of content blocks
- `timestamp`: Unix timestamp in milliseconds
- `attachments`: Optional array of file attachments

**With Images**:
```jsonl
{"role":"user","content":[{"type":"text","text":"What's in this image?"},{"type":"image","source":{"type":"base64","media_type":"image/png","data":"iVBORw0..."}}],"timestamp":1733234567890}
```

### 2. Assistant Message

Response from the AI, potentially with thinking blocks.

**Simple Response**:
```jsonl
{"role":"assistant","content":[{"type":"text","text":"Hello! I'd be happy to help you."}],"api":"messages","provider":"anthropic","model":"claude-3-5-sonnet-20241022","usage":{"input":15,"output":12,"cost":{"input":0.000045,"output":0.000036,"total":0.000081}},"stopReason":"end_turn","timestamp":1733234567891}
```

**With Thinking**:
```jsonl
{"role":"assistant","content":[{"type":"thinking","thinking":"The user is asking for help. I should respond politely and ask what they need assistance with."},{"type":"text","text":"Hello! I'd be happy to help you. What do you need assistance with?"}],"api":"messages","provider":"anthropic","model":"claude-3-5-sonnet-20241022","usage":{"input":15,"output":45,"cost":{"input":0.000045,"output":0.000135,"total":0.00018}},"stopReason":"end_turn","timestamp":1733234567892}
```

**Schema**:
- `role`: Always `"assistant"`
- `content`: Array of content blocks
  - `{type: "text", text: string}`: Text content
  - `{type: "thinking", thinking: string}`: Extended thinking
  - `{type: "toolUse", ...}`: Tool invocation
- `api`: API used (e.g., "messages")
- `provider`: AI provider (e.g., "anthropic", "openai", "google")
- `model`: Model identifier (e.g., "claude-3-5-sonnet-20241022")
- `usage`: Token usage statistics
  - `input`: Input tokens
  - `output`: Output tokens  
  - `cacheRead`: Optional cache read tokens
  - `cacheWrite`: Optional cache write tokens
  - `cost`: Optional cost breakdown
    - `input`: Cost for input tokens
    - `output`: Cost for output tokens
    - `cacheRead`: Cost for cache reads
    - `cacheWrite`: Cost for cache writes
    - `total`: Total cost in dollars
- `stopReason`: Why generation stopped
  - `"end_turn"`: Normal completion
  - `"max_tokens"`: Reached token limit
  - `"tool_use"`: Requested tool execution
  - `"error"`: Error occurred
  - `"aborted"`: User aborted
- `timestamp`: Unix timestamp in milliseconds

### 3. Tool Result

Result of a tool execution.

```jsonl
{"role":"toolResult","toolUseId":"toolu_01234","toolName":"read","content":[{"type":"text","text":"file contents here"}],"isError":false,"timestamp":1733234567893}
```

**Error Result**:
```jsonl
{"role":"toolResult","toolUseId":"toolu_01235","toolName":"bash","content":[{"type":"text","text":"Error: command not found"}],"isError":true,"timestamp":1733234567894}
```

**Schema**:
- `role`: Always `"toolResult"`
- `toolUseId`: ID linking to tool use in assistant message
- `toolName`: Name of tool executed (e.g., "read", "bash", "write")
- `content`: Array of content blocks with results
- `isError`: Boolean indicating if execution failed
- `timestamp`: Unix timestamp in milliseconds

## Extended Thinking

Thinking blocks allow the model to show its reasoning process.

**Thinking Levels**:
- `off`: No thinking
- `minimal`: Brief reasoning
- `low`: Basic thought process
- `medium`: Moderate reasoning (default)
- `high`: Detailed analysis
- `xhigh`: Very thorough reasoning

**Example with Multiple Thinking Blocks**:
```jsonl
{"role":"assistant","content":[{"type":"thinking","thinking":"First, I need to understand what the user is asking for. They want to know about Python decorators."},{"type":"thinking","thinking":"I should explain the concept clearly, then provide a simple example, and finally show a practical use case."},{"type":"text","text":"Python decorators are a way to modify or enhance functions..."}],"api":"messages","provider":"anthropic","model":"claude-3-5-sonnet-20241022","usage":{"input":25,"output":150,"cost":{"total":0.000525}},"timestamp":1733234567895}
```

## Tool Usage Pattern

**Assistant Requests Tool**:
```jsonl
{"role":"assistant","content":[{"type":"text","text":"Let me check that file."},{"type":"toolUse","id":"toolu_01A1","name":"read","input":{"path":"README.md"}}],"api":"messages","provider":"anthropic","model":"claude-3-5-sonnet-20241022","stopReason":"tool_use","timestamp":1733234567896}
```

**Tool Result Returned**:
```jsonl
{"role":"toolResult","toolUseId":"toolu_01A1","toolName":"read","content":[{"type":"text","text":"# My Project\n\nThis is a sample project..."}],"isError":false,"timestamp":1733234567897}
```

**Assistant Continues**:
```jsonl
{"role":"assistant","content":[{"type":"text","text":"Based on the README, this project is..."}],"api":"messages","provider":"anthropic","model":"claude-3-5-sonnet-20241022","stopReason":"end_turn","timestamp":1733234567898}
```

## Cost Tracking

Pi tracks costs in dollars with high precision.

**Format**:
```json
{
  "usage": {
    "input": 1000,
    "output": 500,
    "cost": {
      "input": 0.003,
      "output": 0.0075,
      "total": 0.0105
    }
  }
}
```

**Calculation**:
- Input: 1000 tokens × $0.003/1K = $0.003
- Output: 500 tokens × $0.015/1K = $0.0075
- Total: $0.0105

**With Caching**:
```json
{
  "usage": {
    "input": 1000,
    "output": 500,
    "cacheRead": 5000,
    "cacheWrite": 1000,
    "cost": {
      "input": 0.003,
      "output": 0.0075,
      "cacheRead": 0.0015,
      "cacheWrite": 0.00375,
      "total": 0.01575
    }
  }
}
```

## Session Metadata

Sessions may include metadata (not in JSONL, separate files):

**`.pi/agent/sessions/<session-id>.meta.json`**:
```json
{
  "id": "session-uuid",
  "created": 1733234567000,
  "updated": 1733234568000,
  "workingDirectory": "/path/to/project",
  "model": "anthropic/claude-3-5-sonnet-latest",
  "thinkingLevel": "medium",
  "messageCount": 10,
  "totalCost": 0.0523
}
```

## Forking

Pi supports conversation forking (branching from a specific message).

**Fork Metadata** (in separate `.fork.json` file):
```json
{
  "parentSession": "parent-session-id",
  "forkPoint": {
    "messageIndex": 5,
    "messageId": "msg-uuid"
  },
  "created": 1733234569000
}
```

## Compaction

Pi can compact (summarize) long conversations to save context.

**Compaction Summary** (inserted as special message):
```jsonl
{"role":"system","content":"[Conversation summary: User asked about Python. I explained decorators with examples. User then requested help with async/await...]","type":"compaction","timestamp":1733234570000,"originalMessages":15}
```

## Differences from Other Providers

| Feature | Pi | Claude | Codex | Gemini |
|---------|-------|--------|-------|---------|
| Format | JSONL | JSONL | JSONL | JSONL |
| Thinking | Extended | Extended | No | Thinking mode |
| Cost Tracking | Per-message | No | No | No |
| Cache Support | Yes | Yes | No | No |
| Forking | Yes | No | No | No |
| Compaction | Yes | No | No | No |
| Multi-provider | Yes | No | No | No |
| Tool Results | Separate | Inline | Separate | Separate |

## Edge Cases

### Empty Content
```jsonl
{"role":"assistant","content":[],"api":"messages","provider":"anthropic","model":"claude-3-5-sonnet-20241022","stopReason":"error","timestamp":1733234571000}
```

### Aborted Generation
```jsonl
{"role":"assistant","content":[{"type":"text","text":"Let me think about th"}],"api":"messages","provider":"anthropic","model":"claude-3-5-sonnet-20241022","stopReason":"aborted","timestamp":1733234572000}
```

### Missing Cost Info
```jsonl
{"role":"assistant","content":[{"type":"text","text":"Response"}],"api":"messages","provider":"openai","model":"gpt-4o","usage":{"input":10,"output":5},"timestamp":1733234573000}
```
Note: Cost may be calculated by the adapter if not provided.

## Validation Rules

1. **Each line must be valid JSON**
2. **role field is required** on all messages
3. **timestamp must be present** (milliseconds)
4. **content must be non-empty** for user/assistant
5. **toolUseId must match** a toolUse id from previous message
6. **cost.total should equal** sum of cost components
7. **Model format**: `provider/model` or shorthand

## Test Fixtures

Test fixtures are located in: `server/src/adapters/__fixtures__/pi-sessions/`

- `simple.jsonl` - Basic conversation
- `with-thinking.jsonl` - Extended thinking
- `with-tools.jsonl` - Tool usage
- `with-costs.jsonl` - Cost tracking
- `with-fork.jsonl` - Forked conversation
- `with-compaction.jsonl` - Compacted conversation
- `edge-cases.jsonl` - Aborts, errors, empty content

## Summary

Pi session format is:
- ✅ JSONL-based (one message per line)
- ✅ Supports thinking blocks
- ✅ Per-message cost tracking
- ✅ Multi-provider support
- ✅ Tool execution with separate results
- ✅ Forking and compaction
- ✅ Comprehensive metadata

**Key Takeaway**: Pi format is richer than other providers, requiring careful parsing of thinking blocks, cost data, and metadata.
