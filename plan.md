# Pi Provider Integration Plan for Unleashd

## Overview

This document outlines the plan to integrate pi as a fifth AI provider in the unleashd project, alongside Claude, Codex, Gemini, and OpenCode. Pi will be integrated using its **RPC mode**, which provides full feature access, clean process isolation, streaming support, and session management compatibility.

## Architecture Decision

### Why RPC Mode?

Pi offers three integration approaches:
1. **CLI Mode**: Simple but limited control
2. **RPC Mode**: Full control with process isolation ✅ **Selected**
3. **SDK Mode**: Direct embedding, tighter coupling

**RPC mode chosen because:**
- Consistent with existing provider architecture (all use CLI processes)
- Clean separation between unleashd and pi
- Full access to pi's features (tools, extensions, skills)
- Streaming JSONL protocol matches existing patterns
- Session management via file system (like other providers)
- Process lifecycle management already battle-tested

### Development Methodology

**Test-Driven Development (TDD)**:
- Every feature begins with a failing test (RED)
- Minimum code written to pass the test (GREEN)
- Code refactored with tests as safety net (REFACTOR)
- No production code without corresponding tests
- Test coverage target: >85% for all new code

**SOLID Principles**:
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes are substitutable for base types
- **Interface Segregation**: Clients don't depend on unused methods
- **Dependency Inversion**: Depend on abstractions, not concretions

**Domain-Driven Design**:
- Value objects for all domain concepts (no primitive obsession)
- Rich error hierarchy for clear debugging
- Ubiquitous language from pi domain
- Bounded context for provider integration

### Integration Points

```
┌─────────────┐
│ Web Client  │
└──────┬──────┘
       │
       │ WebSocket
       │
┌──────▼──────────────────────────────────────┐
│ Unleashd Server                             │
│  ┌────────────────────────────────────┐     │
│  │ Provider Registry                  │     │
│  │  • claude  • codex  • gemini       │     │
│  │  • opencode  • pi ← NEW            │     │
│  └────────────────────────────────────┘     │
│  ┌────────────────────────────────────┐     │
│  │ Pi RPC Client                      │     │
│  │  • Command/Response Handler        │     │
│  │  • Event Stream Translator         │     │
│  │  • Session Manager                 │     │
│  └────────────────────────────────────┘     │
└──────┬──────────────────────────────────────┘
       │
       │ stdin/stdout (JSONL RPC Protocol)
       │
┌──────▼──────┐
│ Pi Process  │
│ --mode rpc  │
└─────────────┘
       │
       │ API Calls
       │
┌──────▼───────────────────────────────────┐
│ Model Backends                           │
│  Anthropic • OpenAI • Google • 20+ more  │
└──────────────────────────────────────────┘
```

## Phases

### Phase 1: Core Provider Implementation
**Duration**: Week 1 + 1 day  
**Tasks**: 10 (added value objects + domain errors)  
**Goal**: Basic pi provider infrastructure with SOLID foundation  
**Deliverables**: Type definitions, provider module, harness config, value objects, error hierarchy

**Key Updates:**
- TDD approach for all tasks
- Task 1.9: Domain Value Objects (ConversationId, PiModelId, Money, ThinkingBlock, SessionId)
- Task 1.10: Domain Error Hierarchy (PiProviderError + 6 specific errors)
- No primitive obsession throughout

### Phase 2: RPC Protocol Integration
**Duration**: Week 2  
**Tasks**: 9 (split RPC client, added resilience)  
**Goal**: Functional RPC communication with production-ready resilience  
**Deliverables**: Focused RPC components, event translation, streaming, resilience patterns

**Key Updates:**
- TDD approach for all tasks
- Split Task 2.2 into 4 focused classes (ProcessManager, ProtocolHandler, EventStream, Facade)
- Task 2.9: Resilience Patterns (CircuitBreaker, RetryStrategy, TimeoutWrapper)
- Strategy Pattern for event translation
- ProcessHandle abstraction for testability

### Phase 3: Persistence & Session Management
**Duration**: Week 3  
**Tasks**: 8 (value objects throughout)  
**Goal**: Session persistence with rich domain model  
**Deliverables**: Disk adapter, session loader, registry integration, cost tracking

