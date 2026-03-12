# Phase 1: Core Provider Implementation

**Duration**: Week 1 + 1 day  
**Status**: Not Started  
**Start Date**: TBD  
**Completion Date**: TBD

## Objectives

- Establish foundational type system for pi provider
- Create domain value objects and error hierarchy
- Create basic provider module structure
- Configure harness for pi CLI integration
- Ensure compatibility with existing provider architecture

## Tasks

### 1.1 Update Shared Types
**File**: `shared/src/index.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: None

**TDD Approach:**
- RED: Write failing test for ProviderSchema including 'pi'
- GREEN: Add 'pi' to enum
- RED: Write failing test for PiModelSchema validation
- GREEN: Implement PiModelSchema
- REFACTOR: Ensure schemas are composable

**Checklist:**
- [ ] RED: Write test that ProviderSchema.parse('pi') should succeed
- [ ] GREEN: Add `'pi'` to `ProviderSchema` enum
- [ ] RED: Write test for valid pi model ID patterns
- [ ] GREEN: Create `PiModelSchema` with regex validation
- [ ] RED: Write test for ThinkingLevelSchema with all levels
- [ ] GREEN: Add `ThinkingLevelSchema` enum (off, minimal, low, medium, high, xhigh)
- [ ] RED: Write test that ModelIdSchema accepts PiModelSchema
- [ ] GREEN: Update `ModelIdSchema` union to include `PiModelSchema`
- [ ] RED: Write test for pi provider metadata
- [ ] GREEN: Add pi entry to `PROVIDER_METADATA` object
- [ ] RED: Write test that PROVIDER_OPTIONS includes pi
- [ ] GREEN: Update `PROVIDER_OPTIONS` array with pi metadata
- [ ] RED: Write test that PROVIDER_IDS includes 'pi'
- [ ] GREEN: Verify `PROVIDER_IDS` includes 'pi'
- [ ] REFACTOR: Consolidate validation logic
- [ ] Verify all tests pass (>90% coverage)

**Acceptance Criteria:**
- [ ] All schemas validate correctly with valid pi model IDs
- [ ] Invalid model IDs are rejected by schema validation
- [ ] TypeScript compilation succeeds with no errors
- [ ] Existing provider tests still pass
- [ ] Test coverage >90% for new schemas

---

### 1.2 Create Pi Provider Module
**File**: `server/src/providers/pi.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Task 1.1, Task 1.9

**TDD Approach:**
- RED: Write test for provider name
- GREEN: Return 'pi'
- RED: Write test for listModels
- GREEN: Return model array
- REFACTOR: Use value objects

**Checklist:**
- [ ] RED: Write test that provider.name === 'pi'
- [ ] GREEN: Create PiProvider with name: 'pi'
- [ ] RED: Write test that listModels returns non-empty array
- [ ] GREEN: Implement listModels() returning empty array
- [ ] RED: Write test that listModels returns specific models
- [ ] GREEN: Add Anthropic, OpenAI, Google model definitions
- [ ] RED: Write test for getCapabilities method
- [ ] GREEN: Implement getCapabilities() returning pi capabilities
- [ ] RED: Write test that default model is marked correctly
- [ ] GREEN: Set isDefault: true for claude-3-5-sonnet-latest
- [ ] REFACTOR: Extract model definitions to constant
- [ ] REFACTOR: Use PiModelId value object for IDs
- [ ] Add JSDoc documentation to all public methods
- [ ] Verify all tests pass

**Models to include:**
```typescript
const PI_MODELS: ModelInfo[] = [
  { id: 'anthropic/claude-3-5-sonnet-latest', displayName: 'Claude 3.5 Sonnet (via Pi)', isDefault: true },
  { id: 'anthropic/claude-3-5-haiku-latest', displayName: 'Claude 3.5 Haiku (via Pi)', isDefault: false },
  { id: 'openai/gpt-4o', displayName: 'GPT-4o (via Pi)', isDefault: false },
  { id: 'openai/gpt-4o-mini', displayName: 'GPT-4o Mini (via Pi)', isDefault: false },
  { id: 'google/gemini-2.0-flash-thinking-exp-1219', displayName: 'Gemini 2.0 Flash (via Pi)', isDefault: false },
];
```

