# Phase 3: Persistence & Session Management

**Duration**: Week 3  
**Status**: Not Started  
**Start Date**: TBD  
**Completion Date**: TBD

## Objectives

- Implement disk adapter for reading pi session files
- Convert pi JSONL format to unleashd Conversation model
- Integrate with registry-first persistence system
- Support session recovery and resume
- Handle pi-specific features (forks, compaction, cost tracking)
- Use value objects (Money, SessionId, ThinkingBlock) throughout

## Tasks

### 3.1 Analyze Pi Session Format
**File**: `server/src/adapters/pi-session-format.md`  
**Status**: ⬜ Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: None

**TDD Approach:**
- RED: Create test fixtures with sample pi sessions
- GREEN: Document format patterns
- REFACTOR: Verify against real pi sessions

**Checklist:**
- [ ] RED: Create sample JSONL session files
- [ ] GREEN: Document user message format
- [ ] RED: Create sample with thinking blocks
- [ ] GREEN: Document assistant message format with thinking
- [ ] RED: Create sample with tool calls
- [ ] GREEN: Document tool call format
- [ ] RED: Create sample with token usage
- [ ] GREEN: Document token usage tracking
- [ ] RED: Create sample with costs
- [ ] GREEN: Document cost calculation format
- [ ] RED: Create sample with fork metadata
- [ ] GREEN: Document fork/branch metadata
- [ ] RED: Create sample with compaction
- [ ] GREEN: Document compaction summary format
- [ ] REFACTOR: Compare with Claude JSONL format
- [ ] Document differences from other providers
- [ ] Create comprehensive test fixtures directory
- [ ] Verify against actual pi session files

**Session Format Documentation:**
```jsonl
# User message
{"role":"user","content":"Hello","timestamp":1733234567890}

# Assistant message with thinking
{"role":"assistant","content":[
  {"type":"thinking","thinking":"Let me analyze..."},
  {"type":"text","text":"Hi!"}
],"model":"claude-sonnet-4","usage":{"input":100,"output":50,"cost":{"input":0.0003,"output":0.00075}},"timestamp":1733234567891}

# Tool result
{"role":"toolResult","toolCallId":"call_123","toolName":"bash","content":[{"type":"text","text":"file contents"}],"isError":false,"timestamp":1733234567892}
```

**Acceptance Criteria:**
- [ ] Complete documentation of pi session format
- [ ] Sample files cover all message types
- [ ] Edge cases are identified and documented
- [ ] Format differences from other providers noted
- [ ] Test fixtures are comprehensive

---

### 3.2 Create Pi Session Types
**File**: `shared/src/adapters/pi-session.types.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Task 3.1, Phase 1 (value objects)

**TDD Approach:**
- RED: Write tests for type validation
- GREEN: Define Zod schemas
- RED: Write tests for type guards
- GREEN: Implement type guards
- REFACTOR: Ensure type safety

**Checklist:**
- [ ] RED: Write test for PiUserMessage validation
- [ ] GREEN: Define PiUserMessageSchema
- [ ] RED: Write test for PiAssistantMessage validation
- [ ] GREEN: Define PiAssistantMessageSchema
- [ ] RED: Write test for PiToolResultMessage validation
- [ ] GREEN: Define PiToolResultMessageSchema
- [ ] RED: Write test for PiThinkingBlock validation
- [ ] GREEN: Define PiThinkingBlockSchema
- [ ] RED: Write test for PiToolCall validation
- [ ] GREEN: Define PiToolCallSchema
- [ ] RED: Write test for PiUsageStats validation
- [ ] GREEN: Define PiUsageStatsSchema
- [ ] RED: Write test for PiCostInfo validation
- [ ] GREEN: Define PiCostInfoSchema
- [ ] RED: Write tests for type guards
- [ ] GREEN: Implement type guard functions
- [ ] REFACTOR: Create unified PiSessionEntry union
- [ ] Export all types from shared package
- [ ] Verify all tests pass

**Key Types:**
```typescript
export const PiUserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.union([z.string(), z.array(ContentBlockSchema)]),
  timestamp: z.number(),
  attachments: z.array(AttachmentSchema).optional(),
});

