# Phase 2: RPC Protocol Integration

**Duration**: Week 2  
**Status**: ✅ Complete  
**Start Date**: 2026-03-13  
**Completion Date**: 2026-03-13

## Objectives

- Implement bidirectional RPC communication with pi process
- Create event translation layer for pi → unleashd events
- Integrate streaming support with existing WebSocket infrastructure
- Handle command/response protocol correctly
- Ensure robust error handling and recovery
- Implement resilience patterns (circuit breaker, retry, timeout)

## Tasks

### 2.1 Create Pi RPC Types
**File**: `server/src/providers/pi-rpc-types.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Phase 1 complete

**TDD Approach:**
- RED: Write tests for type validation
- GREEN: Define types
- RED: Write tests for type guards
- GREEN: Implement type guards
- REFACTOR: Organize type definitions

**Checklist:**
- [ ] RED: Write tests for PiRpcCommand validation
- [ ] GREEN: Define PiRpcCommand union type
- [ ] RED: Write tests for PiRpcResponse validation
- [ ] GREEN: Define PiRpcResponse types
- [ ] RED: Write tests for PiRpcEvent validation
- [ ] GREEN: Define PiRpcEvent union type
- [ ] RED: Write tests for type guards (isPiRpcEvent, etc.)
- [ ] GREEN: Implement type guards
- [ ] RED: Write tests for Zod schema validation
- [ ] GREEN: Add Zod schemas for protocol validation
- [ ] REFACTOR: Group related types logically
- [ ] Add comprehensive JSDoc documentation
- [ ] Export unified type definitions

**Key Types:**
```typescript
// Command types (client → pi)
type PiRpcCommand = 
  | { type: 'prompt'; id: string; message: string; images?: ImageContent[] }
  | { type: 'steer'; id: string; message: string }
  | { type: 'follow_up'; id: string; message: string }
  | { type: 'abort'; id: string }
  | { type: 'set_model'; id: string; provider: string; modelId: string }
  | { type: 'set_thinking_level'; id: string; level: ThinkingLevel };

// Response types (pi → client)
type PiRpcResponse = {
  id: string;
  type: 'response';
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
};

// Event types (pi → client, no correlation ID)
type PiRpcEvent =
  | { type: 'agent_start' }
  | { type: 'message_update'; message: AssistantMessage; assistantMessageEvent: StreamEvent }
  | { type: 'tool_execution_start'; toolCallId: string; toolName: string; args: any }
  | { type: 'tool_execution_end'; toolCallId: string; result: ToolResult; isError: boolean }
  | { type: 'message_end'; message: AssistantMessage }
  | { type: 'agent_end'; messages: AgentMessage[] };
```

**Acceptance Criteria:**
- [ ] All pi RPC protocol types are defined
- [ ] Type guards work correctly and are tested
- [ ] Zod schemas validate protocol messages
- [ ] Types match pi's RPC documentation
- [ ] Test coverage >90%
- [ ] JSDoc documentation is complete

---

### 2.2 Create Process Manager
**File**: `server/src/providers/pi-process-manager.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Task 2.1

**TDD Approach:**
- RED: Write test for process spawn
- GREEN: Implement spawn
- RED: Write test for process termination
- GREEN: Implement termination
- REFACTOR: Abstract process handle

**Note**: This is part of splitting the monolithic PiRpcClient into focused classes.

**Checklist:**
- [ ] RED: Write test for successful process spawn
- [ ] GREEN: Implement spawn() with pi CLI
- [ ] RED: Write test for spawn failure handling
- [ ] GREEN: Add error handling for spawn failures
- [ ] RED: Write test for process termination
- [ ] GREEN: Implement terminate() method
- [ ] RED: Write test for process restart
- [ ] GREEN: Implement restart() method
- [ ] RED: Write test for process status check
- [ ] GREEN: Implement isRunning() method
- [ ] RED: Write test for process exit event
- [ ] GREEN: Handle process exit events
- [ ] REFACTOR: Abstract ChildProcess to ProcessHandle interface
- [ ] Add process lifecycle logging
- [ ] Implement graceful shutdown
- [ ] Verify all tests pass