**Capability Pattern:**
```typescript
getCapabilities(): ProviderCapabilities {
  return {
    hasThinking: true,
    hasCostTracking: true,
    hasForks: true,
    hasExtensions: true,
  };
}
```

**Acceptance Criteria:**
- [ ] Provider exports correct name ('pi')
- [ ] listModels() returns array with at least 5 models
- [ ] All models use PiModelId value object
- [ ] getCapabilities() returns correct capabilities
- [ ] Default model is marked correctly
- [ ] TypeScript types are correct
- [ ] Test coverage >85%

---

### 1.3 Register Pi Provider
**File**: `server/src/providers/index.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.2

**TDD Approach:**
- RED: Write test for getProvider('pi')
- GREEN: Add to registry
- REFACTOR: Ensure type safety

**Checklist:**
- [ ] RED: Write test that getProvider('pi') throws before registration
- [ ] GREEN: Import `piProvider` from `./pi`
- [ ] RED: Write test that getProvider('pi') returns piProvider
- [ ] GREEN: Add `pi: piProvider` to providers record
- [ ] RED: Write test that provider list includes 'pi'
- [ ] GREEN: Verify `getProvider('pi')` works
- [ ] RED: Write test that unknown provider still throws
- [ ] GREEN: Verify error handling for unknown providers
- [ ] REFACTOR: Ensure type inference works
- [ ] Update provider registry tests
- [ ] Verify all tests pass

**Acceptance Criteria:**
- [ ] `getProvider('pi')` returns piProvider instance
- [ ] No TypeScript errors in providers module
- [ ] Provider registry test coverage includes pi
- [ ] All existing provider tests still pass
- [ ] Error messages are informative

---

### 1.4 Create Pi Harness Configuration
**File**: `vendor/agent-cli-tool/src/harnesses/pi.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Task 1.9 (for PiModelId)

**TDD Approach:**
- RED: Write test for basic harness structure
- GREEN: Create minimal config
- RED: Write test for model decomposition
- GREEN: Implement decomposition
- REFACTOR: Use value objects

**Checklist:**
- [ ] RED: Write test that harness has required fields
- [ ] GREEN: Create `piConfig: HarnessConfig` skeleton
- [ ] RED: Write test for binary path
- [ ] GREEN: Set `binary: 'pi'`
- [ ] RED: Write test for baseCmd includes --mode rpc
- [ ] GREEN: Set `baseCmd: ['--mode', 'rpc']`
- [ ] RED: Write test for model flag
- [ ] GREEN: Set `modelFlag: '--model'`
- [ ] RED: Write test for stdin/stdout behavior
- [ ] GREEN: Configure `stdin: 'pipe'` and `stdout: 'jsonl'`
- [ ] RED: Write test for session create flags
- [ ] GREEN: Implement `sessionCreateFlags: (id) => ['--session', id]`
- [ ] RED: Write test for session resume flags
- [ ] GREEN: Implement `sessionResumeFlags: (id) => ['--session', id]`
- [ ] RED: Write test for tool arguments
- [ ] GREEN: Add `extraArgs: ['--tools', 'read,bash,edit,write']`
- [ ] RED: Write test for model decomposition without thinking
- [ ] GREEN: Implement basic decomposeModel
- [ ] RED: Write test for model decomposition with thinking
- [ ] GREEN: Handle provider/model:thinking format
- [ ] REFACTOR: Use PiModelId.parse() for decomposition
- [ ] Export piConfig
- [ ] Verify all tests pass

**Model Decomposition Logic:**
```typescript
decomposeModel: (modelId: string): string[] => {
  const piModel = PiModelId.parse(modelId);
  return piModel.toCommandArgs();
}
```

**Acceptance Criteria:**
- [ ] Harness config follows same pattern as other providers
- [ ] Model decomposition handles all format variants correctly
- [ ] Session flags work for both create and resume scenarios
- [ ] All required fields are present and valid
- [ ] Test coverage >90%

---

