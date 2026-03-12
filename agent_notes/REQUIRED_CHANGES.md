# Required Changes from SOLID Review

**Date**: 2026-03-13  
**Review Status**: ✅ Plan APPROVED with CRITICAL changes required  
**Overall Grade**: B+ → A (after changes)

---

## 🚨 CRITICAL CHANGES (Must Implement)

### 1. Test-Driven Development from Phase 1

**Current Problem**: Tests postponed until Phase 6  
**Impact**: Violates TDD principles, risks poor design  
**Severity**: CRITICAL

**Required Change**: Every task must follow Red-Green-Refactor

**Example - Task 1.2: Create Pi Provider Module**

**BEFORE (Wrong):**
```
Checklist:
- [ ] Create PiProvider interface
- [ ] Implement listModels()
- [ ] Export piProvider
```

**AFTER (Correct - TDD):**
```
Checklist:
- [ ] RED: Write failing test for provider name
- [ ] GREEN: Implement minimum code to pass
- [ ] RED: Write failing test for listModels
- [ ] GREEN: Implement listModels
- [ ] REFACTOR: Clean up with tests as safety net
- [ ] Verify all tests pass
```

**Action Items:**
- [ ] Update ALL phase task files with TDD steps
- [ ] Add "Write test FIRST" to every implementation checklist
- [ ] Move test tasks from Phase 6 to their respective phases
- [ ] Add test coverage requirement to each task acceptance criteria

**Files to Update:**
- `agent_notes/phase-1-tasks.md` - All 8 tasks
- `agent_notes/phase-2-tasks.md` - All 8 tasks
- `agent_notes/phase-3-tasks.md` - All 8 tasks
- `agent_notes/phase-4-tasks.md` - All 8 tasks
- `agent_notes/phase-5-tasks.md` - All 8 tasks

---

### 2. Add Value Objects Task to Phase 1

**Current Problem**: Using primitives for domain concepts  
**Impact**: No type safety, validation scattered, poor domain modeling  
**Severity**: CRITICAL

**Required Change**: Create explicit value objects task

**New Task 1.9: Create Domain Value Objects**

```markdown
### 1.9 Create Domain Value Objects
**File**: `shared/src/domain/value-objects.ts`
**Status**: ⬜ Not Started
**Estimated Time**: 4 hours
**Dependencies**: None

**Checklist:**
- [ ] RED: Write tests for ConversationId validation
- [ ] GREEN: Implement ConversationId value object
- [ ] RED: Write tests for PiModelId parsing
- [ ] GREEN: Implement PiModelId value object
- [ ] RED: Write tests for Money arithmetic
- [ ] GREEN: Implement Money value object
- [ ] RED: Write tests for ThinkingBlock creation
- [ ] GREEN: Implement ThinkingBlock value object
- [ ] RED: Write tests for SessionId validation
- [ ] GREEN: Implement SessionId value object
- [ ] REFACTOR: Ensure all VOs are immutable
- [ ] Document usage patterns

**Value Objects to Create:**

1. ConversationId
   ```typescript
   class ConversationId {
     private constructor(private readonly value: string) {
       if (!UUID_PATTERN.test(value)) {
         throw new InvalidConversationIdError(value);
       }
     }
     
     static fromString(id: string): ConversationId;
     toString(): string;
     equals(other: ConversationId): boolean;
   }
   ```

2. PiModelId
   ```typescript
   class PiModelId {
     private constructor(
       private readonly provider: string,
       private readonly model: string,
       private readonly thinking?: ThinkingLevel
     ) {}
     
     static parse(raw: string): PiModelId;
     toCommandArgs(): string[];
     hasThinking(): boolean;
   }
   ```

3. Money
   ```typescript
   class Money {
     private constructor(
       private readonly amount: number,
       private readonly currency: string = 'USD'
     ) {
       if (amount < 0) throw new NegativeAmountError();
     }
     
     static dollars(amount: number): Money;
     add(other: Money): Money;
     subtract(other: Money): Money;
     format(): string;
   }
   ```

4. ThinkingBlock
   ```typescript
   class ThinkingBlock {
     private constructor(
       private readonly content: string,
       private readonly index: number
     ) {}
     
     static create(content: string, index: number): ThinkingBlock;
     static empty(index: number): ThinkingBlock;
     isEmpty(): boolean;
     getContent(): string;
   }
   ```

5. SessionId
   ```typescript
   class SessionId {
     private constructor(private readonly value: string) {}
     
     static generate(): SessionId;
     static fromString(id: string): SessionId;
     toString(): string;
   }
   ```

**Acceptance Criteria:**
- [ ] All value objects are immutable
- [ ] All value objects validate on construction
- [ ] All value objects have test coverage > 90%
- [ ] All value objects have equality methods
- [ ] No primitive obsession in domain layer
```