export const PiAssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z.array(ContentBlockSchema), // Includes thinking blocks
  api: z.string(),
  provider: z.string(),
  model: z.string(),
  usage: PiUsageStatsSchema.optional(),
  stopReason: z.enum(['stop', 'length', 'toolUse', 'error', 'aborted']).optional(),
  timestamp: z.number(),
});

export const PiThinkingBlockSchema = z.object({
  type: z.literal('thinking'),
  thinking: z.string(),
});

export const PiUsageStatsSchema = z.object({
  input: z.number(),
  output: z.number(),
  cacheRead: z.number().optional(),
  cacheWrite: z.number().optional(),
  cost: PiCostInfoSchema.optional(),
});

export const PiCostInfoSchema = z.object({
  input: z.number(),
  output: z.number(),
  cacheRead: z.number().optional(),
  cacheWrite: z.number().optional(),
  total: z.number(),
});

export type PiSessionEntry = 
  | z.infer<typeof PiUserMessageSchema>
  | z.infer<typeof PiAssistantMessageSchema>
  | z.infer<typeof PiToolResultMessageSchema>;
```

**Acceptance Criteria:**
- [ ] All pi message types are defined with Zod schemas
- [ ] Schemas validate pi session format correctly
- [ ] Type guards work for runtime checks
- [ ] Types are exported from shared package
- [ ] Test coverage >90%

---

### 3.3 Create Pi Disk Adapter
**File**: `server/src/adapters/pi-adapter.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 8 hours  
**Dependencies**: Tasks 3.2, Phase 1 (value objects)

**TDD Approach:**
- RED: Write test for loading session
- GREEN: Implement basic JSONL reading
- RED: Write test for message conversion
- GREEN: Convert each message type
- REFACTOR: Extract conversion methods

**Note**: Use Money, SessionId, and ThinkingBlock value objects.

**Checklist:**
- [ ] RED: Write test for loadSession() with simple session
- [ ] GREEN: Implement basic JSONL file reading
- [ ] RED: Write test for parsePiEntry() user message
- [ ] GREEN: Parse user messages
- [ ] RED: Write test for parsePiEntry() assistant message
- [ ] GREEN: Parse assistant messages
- [ ] RED: Write test for parsePiEntry() tool result
- [ ] GREEN: Parse tool results
- [ ] RED: Write test for extractThinking()
- [ ] GREEN: Extract thinking blocks as ThinkingBlock value objects
- [ ] RED: Write test for extractToolCalls()
- [ ] GREEN: Extract and link tool calls
- [ ] RED: Write test for calculateTotalTokens()
- [ ] GREEN: Calculate total token usage
- [ ] RED: Write test for calculateTotalCost()
- [ ] GREEN: Calculate total cost as Money value object
- [ ] RED: Write test for handling malformed entries
- [ ] GREEN: Add error handling with logging
- [ ] REFACTOR: Extract message conversion methods
- [ ] Use SessionId.fromString() for session IDs
- [ ] Use ThinkingBlock.create() for thinking
- [ ] Use Money.dollars() for costs
- [ ] Verify all tests pass

**Adapter Structure:**
```typescript
class PiDiskAdapter implements DiskAdapter {
  provider = 'pi' as const;
  
  async loadSession(sessionPath: string): Promise<Conversation | null> {
    const sessionId = SessionId.fromString(path.basename(sessionPath, '.jsonl'));
    const lines = await this.readJsonlFile(sessionPath);
    const messages: Message[] = [];
    let totalTokens = 0;
    let totalCost = Money.dollars(0);
    const thinkingBlocks: ThinkingBlock[] = [];
    
    for (const line of lines) {
      try {
        const entry = this.parsePiEntry(line);
        if (entry) {
          const message = this.convertToMessage(entry);
          messages.push(message);
          
          if (entry.role === 'assistant' && entry.usage) {
            totalTokens += entry.usage.input + entry.usage.output;
            if (entry.usage.cost) {
              totalCost = totalCost.add(Money.dollars(entry.usage.cost.total));
            }
            
            // Extract thinking blocks
            const thinking = this.extractThinking(entry.content);
            thinkingBlocks.push(...thinking);
          }
        }
      } catch (error) {
        // Log but don't crash on malformed entry
        console.error(`Failed to parse entry:`, error);
      }
    }
    
    return this.createConversation(sessionId, messages, {
      totalTokens,
      totalCost,
      thinkingBlocks,
    });
  }
  
  private parsePiEntry(line: string): PiSessionEntry | null {
    const json = JSON.parse(line);
    // Validate with Zod schema
    const result = PiSessionEntrySchema.safeParse(json);
    return result.success ? result.data : null;
  }
  
  private extractThinking(content: ContentBlock[]): ThinkingBlock[] {
    return content
      .filter(block => block.type === 'thinking')
      .map((block, index) => ThinkingBlock.create(block.thinking, index));
  }
  
  private convertToMessage(entry: PiSessionEntry): Message {
    // Conversion logic using value objects
  }
  
  private calculateCost(usage: PiUsageStats): Money {
    if (usage.cost) {
      return Money.dollars(usage.cost.total);
    }
    // Fallback calculation if cost not provided
    return Money.dollars(0);
  }
}
```