### 1.5 Register Pi Harness
**File**: `vendor/agent-cli-tool/src/harnesses/index.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.4

**TDD Approach:**
- RED: Write test for getHarness('pi')
- GREEN: Add to registry
- REFACTOR: Verify type safety

**Checklist:**
- [ ] RED: Write test that getHarness('pi') throws before registration
- [ ] GREEN: Import `piConfig` from `./pi`
- [ ] RED: Write test that getHarness('pi') returns piConfig
- [ ] GREEN: Add `pi: piConfig` to harness registry
- [ ] RED: Write test that Harness type includes 'pi'
- [ ] GREEN: Update `Harness` type union to include `'pi'`
- [ ] RED: Write test that listHarnesses includes 'pi'
- [ ] GREEN: Verify `getHarness('pi')` works
- [ ] RED: Write test for unknown harness error
- [ ] GREEN: Verify error handling
- [ ] Update harness registry tests
- [ ] Verify all tests pass

**Acceptance Criteria:**
- [ ] `getHarness('pi')` returns piConfig
- [ ] `listHarnesses()` includes 'pi'
- [ ] TypeScript types are correct
- [ ] All harness tests pass
- [ ] Error handling is robust

---

### 1.6 Update Agent CLI Tool Types
**File**: `vendor/agent-cli-tool/src/types.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.5

**TDD Approach:**
- RED: Write test for type constraints
- GREEN: Update types
- REFACTOR: Ensure type safety

**Checklist:**
- [ ] RED: Write test that 'pi' is valid Harness type
- [ ] GREEN: Add `'pi'` to `Harness` union type
- [ ] RED: Write test for BuildOptions with thinking
- [ ] GREEN: Verify `HarnessConfig` interface supports pi's needs
- [ ] RED: Write test for ThinkingLevel type if needed
- [ ] GREEN: Add `ThinkingLevel` type if not already present
- [ ] RED: Write test that BuildOptions handles thinking parameter
- [ ] GREEN: Ensure `BuildOptions` can handle thinking parameter
- [ ] REFACTOR: Consolidate type definitions
- [ ] Update any relevant JSDoc comments
- [ ] Verify all type tests pass

**Acceptance Criteria:**
- [ ] TypeScript compilation succeeds
- [ ] All type constraints are satisfied
- [ ] No breaking changes to existing harness types
- [ ] Type inference works correctly
- [ ] JSDoc is complete and accurate

---