**Key Updates:**
- TDD approach for all tasks
- Mandatory use of value objects (Money for costs, SessionId for sessions, ThinkingBlock for thinking)
- No raw numbers for costs (always Money)
- No raw strings for IDs (always value objects)

### Phase 4: UI Enhancements
**Duration**: Week 4  
**Tasks**: 8 (accessibility + value object display)  
**Goal**: Pi-specific UI with accessibility  
**Deliverables**: Model selector, thinking display, cost tracking, accessible components

**Key Updates:**
- TDD approach for all tasks
- WCAG AA accessibility requirements
- Value object display patterns (Money.format(), ThinkingBlock.getContent())
- Mobile responsive requirements
- Performance optimization notes

### Phase 5: Advanced Features
**Duration**: Week 5  
**Tasks**: 8 (manager pattern)  
**Goal**: Extension and skill integration with clean architecture  
**Deliverables**: Extension support, skill loading, context files, forking, compaction

**Key Updates:**
- TDD approach for all tasks
- Manager pattern for each feature (ExtensionManager, SkillManager, etc.)
- Single Responsibility throughout

### Phase 6: Testing & Deployment
**Duration**: Week 6  
**Tasks**: 8 (refocused on integration/deployment)  
**Goal**: Production-ready integration  
**Deliverables**: Integration tests, performance benchmarks, security audit, deployment

**Key Updates:**
- Integration testing (not unit - those are in Phases 1-5)
- Performance benchmarking
- Security review
- Deployment preparation
- Documentation completion

## Technical Details

### Provider Interface

```typescript
interface PiProvider extends Provider {
  name: 'pi';
  listModels(): ModelInfo[];
  supportsThinking: boolean;
  thinkingLevels: ThinkingLevel[];
}
```

### RPC Communication Flow

1. **Client sends message** → Server validates
2. **Server queues message** → Pi RPC client sends `prompt` command
3. **Pi process streams events** → JSONL over stdout
4. **RPC client translates events** → Unified ProviderEvent types
5. **Server broadcasts to client** → WebSocket message
6. **Client updates UI** → Real-time streaming display

### Event Translation Map

| Pi RPC Event | Unleashd Event | Notes |
|--------------|----------------|-------|
| `agent_start` | Status update | `isStreaming: true` |
| `message_update` (text_delta) | `text_delta` | Text content |
| `message_update` (thinking_delta) | `text_delta` | Thinking content (metadata) |
| `tool_execution_start` | `tool_use` | Tool name + args |
| `tool_execution_end` | Status update | Tool result in message |
| `message_end` | `message_complete` | Stop reason |
| `agent_end` | Status update | `isStreaming: false` |

### Session Persistence

Pi stores sessions as JSONL files in `~/.pi/agent/sessions/`:

```jsonl
{"role":"user","content":"Hello","timestamp":1733234567890}
{"role":"assistant","content":[{"type":"text","text":"Hi!"}],"model":"claude-sonnet-4","usage":{...},"timestamp":1733234567891}
{"role":"toolResult","toolCallId":"call_123","content":[{"type":"text","text":"..."}],"timestamp":1733234567892}
```

**Adapter responsibilities:**
- Parse JSONL entries into unleashd Message format
- Handle pi-specific fields (thinking blocks, tool calls)
- Track session branches/forks
- Extract token usage and costs

### Model Selection

Pi supports flexible model patterns:
- `provider/model` (e.g., `anthropic/claude-3-5-sonnet-latest`)
- `provider/model:thinking` (e.g., `openai/gpt-4o:high`)
- Short aliases (e.g., `opus`, `sonnet`)

**Implementation:**
```typescript
export const PiModelSchema = z.union([
  z.string().regex(/^[a-z0-9-]+\/[a-z0-9-.:]+$/), // provider/model format
  z.enum(['opus', 'sonnet', 'haiku', 'gpt-4o', 'gpt-4o-mini']), // aliases
]);
```

## Configuration

### Environment Variables

```bash
# Pi uses standard provider API keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Or use subscriptions (pi handles auth)
PI_AUTH_STRATEGY=subscription
```

### Server Configuration