**Acceptance Criteria:**
- [ ] Adapter can read pi session files
- [ ] Messages are converted correctly to unleashd format
- [ ] Thinking blocks preserved as ThinkingBlock value objects
- [ ] Tool calls are linked to results
- [ ] Token usage calculated accurately
- [ ] Cost tracking uses Money value object
- [ ] Malformed entries don't crash the loader
- [ ] Test coverage >85%

---

### 3.4 Handle Thinking Blocks
**File**: `server/src/adapters/pi-thinking.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Task 3.3, Phase 1 (ThinkingBlock)

**TDD Approach:**
- RED: Write test for thinking extraction
- GREEN: Extract thinking blocks
- RED: Write test for thinking ordering
- GREEN: Preserve order with indices
- REFACTOR: Use ThinkingBlock value object

**Checklist:**
- [ ] RED: Write test for extracting single thinking block
- [ ] GREEN: Implement extraction for one block
- [ ] RED: Write test for multiple thinking blocks
- [ ] GREEN: Handle multiple blocks with correct indices
- [ ] RED: Write test for empty thinking blocks
- [ ] GREEN: Use ThinkingBlock.empty() for empty content
- [ ] RED: Write test for thinking at different positions
- [ ] GREEN: Preserve position information
- [ ] RED: Write test for metadata indicating thinking presence
- [ ] GREEN: Add hasThinking flag to messages
- [ ] RED: Write test for toggling thinking visibility
- [ ] GREEN: Create utility to filter thinking
- [ ] REFACTOR: Ensure all thinking uses ThinkingBlock
- [ ] Test various thinking patterns
- [ ] Verify all tests pass

**Thinking Extraction:**
```typescript
function extractThinking(content: ContentBlock[]): {
  textContent: string;
  thinkingBlocks: ThinkingBlock[];
  hasThinking: boolean;
} {
  const textParts: string[] = [];
  const thinkingBlocks: ThinkingBlock[] = [];
  let thinkingIndex = 0;
  
  for (const block of content) {
    if (block.type === 'text') {
      textParts.push(block.text);
    } else if (block.type === 'thinking') {
      const thinkingBlock = ThinkingBlock.create(block.thinking, thinkingIndex);
      if (!thinkingBlock.isEmpty()) {
        thinkingBlocks.push(thinkingBlock);
        thinkingIndex++;
      }
    }
  }
  
  return {
    textContent: textParts.join('\n'),
    thinkingBlocks,
    hasThinking: thinkingBlocks.length > 0,
  };
}
```

**Acceptance Criteria:**
- [ ] Thinking blocks extracted correctly using ThinkingBlock
- [ ] Text content excludes thinking
- [ ] Thinking can be toggled in UI
- [ ] Multiple thinking blocks preserved with indices
- [ ] Empty thinking doesn't create entries
- [ ] Test coverage >90%

---

### 3.5 Implement Session Discovery
**File**: `server/src/adapters/pi-discovery.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Task 3.3, Phase 1 (SessionId)

**TDD Approach:**
- RED: Write test for scanning directory
- GREEN: Implement directory scan
- RED: Write test for metadata extraction
- GREEN: Extract session metadata
- REFACTOR: Use SessionId value object