**Class Structure:**
```typescript
/**
 * Manages pi process lifecycle
 * Single Responsibility: Process spawning and termination
 */
interface ProcessHandle {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
  kill(signal?: string): void;
  on(event: string, handler: (...args: any[]) => void): void;
}

class PiProcessManager {
  private process: ProcessHandle | null = null;
  
  constructor(
    private processFactory: (args: string[]) => ProcessHandle
  ) {}
  
  async spawn(options: PiProcessOptions): Promise<ProcessHandle>;
  async terminate(): Promise<void>;
  async restart(): Promise<void>;
  isRunning(): boolean;
  
  private handleExit(code: number, signal: string): void;
}
```

**Acceptance Criteria:**
- [ ] Process spawns successfully with RPC mode
- [ ] Spawn failures are handled gracefully
- [ ] Process can be terminated cleanly
- [ ] Restart works correctly
- [ ] ProcessHandle abstraction makes testing easy
- [ ] Test coverage >85%
- [ ] All lifecycle events are handled

---

### 2.3 Create Protocol Handler
**File**: `server/src/providers/pi-protocol-handler.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Task 2.1, Task 2.2

**TDD Approach:**
- RED: Write test for command serialization
- GREEN: Implement JSONL writing
- RED: Write test for response correlation
- GREEN: Implement ID-based correlation
- REFACTOR: Extract timeout handling

**Note**: Single Responsibility - JSONL protocol communication only.

**Checklist:**
- [ ] RED: Write test for JSONL command serialization
- [ ] GREEN: Implement writeJsonl() for commands
- [ ] RED: Write test for command ID generation
- [ ] GREEN: Implement generateCommandId()
- [ ] RED: Write test for response correlation by ID
- [ ] GREEN: Implement correlateResponse() with Promise
- [ ] RED: Write test for timeout handling
- [ ] GREEN: Add timeout wrapper for responses
- [ ] RED: Write test for concurrent commands
- [ ] GREEN: Handle multiple pending commands
- [ ] RED: Write test for command queue
- [ ] GREEN: Implement command serialization queue
- [ ] REFACTOR: Extract pending request management
- [ ] Add comprehensive error handling
- [ ] Implement request cleanup on timeout
- [ ] Verify all tests pass

**Class Structure:**
```typescript
/**
 * Handles JSONL protocol communication
 * Single Responsibility: Command/response protocol
 */
class PiProtocolHandler {
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  
  constructor(
    private stdin: Writable,
    private defaultTimeout: number = 30000
  ) {}
  
  async sendCommand<T>(command: PiRpcCommand): Promise<T>;
  handleResponse(response: PiRpcResponse): void;
  
  private generateCommandId(): string;
  private writeJsonl(obj: unknown): void;
  private setupTimeout(id: string): NodeJS.Timeout;
  private cleanup(id: string): void;
}
```

**Acceptance Criteria:**
- [ ] Commands serialize to valid JSONL
- [ ] Response correlation works by ID
- [ ] Timeouts trigger appropriate errors
- [ ] Concurrent commands don't interfere
- [ ] Test coverage >90%
- [ ] Error messages are informative

---

### 2.4 Create Event Stream Handler
**File**: `server/src/providers/pi-event-stream.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Task 2.1, Task 2.2

**TDD Approach:**
- RED: Write test for JSONL parsing
- GREEN: Implement line-by-line parsing
- RED: Write test for event emission
- GREEN: Implement event emitter pattern
- REFACTOR: Handle partial lines

**Note**: Single Responsibility - Event streaming and parsing only.

**Checklist:**
- [ ] RED: Write test for JSONL line parsing
- [ ] GREEN: Implement parseJsonl() with newline splitting
- [ ] RED: Write test for handling `\r\n` line endings
- [ ] GREEN: Handle both `\n` and `\r\n`
- [ ] RED: Write test for partial line buffering
- [ ] GREEN: Implement line buffer for partial data
- [ ] RED: Write test for event type detection
- [ ] GREEN: Implement event type discrimination
- [ ] RED: Write test for event listener registration
- [ ] GREEN: Implement on() for event subscription
- [ ] RED: Write test for event listener removal
- [ ] GREEN: Implement off() for unsubscription
- [ ] RED: Write test for wildcard event listeners
- [ ] GREEN: Support '*' for all events
- [ ] REFACTOR: Extract JSONL framing logic
- [ ] Add error handling for malformed JSON
- [ ] Implement event emission
- [ ] Verify all tests pass