**Action Items:**
- [ ] Insert Task 1.9 into `phase-1-tasks.md`
- [ ] Update Task 1.2 to use ConversationId
- [ ] Update Task 1.4 to use PiModelId
- [ ] Update Phase 3 tasks to use Money, SessionId
- [ ] Update Phase 4 tasks to use ThinkingBlock

---

### 3. Add Domain Errors Task to Phase 1

**Current Problem**: No error hierarchy defined  
**Impact**: Unclear error handling, poor debugging  
**Severity**: CRITICAL

**Required Change**: Define domain errors early

**New Task 1.10: Define Domain Error Hierarchy**

```markdown
### 1.10 Define Domain Error Hierarchy
**File**: `shared/src/domain/errors.ts`
**Status**: ⬜ Not Started
**Estimated Time**: 2 hours
**Dependencies**: None

**Checklist:**
- [ ] RED: Write tests for error construction
- [ ] GREEN: Implement base error classes
- [ ] RED: Write tests for error serialization
- [ ] GREEN: Implement error metadata
- [ ] Document error handling strategy

**Error Hierarchy:**

```typescript
// Base domain error
class PiProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PiProviderError';
  }
}

// Domain errors
class ModelNotFoundError extends PiProviderError {
  constructor(modelId: string) {
    super(
      `Model not found: ${modelId}`,
      'MODEL_NOT_FOUND'
    );
  }
}

class InvalidModelIdError extends PiProviderError {
  constructor(modelId: string, reason: string) {
    super(
      `Invalid model ID "${modelId}": ${reason}`,
      'INVALID_MODEL_ID'
    );
  }
}

class ThinkingNotSupportedError extends PiProviderError {
  constructor(modelId: string) {
    super(
      `Model ${modelId} does not support thinking mode`,
      'THINKING_NOT_SUPPORTED'
    );
  }
}

class InvalidConversationIdError extends PiProviderError {
  constructor(id: string) {
    super(
      `Invalid conversation ID: ${id}`,
      'INVALID_CONVERSATION_ID'
    );
  }
}

class NegativeAmountError extends PiProviderError {
  constructor() {
    super(
      'Money amount cannot be negative',
      'NEGATIVE_AMOUNT'
    );
  }
}
```

**Acceptance Criteria:**
- [ ] All errors extend base error
- [ ] All errors have error codes
- [ ] All errors support error chaining (cause)
- [ ] All errors are serializable
- [ ] Error tests cover all cases
```

**Action Items:**
- [ ] Insert Task 1.10 into `phase-1-tasks.md`
- [ ] Update all tasks to use domain errors
- [ ] Document error handling in plan.md

---

### 4. Split PiRpcClient in Phase 2

**Current Problem**: Single class with 5+ responsibilities  
**Impact**: Violates SRP, hard to test, high coupling  
**Severity**: CRITICAL

**Required Change**: Decompose into focused classes

**Update Task 2.2: Create Pi RPC Client Core**

**Change from:**
```typescript
class PiRpcClient {
  // Process management
  // Command sending
  // Event handling
  // Response correlation
  // Error handling
}
```

**To:**
```typescript
// Single Responsibility: Process lifecycle
class PiProcessManager {
  spawn(options: PiProcessOptions): Promise<ProcessHandle>;
  terminate(): Promise<void>;
  restart(): Promise<void>;
  isRunning(): boolean;
}

// Single Responsibility: JSONL protocol
class PiProtocolHandler {
  sendCommand(cmd: PiRpcCommand): Promise<void>;
  private writeJsonl(obj: unknown): void;
  private correlateResponse(id: string): Promise<Response>;
}

// Single Responsibility: Event streaming
class PiEventStream {
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  private parseJsonl(line: string): PiRpcEvent;
  private emit(event: PiRpcEvent): void;
}

// Facade: Coordinates the above
class PiRpcClient {
  constructor(
    private processManager: PiProcessManager,
    private protocol: PiProtocolHandler,
    private eventStream: PiEventStream
  ) {}
  
  async start(options: PiRpcOptions): Promise<void> {
    await this.processManager.spawn(options);
  }
  
  async prompt(message: string): Promise<void> {
    await this.protocol.sendCommand({ type: 'prompt', message });
  }
  
  on(event: string, handler: EventHandler): void {
    this.eventStream.on(event, handler);
  }
}
```