**Checklist:**
- [ ] RED: Write test for scanning `~/.pi/agent/sessions/`
- [ ] GREEN: Implement directory scan with fs.readdir
- [ ] RED: Write test for identifying pi session files by pattern
- [ ] GREEN: Filter files matching `.jsonl` pattern
- [ ] RED: Write test for extracting session metadata
- [ ] GREEN: Extract created date, last modified
- [ ] RED: Write test for grouping by working directory
- [ ] GREEN: Group sessions by project
- [ ] RED: Write test for custom session directories
- [ ] GREEN: Support configurable session directory
- [ ] RED: Write test for handling symlinks
- [ ] GREEN: Follow symlinks safely
- [ ] RED: Write test for filtering corrupted sessions
- [ ] GREEN: Skip sessions that fail to parse
- [ ] RED: Write test for sorting by recency
- [ ] GREEN: Sort sessions by lastModified desc
- [ ] RED: Write test for caching metadata
- [ ] GREEN: Implement metadata cache for performance
- [ ] REFACTOR: Use SessionId.fromString() for IDs
- [ ] Verify all tests pass

**Discovery Logic:**
```typescript
interface PiSessionMeta {
  sessionId: SessionId;
  path: string;
  createdAt: Date;
  lastModified: Date;
  workingDirectory?: string;
  messageCount?: number;
}

async function discoverPiSessions(sessionDir?: string): Promise<PiSessionMeta[]> {
  const dir = sessionDir || path.join(os.homedir(), '.pi/agent/sessions');
  const files = await fs.readdir(dir, { withFileTypes: true });
  const sessions: PiSessionMeta[] = [];
  
  for (const file of files) {
    if (file.isFile() && file.name.endsWith('.jsonl')) {
      const filePath = path.join(dir, file.name);
      const meta = await this.extractSessionMeta(filePath);
      if (meta) {
        sessions.push(meta);
      }
    }
  }
  
  return sessions.sort((a, b) => 
    b.lastModified.getTime() - a.lastModified.getTime()
  );
}

async function extractSessionMeta(filePath: string): Promise<PiSessionMeta | null> {
  try {
    const stats = await fs.stat(filePath);
    const sessionId = SessionId.fromString(path.basename(filePath, '.jsonl'));
    
    return {
      sessionId,
      path: filePath,
      createdAt: stats.birthtime,
      lastModified: stats.mtime,
    };
  } catch (error) {
    console.error(`Failed to extract metadata for ${filePath}:`, error);
    return null;
  }
}
```

**Acceptance Criteria:**
- [ ] All pi sessions are discovered
- [ ] Metadata extracted accurately using SessionId
- [ ] Sessions sorted correctly by recency
- [ ] Corrupted sessions are skipped gracefully
- [ ] Performance acceptable for 100+ sessions
- [ ] Test coverage >85%

---

### 3.6 Register Pi Adapter
**File**: `server/src/adapters/registry.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 2 hours  
**Dependencies**: Task 3.3

**TDD Approach:**
- RED: Write test for adapter registration
- GREEN: Add to registry
- RED: Write test for adapter selection
- GREEN: Verify pattern matching
- REFACTOR: Ensure priority order

**Checklist:**
- [ ] RED: Write test that pi adapter is not in registry initially
- [ ] GREEN: Import PiDiskAdapter
- [ ] RED: Write test for pi adapter registration
- [ ] GREEN: Add pi adapter to registry array
- [ ] RED: Write test for pattern matching
- [ ] GREEN: Define `.jsonl` pattern for pi sessions
- [ ] RED: Write test for session directory configuration
- [ ] GREEN: Configure session directory path
- [ ] RED: Write test for adapter priority
- [ ] GREEN: Verify adapter priority order doesn't conflict
- [ ] RED: Write test for adapter selection
- [ ] GREEN: Ensure pi adapter selected for pi session files
- [ ] REFACTOR: Organize registry entries
- [ ] Update registry tests to include pi
- [ ] Verify all tests pass

**Registry Update:**
```typescript
import { PiDiskAdapter } from './pi-adapter';

const adapters: AdapterRegistryEntry[] = [
  {
    provider: 'claude',
    pattern: /\.jsonl$/,
    loader: new ClaudeDiskAdapter(),
    sessionDir: '~/.claude/sessions',
  },
  {
    provider: 'pi',
    pattern: /\.jsonl$/,  // Same extension as Claude
    loader: new PiDiskAdapter(),
    sessionDir: '~/.pi/agent/sessions',  // Different directory
  },
  // ... other adapters
];