### 1.7 Create Pi Provider Unit Tests
**File**: `server/src/providers/__tests__/pi.test.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: Tasks 1.1, 1.2, 1.3

**TDD Note:** Tests already written during Tasks 1.1-1.3, this consolidates them.

**Checklist:**
- [ ] Verify test: provider name is 'pi'
- [ ] Verify test: listModels() returns valid model array
- [ ] Verify test: default model is marked correctly
- [ ] Verify test: all model IDs pass schema validation
- [ ] Verify test: getCapabilities returns correct capabilities
- [ ] Verify test: provider can be retrieved from registry
- [ ] Add edge case test: listModels never returns empty
- [ ] Add edge case test: model IDs are unique
- [ ] Add integration test: provider works with existing code
- [ ] Verify all tests are using AAA pattern (Arrange-Act-Assert)
- [ ] Ensure test coverage >85% for pi.ts
- [ ] Verify tests follow existing provider test patterns
- [ ] All tests pass consistently

**Test Structure:**
```typescript
describe('PiProvider', () => {
  describe('provider metadata', () => {
    it('should have name "pi"', () => {
      expect(piProvider.name).toBe('pi');
    });
  });
  
  describe('listModels', () => {
    it('should return at least 5 models', () => {
      const models = piProvider.listModels();
      expect(models.length).toBeGreaterThanOrEqual(5);
    });
    
    it('should mark claude-3-5-sonnet-latest as default', () => {
      const models = piProvider.listModels();
      const defaultModel = models.find(m => m.isDefault);
      expect(defaultModel?.id).toContain('claude-3-5-sonnet');
    });
  });
  
  describe('capabilities', () => {
    it('should support thinking mode', () => {
      const caps = piProvider.getCapabilities();
      expect(caps.hasThinking).toBe(true);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Test coverage >85% for pi.ts
- [ ] Tests follow existing provider test patterns
- [ ] Tests use AAA pattern
- [ ] Edge cases are covered

---

### 1.8 Create Harness Configuration Tests
**File**: `vendor/agent-cli-tool/src/harnesses/__tests__/pi.test.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.4

**TDD Note:** Tests already written during Task 1.4, this consolidates them.

**Checklist:**
- [ ] Verify test: basic harness config structure is valid
- [ ] Verify test: decomposeModel with simple model ID
- [ ] Verify test: decomposeModel with thinking level
- [ ] Verify test: session create flags generate correct arguments
- [ ] Verify test: session resume flags generate correct arguments
- [ ] Verify test: build command with model produces correct argv
- [ ] Verify test: build command with model and thinking
- [ ] Verify test: build command without thinking uses default
- [ ] Add edge case test: empty model ID throws error
- [ ] Add edge case test: invalid thinking level throws error
- [ ] Ensure test coverage >90% for pi harness
- [ ] All tests pass consistently

**Test Cases:**
```typescript
describe('Pi Harness', () => {
  describe('model decomposition', () => {
    it('should decompose simple model ID', () => {
      const result = piConfig.decomposeModel!('anthropic/claude-3-5-sonnet-latest');
      expect(result).toEqual(['--model', 'anthropic/claude-3-5-sonnet-latest']);
    });
    
    it('should decompose model ID with thinking', () => {
      const result = piConfig.decomposeModel!('openai/gpt-4o:high');
      expect(result).toEqual(['--model', 'openai/gpt-4o', '--thinking', 'high']);
    });
  });
  
  describe('session flags', () => {
    it('should generate create flags', () => {
      const flags = piConfig.sessionCreateFlags!('test-session-id');
      expect(flags).toEqual(['--session', 'test-session-id']);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Edge cases are covered (empty model, invalid format)
- [ ] Test coverage >90% for pi harness
- [ ] Tests verify command building end-to-end

---

### 1.9 Create Domain Value Objects
**File**: `shared/src/domain/value-objects.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Task 1.10 (for error types)

**TDD Approach:**
- RED: Write test for each value object
- GREEN: Implement minimal version
- RED: Write test for validation
- GREEN: Add validation logic
- REFACTOR: Ensure immutability

**Checklist:**
- [ ] RED: Write test for ConversationId with valid UUID
- [ ] GREEN: Implement ConversationId constructor
- [ ] RED: Write test that ConversationId rejects invalid UUID
- [ ] GREEN: Add UUID validation to ConversationId
- [ ] RED: Write test for ConversationId.equals()
- [ ] GREEN: Implement ConversationId.equals()
- [ ] REFACTOR: Ensure ConversationId is immutable
- [ ] RED: Write test for PiModelId.parse()
- [ ] GREEN: Implement PiModelId.parse() method
- [ ] RED: Write test for PiModelId with thinking level
- [ ] GREEN: Handle thinking level in PiModelId
- [ ] RED: Write test for PiModelId.toCommandArgs()
- [ ] GREEN: Implement PiModelId.toCommandArgs()
- [ ] REFACTOR: Ensure PiModelId is immutable
- [ ] RED: Write test for Money addition
- [ ] GREEN: Implement Money.add()
- [ ] RED: Write test that Money rejects negative amounts
- [ ] GREEN: Add validation to Money constructor
- [ ] RED: Write test for Money.format()
- [ ] GREEN: Implement Money.format()
- [ ] REFACTOR: Ensure Money is immutable
- [ ] RED: Write test for ThinkingBlock.create()
- [ ] GREEN: Implement ThinkingBlock.create()
- [ ] RED: Write test for ThinkingBlock.isEmpty()
- [ ] GREEN: Implement ThinkingBlock.isEmpty()
- [ ] REFACTOR: Ensure ThinkingBlock is immutable
- [ ] RED: Write test for SessionId generation
- [ ] GREEN: Implement SessionId.generate()
- [ ] RED: Write test for SessionId.fromString()
- [ ] GREEN: Implement SessionId.fromString()
- [ ] REFACTOR: Ensure SessionId is immutable
- [ ] Document usage patterns in JSDoc
- [ ] Verify all value objects are immutable (readonly fields)
- [ ] Verify all tests pass (>90% coverage)

**Value Objects to Create:**

**1. ConversationId**
```typescript
class ConversationId {
  private constructor(private readonly value: string) {
    if (!this.isValidUuid(value)) {
      throw new InvalidConversationIdError(value);
    }
  }
  
  static fromString(id: string): ConversationId {
    return new ConversationId(id);
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: ConversationId): boolean {
    return this.value === other.value;
  }
  
  private isValidUuid(value: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(value);
  }
}
```

**2. PiModelId**
```typescript
class PiModelId {
  private constructor(
    private readonly provider: string,
    private readonly model: string,
    private readonly thinking?: ThinkingLevel
  ) {
    if (!provider || !model) {
      throw new InvalidModelIdError(`${provider}/${model}`, 'Provider and model required');
    }
  }
  
  static parse(raw: string): PiModelId {
    const [providerModel, thinking] = raw.split(':');
    const [provider, model] = providerModel.split('/');
    
    if (!provider || !model) {
      throw new InvalidModelIdError(raw, 'Must be in format provider/model[:thinking]');
    }
    
    return new PiModelId(provider, model, thinking as ThinkingLevel);
  }
  
  toCommandArgs(): string[] {
    const args = ['--model', `${this.provider}/${this.model}`];
    if (this.thinking) {
      args.push('--thinking', this.thinking);
    }
    return args;
  }
  
  hasThinking(): boolean {
    return this.thinking !== undefined;
  }
  
  toString(): string {
    return this.thinking 
      ? `${this.provider}/${this.model}:${this.thinking}`
      : `${this.provider}/${this.model}`;
  }
}
```

**3. Money**
```typescript
class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new NegativeAmountError();
    }
  }
  
  static dollars(amount: number): Money {
    return new Money(amount, 'USD');
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
    return new Money(this.amount + other.amount, this.currency);
  }
  
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
    return new Money(this.amount - other.amount, this.currency);
  }
  
  format(): string {
    return `$${this.amount.toFixed(4)}`;
  }
  
  getAmount(): number {
    return this.amount;
  }
}
```

**4. ThinkingBlock**
```typescript
class ThinkingBlock {
  private constructor(
    private readonly content: string,
    private readonly index: number
  ) {
    if (index < 0) {
      throw new Error('Thinking block index cannot be negative');
    }
  }
  
  static create(content: string, index: number): ThinkingBlock {
    if (content.trim().length === 0) {
      return ThinkingBlock.empty(index);
    }
    return new ThinkingBlock(content, index);
  }
  
  static empty(index: number): ThinkingBlock {
    return new ThinkingBlock('', index);
  }
  
  isEmpty(): boolean {
    return this.content.length === 0;
  }
  
  getContent(): string {
    return this.content;
  }
  
  getIndex(): number {
    return this.index;
  }
}
```

**5. SessionId**
```typescript
class SessionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
  }
  
  static generate(): SessionId {
    const uuid = crypto.randomUUID();
    return new SessionId(uuid);
  }
  
  static fromString(id: string): SessionId {
    return new SessionId(id);
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
```

**Acceptance Criteria:**
- [ ] All value objects are immutable (readonly fields)
- [ ] All value objects validate on construction
- [ ] All value objects have test coverage >90%
- [ ] All value objects have equality methods where appropriate
- [ ] No primitive obsession in domain layer
- [ ] All value objects throw appropriate domain errors
- [ ] JSDoc documentation is complete

---

### 1.10 Define Domain Error Hierarchy
**File**: `shared/src/domain/errors.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 2 hours  
**Dependencies**: None

**TDD Approach:**
- RED: Write test for error construction
- GREEN: Implement error class
- RED: Write test for error metadata
- GREEN: Add error codes
- REFACTOR: Ensure error chaining works

**Checklist:**
- [ ] RED: Write test for PiProviderError construction
- [ ] GREEN: Implement PiProviderError base class
- [ ] RED: Write test that PiProviderError has error code
- [ ] GREEN: Add code property to PiProviderError
- [ ] RED: Write test for error cause chaining
- [ ] GREEN: Add cause support to PiProviderError
- [ ] RED: Write test for ModelNotFoundError
- [ ] GREEN: Implement ModelNotFoundError
- [ ] RED: Write test for InvalidModelIdError
- [ ] GREEN: Implement InvalidModelIdError
- [ ] RED: Write test for ThinkingNotSupportedError
- [ ] GREEN: Implement ThinkingNotSupportedError
- [ ] RED: Write test for InvalidConversationIdError
- [ ] GREEN: Implement InvalidConversationIdError
- [ ] RED: Write test for NegativeAmountError
- [ ] GREEN: Implement NegativeAmountError
- [ ] RED: Write test for CurrencyMismatchError
- [ ] GREEN: Implement CurrencyMismatchError
- [ ] REFACTOR: Ensure all errors extend base error
- [ ] Document error handling strategy in JSDoc
- [ ] Verify all error tests pass

**Error Hierarchy:**

```typescript
/**
 * Base error for all Pi provider domain errors.
 * Supports error codes and error chaining.
 */
class PiProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PiProviderError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ModelNotFoundError extends PiProviderError {
  constructor(modelId: string) {
    super(
      `Model not found: ${modelId}`,
      'MODEL_NOT_FOUND'
    );
    this.name = 'ModelNotFoundError';
  }
}

class InvalidModelIdError extends PiProviderError {
  constructor(modelId: string, reason: string) {
    super(
      `Invalid model ID "${modelId}": ${reason}`,
      'INVALID_MODEL_ID'
    );
    this.name = 'InvalidModelIdError';
  }
}

class ThinkingNotSupportedError extends PiProviderError {
  constructor(modelId: string) {
    super(
      `Model ${modelId} does not support thinking mode`,
      'THINKING_NOT_SUPPORTED'
    );
    this.name = 'ThinkingNotSupportedError';
  }
}

class InvalidConversationIdError extends PiProviderError {
  constructor(id: string) {
    super(
      `Invalid conversation ID: ${id}. Must be a valid UUID.`,
      'INVALID_CONVERSATION_ID'
    );
    this.name = 'InvalidConversationIdError';
  }
}

class NegativeAmountError extends PiProviderError {
  constructor() {
    super(
      'Money amount cannot be negative',
      'NEGATIVE_AMOUNT'
    );
    this.name = 'NegativeAmountError';
  }
}

class CurrencyMismatchError extends PiProviderError {
  constructor(currency1: string, currency2: string) {
    super(
      `Cannot operate on different currencies: ${currency1} and ${currency2}`,
      'CURRENCY_MISMATCH'
    );
    this.name = 'CurrencyMismatchError';
  }
}
```

**Acceptance Criteria:**
- [ ] All errors extend PiProviderError base class
- [ ] All errors have unique error codes
- [ ] All errors support error chaining (cause)
- [ ] All errors are serializable
- [ ] Error tests cover all error types
- [ ] Error messages are informative
- [ ] JSDoc documentation is complete

---

## Phase Completion Criteria

- [ ] All 10 tasks completed (8 original + 2 new)
- [ ] All unit tests passing (TDD approach used)
- [ ] TypeScript compilation successful across all packages
- [ ] No breaking changes to existing providers
- [ ] Code review completed
- [ ] Test coverage >85% for all new code
- [ ] Documentation updated
- [ ] All value objects are immutable
- [ ] All domain errors are defined

## Updated Metrics

**Original**: 8 tasks, ~24 hours  
**Revised**: 10 tasks, ~29 hours  
**Impact**: +5 hours (+1 day)

## Blockers

None identified.

## Notes

- Pi must be installed globally on the server (`npm install -g @mariozechner/pi-coding-agent`)
- Verify pi version compatibility (>= 1.0.0 recommended)
- Consider adding pi version check in provider initialization
- Value objects eliminate primitive obsession throughout the codebase
- Domain errors provide clear debugging information
- TDD approach ensures high test coverage from the start

## Next Phase

Upon completion, proceed to **Phase 2: RPC Protocol Integration** (`phase-2-tasks.md`)