```typescript
// server/src/config.ts
export const config = {
  providers: {
    pi: {
      enabled: true,
      binary: 'pi',
      sessionDir: '~/.pi/agent/sessions',
      defaultModel: 'anthropic/claude-3-5-sonnet-latest',
      tools: ['read', 'bash', 'edit', 'write'],
      maxRetries: 3,
      timeout: 300000, // 5 minutes
    }
  }
};
```

### Pi Installation

Users must have pi installed globally:

```bash
npm install -g @mariozechner/pi-coding-agent
pi --version  # Verify installation
```

## Benefits

1. **Multi-Provider Access**: Single interface to 20+ AI providers
2. **Cost Optimization**: Choose best price/performance ratio per task
3. **Thinking Modes**: Enhanced reasoning for complex problems
4. **Extensions**: Custom tools and workflows via pi's plugin system
5. **Skills**: Pre-built capabilities via skill system
6. **Active Ecosystem**: Regular updates, new models, community contributions

## Risk Mitigation

### Process Management
- Use robust spawn with error handling
- Implement process heartbeat monitoring
- Auto-restart on unexpected termination
- Resource limits (memory, CPU)

### Protocol Compatibility
- Version check on pi startup
- Graceful degradation for missing features
- Protocol validation for all RPC messages

### Error Recovery
- Exponential backoff for retries
- Circuit breaker pattern for provider failures
- Fallback to error messages instead of crashes

### Resource Constraints
- Limit concurrent pi processes
- Session cleanup for abandoned conversations
- Monitor disk usage for session files

## Success Metrics

### Functional Requirements
- [ ] Pi provider appears in provider dropdown
- [ ] Can create conversations with pi
- [ ] Streaming text displays in real-time
- [ ] Tool execution works correctly
- [ ] Sessions persist and resume
- [ ] Model switching is seamless
- [ ] Thinking blocks display when enabled

### Performance Requirements
- [ ] First token latency < 2s
- [ ] Streaming latency < 100ms
- [ ] Session load time < 500ms
- [ ] No memory leaks over 24h operation
- [ ] Process startup time < 3s

### Quality Requirements
- [ ] Unit test coverage > 80%
- [ ] Integration tests for all RPC commands
- [ ] Contract tests for protocol compliance
- [ ] Error handling for all failure modes
- [ ] Documentation complete and accurate

## Documentation Deliverables

1. **User Guide** (`docs/providers/pi.md`)
   - How to install and configure pi
   - Model selection and switching
   - Using thinking modes
   - Extension and skill basics

2. **Developer Guide** (`docs/development/pi-integration.md`)
   - RPC protocol details
   - Event translation logic
   - Adding new features
   - Debugging tips

3. **API Reference** (`docs/api/pi-provider.md`)
   - Provider interface
   - RPC client API
   - Event types
   - Configuration options

4. **Troubleshooting** (`docs/troubleshooting/pi.md`)
   - Common errors and fixes
   - Process management issues
   - Session recovery
   - Performance tuning

## Timeline

| Phase | Duration | Tasks | Start | End | Status |
|-------|----------|-------|-------|-----|--------|
| Phase 1: Core Provider | 1 week + 1 day | 10 | Week 1 | Week 1 | Not Started |
| Phase 2: RPC Integration | 1 week | 9 | Week 2 | Week 2 | Not Started |
| Phase 3: Persistence | 1 week | 8 | Week 3 | Week 3 | Not Started |
| Phase 4: UI Enhancements | 1 week | 8 | Week 4 | Week 4 | Not Started |
| Phase 5: Advanced Features | 1 week | 8 | Week 5 | Week 5 | Not Started |
| Phase 6: Testing & Deployment | 1 week | 8 | Week 6 | Week 6 | Not Started |

**Total Duration**: 6 weeks + 3 days  
**Total Tasks**: 51 (10+9+8+8+8+8)  
**Approach**: Test-Driven Development (TDD) from Phase 1  
**Target Completion**: See `agent_notes/phase-*-tasks.md` for detailed task tracking

## Next Steps

1. Review and approve this plan
2. Set up task tracking system (see `agent_notes/`)
3. Begin Phase 1 implementation
4. Use task-tracker skill to maintain progress

---

**Last Updated**: 2026-03-13  
**Status**: Planning Complete, Ready for Implementation