**Class Structure:**
```typescript
/**
 * Handles event streaming from pi stdout
 * Single Responsibility: Event parsing and emission
 */
class PiEventStream {
  private listeners = new Map<string, Set<EventHandler>>();
  private lineBuffer = '';
  
  constructor(private stdout: Readable) {
    this.attachStreamHandler();
  }
  
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  once(event: string, handler: EventHandler): void;
  
  private attachStreamHandler(): void;
  private handleData(chunk: Buffer | string): void;
  private parseJsonl(line: string): PiRpcEvent | PiRpcResponse | null;
  private emit(event: PiRpcEvent | PiRpcResponse): void;
}
```

**Acceptance Criteria:**
- [ ] JSONL parsing handles all edge cases
- [ ] Partial lines are buffered correctly
- [ ] Both `\n` and `\r\n` work
- [ ] Event listeners work correctly
- [ ] Wildcard listeners receive all events
- [ ] Malformed JSON doesn't crash the parser
- [ ] Test coverage >90%

---

### 2.5 Create Pi RPC Client (Facade)
**File**: `server/src/providers/pi-rpc-client.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Tasks 2.2, 2.3, 2.4

**TDD Approach:**
- RED: Write test for client initialization
- GREEN: Compose sub-components
- RED: Write test for prompt command
- GREEN: Delegate to protocol handler
- REFACTOR: Clean facade interface

**Note**: This is the Facade that composes the three focused classes.

**Checklist:**
- [ ] RED: Write test for client construction
- [ ] GREEN: Create PiRpcClient with dependency injection
- [ ] RED: Write test for start() method
- [ ] GREEN: Implement start() coordinating process spawn
- [ ] RED: Write test for prompt() command
- [ ] GREEN: Implement prompt() delegating to protocol
- [ ] RED: Write test for steer() command
- [ ] GREEN: Implement steer() method
- [ ] RED: Write test for followUp() command
- [ ] GREEN: Implement followUp() method
- [ ] RED: Write test for abort() command
- [ ] GREEN: Implement abort() method
- [ ] RED: Write test for setModel() command
- [ ] GREEN: Implement setModel() method
- [ ] RED: Write test for setThinkingLevel() command
- [ ] GREEN: Implement setThinkingLevel() method
- [ ] RED: Write test for event subscription
- [ ] GREEN: Delegate to event stream
- [ ] RED: Write test for stop() method
- [ ] GREEN: Implement stop() coordinating shutdown
- [ ] REFACTOR: Ensure clean interface
- [ ] Add integration tests with all components
- [ ] Verify all tests pass

**Class Structure:**
```typescript
/**
 * Facade coordinating process, protocol, and events
 * Composes: PiProcessManager + PiProtocolHandler + PiEventStream
 */
class PiRpcClient {
  private processManager: PiProcessManager;
  private protocol: PiProtocolHandler | null = null;
  private eventStream: PiEventStream | null = null;
  
  constructor(processFactory?: ProcessFactory) {
    this.processManager = new PiProcessManager(
      processFactory || defaultProcessFactory
    );
  }
  
  async start(options: PiRpcOptions): Promise<void> {
    const process = await this.processManager.spawn(options);
    this.protocol = new PiProtocolHandler(process.stdin);
    this.eventStream = new PiEventStream(process.stdout);
    this.setupEventPiping();
  }
  
  async prompt(message: string, options?: PromptOptions): Promise<void> {
    return this.protocol!.sendCommand({ type: 'prompt', message, ...options });
  }
  
  on(event: string, handler: EventHandler): void {
    this.eventStream!.on(event, handler);
  }
  
  async stop(): Promise<void> {
    await this.processManager.terminate();
    this.protocol = null;
    this.eventStream = null;
  }
  
  private setupEventPiping(): void {
    // Pipe responses from eventStream to protocol for correlation
    this.eventStream!.on('response', (response) => {
      this.protocol!.handleResponse(response);
    });
  }
}
```

**Acceptance Criteria:**
- [ ] All RPC commands work end-to-end
- [ ] Events are emitted correctly
- [ ] Start/stop lifecycle works
- [ ] Components coordinate properly
- [ ] Test coverage >85%
- [ ] Clean facade interface

---

### 2.6 Create Event Translation Layer
**File**: `server/src/providers/pi-events.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Task 2.1