// Adapter selection uses directory path to disambiguate
function selectAdapter(sessionPath: string): AdapterRegistryEntry | null {
  // Check directory path first to distinguish Claude vs Pi
  for (const adapter of adapters) {
    const sessionDir = expandPath(adapter.sessionDir);
    if (sessionPath.startsWith(sessionDir) && adapter.pattern.test(sessionPath)) {
      return adapter;
    }
  }
  return null;
}
```

**Acceptance Criteria:**
- [ ] Pi adapter is registered correctly
- [ ] Pattern matching works for pi sessions
- [ ] Adapter is selected for pi session files
- [ ] No conflicts with other adapters (directory-based disambiguation)
- [ ] Registry tests include pi
- [ ] Test coverage >90%

---

### 3.7 Implement Session Resume
**File**: `server/src/providers/pi-session.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Tasks 2.5, 3.3, Phase 1 (SessionId, ConversationId)

**TDD Approach:**
- RED: Write test for session resume
- GREEN: Pass session path to RPC client
- RED: Write test for state restoration
- GREEN: Restore conversation state
- REFACTOR: Use value objects throughout

**Checklist:**
- [ ] RED: Write test for resuming existing session
- [ ] GREEN: Implement session resume logic
- [ ] RED: Write test for loading session metadata
- [ ] GREEN: Load session using pi adapter
- [ ] RED: Write test for starting RPC client with session
- [ ] GREEN: Pass session file path to pi RPC client
- [ ] RED: Write test for session not found error
- [ ] GREEN: Handle session not found gracefully
- [ ] RED: Write test for corrupted session
- [ ] GREEN: Handle corrupted session files
- [ ] RED: Write test for restoring conversation state
- [ ] GREEN: Restore messages, thinking, costs
- [ ] RED: Write test for syncing message history
- [ ] GREEN: Sync history after resume
- [ ] RED: Write test for preserving tool history
- [ ] GREEN: Verify tool calls/results preserved
- [ ] REFACTOR: Use SessionId and ConversationId
- [ ] Use Money for cost tracking
- [ ] Use ThinkingBlock for thinking
- [ ] Verify all tests pass

**Resume Implementation:**
```typescript
async function resumePiSession(
  conversationId: ConversationId,
  sessionPath: string
): Promise<void> {
  // Load session metadata from disk using adapter
  const session = await piAdapter.loadSession(sessionPath);
  if (!session) {
    throw new SessionNotFoundError(sessionPath);
  }
  
  const sessionId = SessionId.fromString(session.sessionId);
  
  // Start pi process with existing session
  const rpcClient = new PiRpcClient();
  await rpcClient.start({
    sessionPath,
    model: session.model,
  });
  
  // Restore conversation state with value objects
  conversations.set(conversationId, {
    ...session,
    sessionId,
    conversationId,
    rpcClient,
    isRunning: true,
    totalCost: session.totalCost, // Already a Money object from adapter
    thinkingBlocks: session.thinkingBlocks, // Already ThinkingBlock objects
  });
  
  console.log(`Resumed session ${sessionId.toString()} for conversation ${conversationId.toString()}`);
}
```

**Acceptance Criteria:**
- [ ] Sessions can be resumed successfully
- [ ] Message history is complete
- [ ] Tool results are preserved
- [ ] Thinking blocks restored as ThinkingBlock objects
- [ ] Cost tracking uses Money value objects
- [ ] Errors handled gracefully
- [ ] Resume works after server restart
- [ ] Test coverage >85%

---