**Action Items:**
- [ ] Update Task 2.2 checklist to create 4 classes
- [ ] Add tests for each class independently
- [ ] Update Task 2.3 to use new structure
- [ ] Document facade pattern usage

---

### 5. Add Resilience Patterns Task to Phase 2

**Current Problem**: Error handling too generic  
**Impact**: Poor failure recovery, cascading failures  
**Severity**: CRITICAL

**Required Change**: Implement resilience patterns

**New Task 2.9: Implement Resilience Patterns**

```markdown
### 2.9 Implement Resilience Patterns
**File**: `server/src/providers/pi-resilience.ts`
**Status**: ⬜ Not Started
**Estimated Time**: 6 hours
**Dependencies**: Task 2.2

**Checklist:**
- [ ] RED: Write tests for circuit breaker state transitions
- [ ] GREEN: Implement CircuitBreaker class
- [ ] RED: Write tests for retry with exponential backoff
- [ ] GREEN: Implement RetryStrategy class
- [ ] RED: Write tests for timeout wrapper
- [ ] GREEN: Implement TimeoutWrapper class
- [ ] Integrate with PiRpcClient
- [ ] Add resilience metrics

**Patterns to Implement:**

1. Circuit Breaker
   ```typescript
   class CircuitBreaker {
     private failures = 0;
     private state: 'closed' | 'open' | 'half-open' = 'closed';
     private readonly threshold = 5;
     private readonly timeout = 60000; // 1 minute
     
     async execute<T>(fn: () => Promise<T>): Promise<T> {
       if (this.state === 'open') {
         if (this.shouldAttemptReset()) {
           this.state = 'half-open';
         } else {
           throw new CircuitOpenError();
         }
       }
       
       try {
         const result = await fn();
         this.onSuccess();
         return result;
       } catch (error) {
         this.onFailure();
         throw error;
       }
     }
   }
   ```

2. Retry with Exponential Backoff
   ```typescript
   class RetryStrategy {
     constructor(
       private readonly maxAttempts: number = 3,
       private readonly baseDelay: number = 1000
     ) {}
     
     async execute<T>(
       fn: () => Promise<T>,
       shouldRetry: (error: Error) => boolean = () => true
     ): Promise<T> {
       let lastError: Error;
       
       for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
         try {
           return await fn();
         } catch (error) {
           lastError = error as Error;
           
           if (!shouldRetry(error as Error)) {
             throw error;
           }
           
           if (attempt < this.maxAttempts - 1) {
             await this.delay(attempt);
           }
         }
       }
       
       throw new MaxRetriesExceededError(this.maxAttempts, lastError!);
     }
     
     private delay(attempt: number): Promise<void> {
       const ms = this.baseDelay * Math.pow(2, attempt);
       return new Promise(resolve => setTimeout(resolve, ms));
     }
   }
   ```

3. Timeout Wrapper
   ```typescript
   class TimeoutWrapper {
     async execute<T>(
       fn: () => Promise<T>,
       timeoutMs: number
     ): Promise<T> {
       return Promise.race([
         fn(),
         this.timeout(timeoutMs)
       ]);
     }
     
     private timeout(ms: number): Promise<never> {
       return new Promise((_, reject) => {
         setTimeout(() => reject(new TimeoutError(ms)), ms);
       });
     }
   }
   ```

**Acceptance Criteria:**
- [ ] Circuit breaker prevents cascading failures
- [ ] Retry works with exponential backoff
- [ ] Timeout prevents hanging operations
- [ ] All patterns have >85% test coverage
- [ ] Patterns integrate with RPC client
- [ ] Metrics track resilience events
```

**Action Items:**
- [ ] Insert Task 2.9 into `phase-2-tasks.md`
- [ ] Update Task 2.7 to use resilience patterns
- [ ] Add resilience monitoring to Phase 6

---

## 🔧 RECOMMENDED CHANGES (Should Implement)

### 6. Interface Segregation for RPC Commands

**Update Task 2.3**: Split into focused interfaces