**TDD Approach:**
- RED: Write test for each event type translation
- GREEN: Implement strategy for that event
- REFACTOR: Use strategy pattern instead of switch

**Note**: Use Strategy Pattern to avoid large switch statements.

**Checklist:**
- [ ] RED: Write test for agent_start translation
- [ ] GREEN: Create AgentStartTranslator strategy
- [ ] RED: Write test for message_update (text_delta) translation
- [ ] GREEN: Create TextDeltaTranslator strategy
- [ ] RED: Write test for message_update (thinking_delta) translation
- [ ] GREEN: Create ThinkingDeltaTranslator strategy
- [ ] RED: Write test for tool_execution_start translation
- [ ] GREEN: Create ToolExecutionStartTranslator strategy
- [ ] RED: Write test for tool_execution_end translation
- [ ] GREEN: Create ToolExecutionEndTranslator strategy
- [ ] RED: Write test for message_end translation
- [ ] GREEN: Create MessageEndTranslator strategy
- [ ] RED: Write test for agent_end translation
- [ ] GREEN: Create AgentEndTranslator strategy
- [ ] REFACTOR: Create EventTranslator coordinator
- [ ] Register all strategy instances
- [ ] Add fallback for unknown events
- [ ] Verify all tests pass

**Strategy Pattern Structure:**
```typescript
/**
 * Strategy interface for event translation
 */
interface EventTranslationStrategy {
  canHandle(event: PiRpcEvent): boolean;
  translate(event: PiRpcEvent): ProviderEvent | null;
}

/**
 * Example strategy implementation
 */
class MessageUpdateTranslator implements EventTranslationStrategy {
  canHandle(event: PiRpcEvent): boolean {
    return event.type === 'message_update';
  }
  
  translate(event: PiRpcEvent): ProviderEvent {
    const { assistantMessageEvent } = event;
    if (assistantMessageEvent.type === 'text_delta') {
      return { type: 'text_delta', text: assistantMessageEvent.delta };
    }
    if (assistantMessageEvent.type === 'thinking_delta') {
      return { 
        type: 'text_delta', 
        text: assistantMessageEvent.delta,
        metadata: { isThinking: true }
      };
    }
    return null;
  }
}

/**
 * Coordinator using strategies
 */
class EventTranslator {
  private strategies: EventTranslationStrategy[] = [
    new AgentStartTranslator(),
    new MessageUpdateTranslator(),
    new ToolExecutionStartTranslator(),
    new ToolExecutionEndTranslator(),
    new MessageEndTranslator(),
    new AgentEndTranslator(),
  ];
  
  translate(event: PiRpcEvent): ProviderEvent | null {
    const strategy = this.strategies.find(s => s.canHandle(event));
    return strategy?.translate(event) ?? null;
  }
}
```

**Acceptance Criteria:**
- [ ] All pi events translate correctly
- [ ] Strategy pattern reduces complexity
- [ ] Thinking blocks are marked appropriately
- [ ] Tool calls include all necessary information
- [ ] Unknown events return null
- [ ] Test coverage >90%
- [ ] Easy to add new event types

---

### 2.7 Integrate RPC Client with Server
**File**: `server/src/server.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 8 hours  
**Dependencies**: Tasks 2.5, 2.6

**TDD Approach:**
- RED: Write test for conversation creation
- GREEN: Integrate RPC client
- RED: Write test for message sending
- GREEN: Wire up event broadcasting
- REFACTOR: Extract process pool management

**Checklist:**
- [ ] RED: Write test for pi conversation creation
- [ ] GREEN: Update createConversation to support pi
- [ ] RED: Write test for RPC client lifecycle
- [ ] GREEN: Create pi process pool management
- [ ] RED: Write test for sending message to pi
- [ ] GREEN: Update sendMessage handler for pi
- [ ] RED: Write test for event broadcasting
- [ ] GREEN: Route pi events to WebSocket broadcast
- [ ] RED: Write test for conversation stop
- [ ] GREEN: Update stopConversation to call pi abort
- [ ] RED: Write test for process crash handling
- [ ] GREEN: Implement process crash recovery
- [ ] RED: Write test for session binding
- [ ] GREEN: Implement session ID binding for pi
- [ ] RED: Write test for provider switching
- [ ] GREEN: Update provider switch logic for pi
- [ ] REFACTOR: Extract PiConversationManager
- [ ] Update conversation state management
- [ ] Add error handling for all pi operations
- [ ] Verify all tests pass

**Integration Structure:**
```typescript
/**
 * Manages pi RPC clients per conversation
 */