### 3.8 Implement Cost Tracking
**File**: `server/src/adapters/pi-cost.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Task 3.3, Phase 1 (Money)

**TDD Approach:**
- RED: Write test for cost calculation
- GREEN: Implement using Money
- RED: Write test for cost aggregation
- GREEN: Aggregate with Money.add()
- REFACTOR: Ensure immutability

**Note**: ALL cost operations use Money value object.

**Checklist:**
- [ ] RED: Write test for extracting cost from usage stats
- [ ] GREEN: Extract cost info as Money.dollars()
- [ ] RED: Write test for per-message cost calculation
- [ ] GREEN: Calculate per-message cost as Money
- [ ] RED: Write test for conversation total cost
- [ ] GREEN: Aggregate using Money.add()
- [ ] RED: Write test for different pricing tiers
- [ ] GREEN: Handle input, output, cache pricing
- [ ] RED: Write test for cost by component
- [ ] GREEN: Break down cost (input, output, cache)
- [ ] RED: Write test for storing cost with conversation
- [ ] GREEN: Store Money objects in conversation state
- [ ] RED: Write test for cost WebSocket updates
- [ ] GREEN: Broadcast cost updates as formatted strings
- [ ] RED: Write test for cost summary endpoint
- [ ] GREEN: Create GET /api/conversations/:id/cost endpoint
- [ ] REFACTOR: Ensure all costs are Money objects
- [ ] Never use raw numbers for costs
- [ ] Use Money.format() for display
- [ ] Verify all tests pass

**Cost Calculation:**
```typescript
function calculatePiCost(usage: PiUsageStats, model: string): Money {
  // Pi provides cost in usage.cost object
  if (usage.cost) {
    return Money.dollars(usage.cost.total);
  }
  
  // Fallback: calculate from tokens if cost info missing
  const rates = getModelRates(model);
  
  const inputCost = (usage.input / 1_000_000) * rates.input;
  const outputCost = (usage.output / 1_000_000) * rates.output;
  const cacheReadCost = ((usage.cacheRead || 0) / 1_000_000) * rates.cacheRead;
  const cacheWriteCost = ((usage.cacheWrite || 0) / 1_000_000) * rates.cacheWrite;
  
  return Money.dollars(inputCost + outputCost + cacheReadCost + cacheWriteCost);
}

function aggregateConversationCost(messages: Message[]): Money {
  let total = Money.dollars(0);
  
  for (const message of messages) {
    if (message.cost) {
      // message.cost is already a Money object
      total = total.add(message.cost);
    }
  }
  
  return total;
}

// WebSocket broadcast
function broadcastCostUpdate(conversationId: ConversationId, totalCost: Money): void {
  broadcast(conversationId, {
    type: 'cost_update',
    conversationId: conversationId.toString(),
    totalCost: totalCost.format(), // '$0.0055'
    amount: totalCost.getAmount(), // 0.0055
  });
}
```

**Acceptance Criteria:**
- [ ] Cost calculated accurately using Money
- [ ] All cost components tracked (input, output, cache)
- [ ] Cost aggregates correctly over conversation
- [ ] Cost displayed in UI using Money.format()
- [ ] Different models have correct rates
- [ ] Money value object used throughout (no raw numbers)
- [ ] Cost updates broadcast via WebSocket
- [ ] Test coverage >90%

---

## Phase Completion Criteria

- [ ] All 8 tasks completed
- [ ] Pi sessions load from disk successfully using value objects
- [ ] Sessions can be resumed
- [ ] Thinking blocks preserved as ThinkingBlock value objects
- [ ] Cost tracking uses Money value objects throughout
- [ ] All adapter tests passing
- [ ] Integration tests with real pi sessions pass
- [ ] No primitive obsession (all domain concepts use value objects)
- [ ] Code review completed
- [ ] Documentation updated

## Updated Metrics

**Original**: 8 tasks, ~40 hours  
**Revised**: 8 tasks, ~40 hours  
**Impact**: No change in task count, but better quality with value objects

## Blockers

- Need access to real pi session files for testing
- May need to handle pi session format changes across versions

## Notes

- Pi session format may evolve; version detection recommended
- Consider caching parsed sessions for performance
- Monitor disk I/O performance with many sessions
- Implement session cleanup for old/abandoned conversations
- **All costs must be Money objects** - never use raw numbers
- **All session IDs must be SessionId objects** - never use strings
- **All thinking must be ThinkingBlock objects** - never use raw strings

## Value Object Usage Summary

| Domain Concept | Value Object | Where Used |
|----------------|--------------|------------|
| Session ID | `SessionId` | Discovery, Resume, Adapter |
| Conversation ID | `ConversationId` | All conversation operations |
| Cost | `Money` | Cost tracking, aggregation, display |
| Thinking | `ThinkingBlock` | Extraction, storage, display |

## Next Phase

Upon completion, proceed to **Phase 4: UI Enhancements** (`phase-4-tasks.md`)
