# Pi Provider Deployment Guide

## Prerequisites

- Node.js 18+
- Pi CLI installed (`npm install -g @anthropic-ai/pi`)
- Provider credentials configured

## Environment Variables

```bash
PI_SESSION_DIR=~/.pi/agent/sessions
PI_DEFAULT_MODEL=sonnet
PI_DEFAULT_THINKING=medium
```

## Deployment Steps

1. Build: `pnpm build`
2. Test: `pnpm test:unit`
3. Start: `pnpm start`
