# Pi Provider Documentation

## Overview

Pi provider integration enables multi-provider AI access through a single RPC interface.

## Features

- Multi-provider support (Anthropic, OpenAI, Google)
- Extended thinking mode
- Cost tracking
- Session persistence
- Tool execution
- Forking and compaction

## Usage

```typescript
// Create conversation
const conv = await createConversation({
  provider: 'pi',
  model: 'sonnet:high',
});

// Send message
await sendMessage(conv.id, 'Hello!');
```

## Configuration

See `DEPLOYMENT.md` for setup instructions.