```typescript
interface PiPromptCommands {
  prompt(message: string): Promise<void>;
  steer(message: string): Promise<void>;
  followUp(message: string): Promise<void>;
  abort(): Promise<void>;
}

interface PiConfigurationCommands {
  setModel(model: PiModelId): Promise<void>;
  setThinkingLevel(level: ThinkingLevel): Promise<void>;
}

interface PiSessionCommands {
  compact(instructions?: string): Promise<CompactionResult>;
  fork(entryId: string): Promise<ForkResult>;
}
```

---

### 7. Provider Capability Pattern

**Update Task 1.2**: Use generic capabilities

```typescript
interface Provider {
  name: ProviderName;
  listModels(): ModelInfo[];
  getCapabilities(): ProviderCapabilities;  // NEW
}

interface ProviderCapabilities {
  hasThinking?: boolean;
  hasCostTracking?: boolean;
  hasForks?: boolean;
  hasExtensions?: boolean;
}

// Pi implementation
getCapabilities(): ProviderCapabilities {
  return {
    hasThinking: true,
    hasCostTracking: true,
    hasForks: true,
    hasExtensions: true,
  };
}
```

---

### 8. Event Translation Strategy Pattern

**Update Task 2.4**: Replace switch with strategies

```typescript
interface EventTranslationStrategy {
  canHandle(event: PiRpcEvent): boolean;
  translate(event: PiRpcEvent): ProviderEvent | null;
}

class MessageUpdateTranslator implements EventTranslationStrategy {
  canHandle(event: PiRpcEvent): boolean {
    return event.type === 'message_update';
  }
  
  translate(event: PiRpcEvent): ProviderEvent {
    // Focused logic
  }
}
```

---

### 9. Process Abstraction (Dependency Inversion)

**Update Task 2.2**: Abstract process dependency

```typescript
interface ProcessHandle {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
  kill(signal?: string): void;
  on(event: string, handler: (...args: any[]) => void): void;
}

class PiProcessManager {
  constructor(
    private processFactory: (args: string[]) => ProcessHandle
  ) {}
}

// Testing becomes trivial
const mockProcess = createMockProcessHandle();
const manager = new PiProcessManager(() => mockProcess);
```

---

## 📋 Implementation Checklist

**Before starting implementation:**

- [ ] Update all phase files with TDD steps
- [ ] Add Task 1.9 (Value Objects) to Phase 1
- [ ] Add Task 1.10 (Domain Errors) to Phase 1
- [ ] Update Task 2.2 (Split PiRpcClient)
- [ ] Add Task 2.9 (Resilience Patterns) to Phase 2
- [ ] Update Task 2.3 (Interface Segregation)
- [ ] Update Task 1.2 (Capability Pattern)
- [ ] Update Task 2.4 (Event Translation Strategy)
- [ ] Update Phase 1 total: 8 → 10 tasks
- [ ] Update Phase 2 total: 8 → 9 tasks
- [ ] Update total tasks: 48 → 51 tasks
- [ ] Update plan.md timeline (+2-3 days)
- [ ] Review and approve changes

**Task Count Updates:**

| Phase | Before | After | Change |
|-------|--------|-------|--------|
| Phase 1 | 8 | 10 | +2 (VOs, Errors) |
| Phase 2 | 8 | 9 | +1 (Resilience) |
| Phase 3 | 8 | 8 | 0 |
| Phase 4 | 8 | 8 | 0 |
| Phase 5 | 8 | 8 | 0 |
| Phase 6 | 8 | 8 | 0 |
| **Total** | **48** | **51** | **+3** |

---

## ⏱️ Timeline Impact

**Original**: 6 weeks (48 tasks)  
**Revised**: 6 weeks + 3 days (51 tasks with TDD)  

**Why minimal impact?**
- TDD adds time per task BUT catches bugs earlier
- Value objects simplify later code
- Resilience patterns prevent debugging time
- Net impact: +2-3 days

**Trade-off**: Worth it for A+ quality code!

---

## 🎯 Next Actions

1. **Review this document** - Ensure agreement on changes
2. **Update phase files** - Incorporate all required changes
3. **Regenerate status** - Update task counts and timeline
4. **Get approval** - Sign off on revised plan
5. **Begin Phase 1** - With TDD from Task 1.1!

---

**Reviewed by**: SOLID Skill  
**Approval Status**: Pending implementation of required changes  
**Expected Grade After Changes**: A+ (Excellent)