class PiConversationManager {
  private clients = new Map<ConversationId, PiRpcClient>();
  
  async createConversation(
    id: ConversationId,
    model: PiModelId,
    options: PiOptions
  ): Promise<void> {
    const client = new PiRpcClient();
    await client.start({ model: model.toString(), ...options });
    
    // Wire up event handlers
    client.on('*', (event) => this.handleEvent(id, event));
    
    this.clients.set(id, client);
  }
  
  async sendMessage(id: ConversationId, message: string): Promise<void> {
    const client = this.clients.get(id);
    if (!client) throw new Error('Conversation not found');
    await client.prompt(message);
  }
  
  async stopConversation(id: ConversationId): Promise<void> {
    const client = this.clients.get(id);
    if (client) {
      await client.stop();
      this.clients.delete(id);
    }
  }
  
  private handleEvent(id: ConversationId, event: PiRpcEvent): void {
    const providerEvent = eventTranslator.translate(event);
    if (providerEvent) {
      broadcastToClient(id, providerEvent);
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Pi conversations can be created via WebSocket
- [ ] Messages sent to pi stream events correctly
- [ ] Events broadcast to WebSocket clients
- [ ] Process lifecycle managed correctly
- [ ] Multiple concurrent pi conversations work
- [ ] Provider switching doesn't break other providers
- [ ] Test coverage >80%
- [ ] Integration tests pass

---

### 2.8 Implement Streaming Support
**File**: `server/src/providers/pi-streaming.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Task 2.7

**TDD Approach:**
- RED: Write test for streaming state management
- GREEN: Implement isStreaming flag
- RED: Write test for chunk buffering
- GREEN: Implement buffer and broadcast
- REFACTOR: Extract streaming state manager

**Checklist:**
- [ ] RED: Write test for isStreaming flag updates
- [ ] GREEN: Implement streaming state management
- [ ] RED: Write test for text delta streaming
- [ ] GREEN: Handle text deltas and broadcast chunks
- [ ] RED: Write test for thinking delta streaming
- [ ] GREEN: Handle thinking deltas separately
- [ ] RED: Write test for tool execution streaming
- [ ] GREEN: Stream tool execution progress
- [ ] RED: Write test for stream completion
- [ ] GREEN: Detect stream completion correctly
- [ ] RED: Write test for stream interruption (abort)
- [ ] GREEN: Handle abort during streaming
- [ ] RED: Write test for streaming buffer overflow
- [ ] GREEN: Implement buffer size limits
- [ ] REFACTOR: Extract StreamingStateManager
- [ ] Add memory leak detection
- [ ] Verify all tests pass

**Streaming Manager:**
```typescript
/**
 * Manages streaming state for pi conversations
 */
class PiStreamingManager {
  private streamingStates = new Map<ConversationId, {
    isStreaming: boolean;
    buffer: string;
    thinkingBuffer: string;
  }>();
  
  startStreaming(id: ConversationId): void {
    this.streamingStates.set(id, {
      isStreaming: true,
      buffer: '',
      thinkingBuffer: '',
    });
    this.updateConversationState(id, { isStreaming: true });
  }
  
  appendTextDelta(id: ConversationId, text: string, isThinking: boolean): void {
    const state = this.streamingStates.get(id);
    if (!state) return;
    
    if (isThinking) {
      state.thinkingBuffer += text;
    } else {
      state.buffer += text;
    }
    
    // Broadcast chunk
    broadcastChunk(id, text, isThinking);
  }
  
  completeStreaming(id: ConversationId): void {
    const state = this.streamingStates.get(id);
    if (!state) return;
    
    // Finalize message with buffered content
    this.finalizeMessage(id, state.buffer, state.thinkingBuffer);
    
    this.streamingStates.delete(id);
    this.updateConversationState(id, { isStreaming: false });
  }
}
```

**Acceptance Criteria:**
- [ ] Streaming text appears in real-time in UI
- [ ] Thinking blocks stream separately
- [ ] Tool execution progress streams
- [ ] Stream completion detected correctly
- [ ] Abort stops streaming immediately
- [ ] No memory leaks during long streams
- [ ] Test coverage >85%

---

### 2.9 Implement Resilience Patterns
**File**: `server/src/providers/pi-resilience.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Task 2.5

**TDD Approach:**
- RED: Write test for circuit breaker states
- GREEN: Implement state machine
- RED: Write test for retry with backoff
- GREEN: Implement exponential backoff
- REFACTOR: Make patterns composable

**Note**: This is a NEW task from SOLID review.

**Checklist:**
- [ ] RED: Write test for circuit breaker closed state
- [ ] GREEN: Implement CircuitBreaker with closed state
- [ ] RED: Write test for circuit breaker open transition
- [ ] GREEN: Implement failure threshold and open state
- [ ] RED: Write test for circuit breaker half-open transition
- [ ] GREEN: Implement timeout and half-open state
- [ ] RED: Write test for circuit breaker reset
- [ ] GREEN: Implement success reset to closed
- [ ] RED: Write test for retry with exponential backoff
- [ ] GREEN: Implement RetryStrategy with backoff
- [ ] RED: Write test for retry abort on non-retryable errors
- [ ] GREEN: Implement shouldRetry predicate
- [ ] RED: Write test for timeout wrapper
- [ ] GREEN: Implement TimeoutWrapper
- [ ] RED: Write test for timeout cancellation
- [ ] GREEN: Implement cleanup on completion
- [ ] REFACTOR: Make patterns composable
- [ ] Integrate with PiRpcClient
- [ ] Add resilience metrics
- [ ] Verify all tests pass

**Resilience Patterns:**

**1. Circuit Breaker**
```typescript
/**
 * Circuit breaker to prevent cascading failures
 */
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private openUntil: number | null = null;
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
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
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
    this.openUntil = null;
  }
  
  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'open';
      this.openUntil = Date.now() + this.timeout;
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.openUntil !== null && Date.now() >= this.openUntil;
  }
}
```

**2. Retry Strategy**
```typescript
/**
 * Retry with exponential backoff
 */
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

**3. Timeout Wrapper**
```typescript
/**
 * Timeout wrapper for operations
 */
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

**4. Composed Resilience**
```typescript
/**
 * Compose resilience patterns
 */
class ResilientPiRpcClient {
  private circuitBreaker = new CircuitBreaker();
  private retryStrategy = new RetryStrategy();
  private timeout = new TimeoutWrapper();
  
  constructor(private client: PiRpcClient) {}
  
  async prompt(message: string): Promise<void> {
    return this.circuitBreaker.execute(() =>
      this.retryStrategy.execute(() =>
        this.timeout.execute(
          () => this.client.prompt(message),
          30000
        ),
        (error) => this.isRetryable(error)
      )
    );
  }
  
  private isRetryable(error: Error): boolean {
    // Retry on transient errors
    return error.message.includes('ECONNRESET') ||
           error.message.includes('overloaded') ||
           error.message.includes('rate_limit');
  }
}
```

**Acceptance Criteria:**
- [ ] Circuit breaker prevents cascading failures
- [ ] Retry works with exponential backoff
- [ ] Timeout prevents hanging operations
- [ ] All patterns have >90% test coverage
- [ ] Patterns integrate with RPC client
- [ ] Metrics track resilience events (failures, retries, timeouts)
- [ ] Patterns are composable
- [ ] Documentation is complete

---

## Phase Completion Criteria

- [ ] All 9 tasks completed (8 original + 1 new)
- [ ] RPC client can communicate with pi process
- [ ] Streaming works in real-time
- [ ] Error handling is robust with resilience patterns
- [ ] All integration tests passing
- [ ] No memory leaks detected
- [ ] Test coverage >85% for all RPC code
- [ ] Code review completed
- [ ] Performance benchmarks meet requirements

## Updated Metrics

**Original**: 8 tasks, ~40 hours  
**Revised**: 9 tasks, ~48 hours  
**Impact**: +8 hours for split classes + resilience

## Blockers

- Pi must be installed and accessible in PATH
- May need to adjust pi timeout settings for long operations

## Notes

- Monitor pi process memory usage during long conversations
- Process pooling implemented if spawning is slow
- Add metrics for RPC command latency
- Document any pi version-specific behavior
- CircuitBreaker state should be observable/debuggable
- Retry metrics help tune backoff parameters

## Next Phase

Upon completion, proceed to **Phase 3: Persistence & Session Management** (`phase-3-tasks.md`)
