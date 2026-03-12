# Phase 4: UI Enhancements

**Duration**: Week 4  
**Status**: Not Started  
**Start Date**: TBD  
**Completion Date**: TBD

## Objectives

- Add pi-specific UI components and features
- Implement thinking block display toggle
- Create enhanced model selector for pi
- Add token usage and cost display
- Implement pi-specific conversation metadata
- Polish user experience for pi provider
- Use value objects (ThinkingBlock, Money) in components

## Tasks

### 4.1 Create Thinking Block Component
**File**: `client/src/components/ThinkingBlock.tsx`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Phase 3 complete

**TDD Approach:**
- RED: Write component tests with Testing Library
- GREEN: Implement minimal component
- RED: Write interaction tests
- GREEN: Add expand/collapse logic
- REFACTOR: Optimize rendering

**Checklist:**
- [ ] RED: Write test for rendering thinking block
- [ ] GREEN: Create basic ThinkingBlock component
- [ ] RED: Write test for expand/collapse toggle
- [ ] GREEN: Implement collapsible UI with useState
- [ ] RED: Write test for syntax highlighting code in thinking
- [ ] GREEN: Add syntax highlighting with markdown
- [ ] RED: Write test for distinct styling
- [ ] GREEN: Apply thinking-specific CSS classes
- [ ] RED: Write test for show/hide all thinking toggle
- [ ] GREEN: Integrate with UI store for global toggle
- [ ] RED: Write test for thinking visibility persistence
- [ ] GREEN: Persist preference in localStorage
- [ ] RED: Write test for multiple thinking blocks
- [ ] GREEN: Handle array of blocks with indices
- [ ] RED: Write test for expand/collapse animations
- [ ] GREEN: Add CSS transitions
- [ ] RED: Write test for long thinking content performance
- [ ] GREEN: Optimize with lazy rendering or virtualization
- [ ] REFACTOR: Extract reusable hooks
- [ ] Test various thinking content types
- [ ] Verify all tests pass

**Component Structure:**
```typescript
interface ThinkingBlockProps {
  thinking: string;  // Raw string from ThinkingBlock.getContent()
  index: number;
  defaultExpanded?: boolean;
}

export function ThinkingBlock({ thinking, index, defaultExpanded = false }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const showThinking = useUIStore((s) => s.showThinking);
  
  if (!showThinking) return null;
  
  return (
    <div className="thinking-block" data-index={index}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="thinking-toggle"
        aria-expanded={expanded}
      >
        {expanded ? '▼' : '▶'} Thinking {index + 1}
      </button>
      {expanded && (
        <div className="thinking-content">
          <Markdown content={thinking} />
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Thinking blocks display correctly
- [ ] Expand/collapse works smoothly
- [ ] Visibility toggle affects all thinking blocks
- [ ] Preference is persisted in localStorage
- [ ] Performance good with long thinking (>10KB)
- [ ] Styling matches app theme
- [ ] Test coverage >85%
- [ ] Accessibility: keyboard navigation, ARIA labels

---

### 4.2 Update Message Component for Pi
**File**: `client/src/components/Message.tsx`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Task 4.1

**TDD Approach:**
- RED: Write test for pi message rendering
- GREEN: Add pi-specific rendering
- RED: Write test for thinking blocks
- GREEN: Render ThinkingBlock components
- REFACTOR: Extract pi-specific logic

**Checklist:**
- [ ] RED: Write test for detecting pi provider
- [ ] GREEN: Check message.provider === 'pi'
- [ ] RED: Write test for rendering thinking blocks
- [ ] GREEN: Map thinking array to ThinkingBlock components
- [ ] RED: Write test for tool calls with pi formatting
- [ ] GREEN: Display tool calls with pi-specific styling
- [ ] RED: Write test for token usage badge
- [ ] GREEN: Show token usage badge for pi messages
- [ ] RED: Write test for cost badge
- [ ] GREEN: Display cost badge using Money.format()
- [ ] RED: Write test for pi provider icon/badge
- [ ] GREEN: Add pi icon to message header
- [ ] RED: Write test for pi-specific metadata
- [ ] GREEN: Handle pi metadata fields
- [ ] RED: Write test with various pi message types
- [ ] GREEN: Verify all message types render correctly
- [ ] RED: Write test for backward compatibility
- [ ] GREEN: Ensure other providers not affected
- [ ] REFACTOR: Extract PiMessageContent component
- [ ] Verify mobile layout
- [ ] Verify all tests pass

**Message Rendering:**
```typescript
function Message({ message, provider }: MessageProps) {
  const isPi = provider === 'pi';
  
  return (
    <div className={`message ${message.role} provider-${provider}`}>
      {message.role === 'assistant' && (
        <>
          {/* Thinking blocks (pi only) */}
          {isPi && message.thinkingBlocks?.map((thinking, i) => (
            <ThinkingBlock 
              key={i} 
              thinking={thinking.getContent()} 
              index={i} 
            />
          ))}
          
          {/* Main message content */}
          <div className="message-content">
            <Markdown content={message.content} />
          </div>
          
          {/* Metadata badges (pi only) */}
          {isPi && message.usage && (
            <div className="message-meta">
              <TokenBadge usage={message.usage} />
              {message.cost && (
                <CostBadge cost={message.cost.format()} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Pi messages render correctly
- [ ] Thinking blocks appear in correct position
- [ ] Metadata displays appropriately
- [ ] Other providers not affected
- [ ] Mobile layout works well
- [ ] Test coverage >85%

---

### 4.3 Create Pi Model Selector
**File**: `client/src/components/PiModelSelector.tsx`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: None

**TDD Approach:**
- RED: Write test for model list rendering
- GREEN: Render grouped model list
- RED: Write test for model selection
- GREEN: Handle model change
- REFACTOR: Extract model grouping logic

**Checklist:**
- [ ] RED: Write test for rendering model selector
- [ ] GREEN: Create PiModelSelector component
- [ ] RED: Write test for grouping models by provider
- [ ] GREEN: Group models (Anthropic, OpenAI, Google)
- [ ] RED: Write test for thinking level dropdown
- [ ] GREEN: Add thinking level selector
- [ ] RED: Write test for showing model capabilities
- [ ] GREEN: Display thinking support indicator
- [ ] RED: Write test for displaying model pricing
- [ ] GREEN: Show pricing information
- [ ] RED: Write test for model search/filter
- [ ] GREEN: Implement model search
- [ ] RED: Write test for recently used models
- [ ] GREEN: Add recently used section
- [ ] RED: Write test for model switching during conversation
- [ ] GREEN: Handle mid-conversation model switch
- [ ] RED: Write test for loading state
- [ ] GREEN: Show loading during switch
- [ ] RED: Write test for model feature tooltips
- [ ] GREEN: Add tooltips for features
- [ ] REFACTOR: Extract model grouping hook
- [ ] Verify accessibility
- [ ] Verify all tests pass

**Selector UI:**
```typescript
export function PiModelSelector({ conversationId }: Props) {
  const conv = useAtomValue(conversationAtomFamily(conversationId));
  const [selectedModel, setSelectedModel] = useState(conv.model);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>('medium');
  
  const modelsByProvider = useMemo(() => {
    return groupBy(PI_MODELS, (m) => {
      const [provider] = m.id.split('/');
      return provider;
    });
  }, []);
  
  const handleModelChange = async (modelId: string) => {
    const fullModelId = thinkingLevel !== 'off' 
      ? `${modelId}:${thinkingLevel}`
      : modelId;
    await setModel(conversationId, fullModelId);
  };
  
  const selectedModelSupportsThinking = useMemo(() => {
    const model = PI_MODELS.find(m => m.id === selectedModel);
    return model?.supportsThinking ?? false;
  }, [selectedModel]);
  
  return (
    <div className="pi-model-selector">
      <select 
        value={selectedModel} 
        onChange={(e) => {
          setSelectedModel(e.target.value);
          handleModelChange(e.target.value);
        }}
        aria-label="Select AI model"
      >
        {Object.entries(modelsByProvider).map(([provider, models]) => (
          <optgroup label={provider} key={provider}>
            {models.map((model) => (
              <option value={model.id} key={model.id}>
                {model.displayName} {model.supportsThinking && '🧠'}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      
      {selectedModelSupportsThinking && (
        <select 
          value={thinkingLevel} 
          onChange={(e) => {
            const level = e.target.value as ThinkingLevel;
            setThinkingLevel(level);
            handleModelChange(selectedModel);
          }}
          aria-label="Select thinking level"
        >
          <option value="off">No Thinking</option>
          <option value="minimal">Minimal</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="xhigh">Extra High</option>
        </select>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Models grouped logically by provider
- [ ] Thinking level selector appears for compatible models
- [ ] Model switching works without errors
- [ ] UI shows current model clearly
- [ ] Pricing info accurate and helpful
- [ ] Test coverage >85%
- [ ] Accessibility: keyboard nav, screen reader support

---

### 4.4 Add Cost Tracking Display
**File**: `client/src/components/CostDisplay.tsx`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Phase 3 task 3.8

**TDD Approach:**
- RED: Write test for cost display
- GREEN: Render cost from Money.format()
- RED: Write test for cost breakdown
- GREEN: Show component costs
- REFACTOR: Optimize re-renders

**Note**: Receives formatted costs from Money.format(), never manipulates raw numbers.

**Checklist:**
- [ ] RED: Write test for rendering total cost
- [ ] GREEN: Display conversation total cost
- [ ] RED: Write test for per-message cost
- [ ] GREEN: Show individual message costs
- [ ] RED: Write test for cost breakdown
- [ ] GREEN: Break down by type (input, output, cache)
- [ ] RED: Write test for cost trend visualization
- [ ] GREEN: Add simple chart/graph
- [ ] RED: Write test for currency formatting
- [ ] GREEN: Format using Money.format()
- [ ] RED: Write test for cost warnings
- [ ] GREEN: Warn for expensive operations
- [ ] RED: Write test for multiple currencies
- [ ] GREEN: Support different currency displays
- [ ] RED: Write test for cost export
- [ ] GREEN: Implement cost reporting/export
- [ ] RED: Write test for cost comparison
- [ ] GREEN: Compare costs across providers
- [ ] REFACTOR: Extract cost formatting utils
- [ ] Optimize re-renders with useMemo
- [ ] Verify all tests pass

**Cost Display:**
```typescript
interface CostDisplayProps {
  conversationId: string;
}

export function CostDisplay({ conversationId }: CostDisplayProps) {
  const conv = useAtomValue(conversationAtomFamily(conversationId));
  
  // Server sends formatted cost strings from Money.format()
  const totalCost = useMemo(() => {
    // Aggregate is done server-side, just display
    return conv.totalCostFormatted || '$0.0000';
  }, [conv.totalCostFormatted]);
  
  const costBreakdown = useMemo(() => {
    return {
      input: conv.costBreakdown?.inputFormatted || '$0.0000',
      output: conv.costBreakdown?.outputFormatted || '$0.0000',
      cacheRead: conv.costBreakdown?.cacheReadFormatted || '$0.0000',
      cacheWrite: conv.costBreakdown?.cacheWriteFormatted || '$0.0000',
    };
  }, [conv.costBreakdown]);
  
  return (
    <div className="cost-display">
      <div className="total-cost">
        <span>Total Cost:</span>
        <strong>{totalCost}</strong>
      </div>
      
      <details className="cost-breakdown">
        <summary>Cost Breakdown</summary>
        <dl>
          <dt>Input Tokens:</dt>
          <dd>{costBreakdown.input}</dd>
          <dt>Output Tokens:</dt>
          <dd>{costBreakdown.output}</dd>
          <dt>Cache Read:</dt>
          <dd>{costBreakdown.cacheRead}</dd>
          <dt>Cache Write:</dt>
          <dd>{costBreakdown.cacheWrite}</dd>
        </dl>
      </details>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Cost displays accurately (formatted strings from server)
- [ ] Breakdown is clear and informative
- [ ] Updates in real-time during conversation
- [ ] Currency formatting is correct
- [ ] Component is performant (no unnecessary re-renders)
- [ ] Test coverage >90%

---

### 4.5 Create Token Usage Display
**File**: `client/src/components/TokenUsage.tsx`  
**Status**: ⬜ Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 3 complete

**TDD Approach:**
- RED: Write test for token display
- GREEN: Show token counts
- RED: Write test for context usage bar
- GREEN: Add progress bar
- REFACTOR: Extract token calculation

**Checklist:**
- [ ] RED: Write test for displaying token counts
- [ ] GREEN: Show input/output token counts
- [ ] RED: Write test for cache hit/miss stats
- [ ] GREEN: Display cache statistics
- [ ] RED: Write test for token usage trends
- [ ] GREEN: Show usage over time
- [ ] RED: Write test for context window indicator
- [ ] GREEN: Add context usage progress bar
- [ ] RED: Write test for tokens per message
- [ ] GREEN: Show per-message token counts
- [ ] RED: Write test for approaching limits warning
- [ ] GREEN: Warn when near context limit
- [ ] RED: Write test for token usage chart
- [ ] GREEN: Implement usage visualization
- [ ] REFACTOR: Extract token aggregation logic
- [ ] Test with various models (different context limits)
- [ ] Verify all tests pass

**Token Display:**
```typescript
export function TokenUsage({ conversationId }: Props) {
  const conv = useAtomValue(conversationAtomFamily(conversationId));
  
  const totalTokens = useMemo(() => {
    return conv.messages.reduce((sum, msg) => {
      const usage = msg.usage;
      if (!usage) return sum;
      return sum + usage.input + usage.output;
    }, 0);
  }, [conv.messages]);
  
  const contextLimit = useMemo(() => {
    return getContextLimit(conv.model) || 200000; // Default 200k
  }, [conv.model]);
  
  const percentage = (totalTokens / contextLimit) * 100;
  const isApproachingLimit = percentage > 80;
  
  return (
    <div className="token-usage">
      <div className="token-stats">
        <span className="token-count">
          {totalTokens.toLocaleString()} tokens
        </span>
        <span className="token-percentage">
          ({percentage.toFixed(1)}% of context)
        </span>
      </div>
      
      <div 
        className={`token-bar ${isApproachingLimit ? 'warning' : ''}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Context window usage"
      >
        <div 
          className="token-fill" 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isApproachingLimit && (
        <div className="token-warning" role="alert">
          ⚠️ Approaching context limit. Consider compaction.
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Token counts are accurate
- [ ] Context usage bar works correctly
- [ ] Warning appears when approaching limit
- [ ] Performance good with many messages
- [ ] Component updates in real-time
- [ ] Test coverage >90%
- [ ] Accessibility: ARIA labels, alerts

---

### 4.6 Add Pi Provider Styling
**File**: `client/src/styles/providers/pi.css`  
**Status**: ⬜ Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: None

**TDD Approach:**
- Visual regression testing
- Cross-browser compatibility checks
- Accessibility contrast testing

**Checklist:**
- [ ] Define pi-specific CSS variables
- [ ] Style pi provider badge/icon
- [ ] Style thinking blocks with distinct colors
- [ ] Style cost/token displays
- [ ] Create pi color scheme (primary, secondary)
- [ ] Add pi-specific animations (pulse, fade)
- [ ] Ensure dark mode compatibility
- [ ] Test across different screen sizes
- [ ] Optimize for accessibility (WCAG AA)
- [ ] Document CSS custom properties
- [ ] Verify contrast ratios
- [ ] Test with screen readers

**CSS Variables:**
```css
:root {
  /* Pi brand colors */
  --pi-primary: #6366f1;
  --pi-secondary: #8b5cf6;
  --pi-accent: #a78bfa;
  
  /* Thinking block colors */
  --pi-thinking-bg: rgba(99, 102, 241, 0.1);
  --pi-thinking-border: rgba(99, 102, 241, 0.3);
  --pi-thinking-text: var(--text-primary);
  
  /* Cost indicator colors */
  --pi-cost-positive: #10b981;
  --pi-cost-warning: #f59e0b;
  --pi-cost-danger: #ef4444;
  
  /* Animations */
  --pi-transition-fast: 150ms ease;
  --pi-transition-normal: 300ms ease;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --pi-thinking-bg: rgba(99, 102, 241, 0.15);
    --pi-thinking-border: rgba(99, 102, 241, 0.4);
  }
}

/* Thinking block styling */
.provider-pi .thinking-block {
  background: var(--pi-thinking-bg);
  border-left: 3px solid var(--pi-thinking-border);
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 4px;
  transition: background var(--pi-transition-normal);
}

.provider-pi .thinking-block:hover {
  background: rgba(99, 102, 241, 0.15);
}

.provider-pi .thinking-toggle {
  color: var(--pi-primary);
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

/* Cost display styling */
.provider-pi .cost-display {
  color: var(--pi-cost-positive);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.provider-pi .cost-warning {
  color: var(--pi-cost-warning);
}

/* Provider badge */
.provider-badge.pi {
  background: var(--pi-primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .provider-pi .thinking-block {
    padding: 0.75rem;
    margin: 0.375rem 0;
  }
}
```

**Acceptance Criteria:**
- [ ] Pi UI elements have consistent styling
- [ ] Colors are accessible (WCAG AA contrast ratios)
- [ ] Dark mode looks good
- [ ] Animations are smooth (60fps)
- [ ] CSS is well-organized and documented
- [ ] Mobile responsive
- [ ] Cross-browser compatible

---

### 4.7 Update Conversation List for Pi
**File**: `client/src/components/ConversationList.tsx`  
**Status**: ⬜ Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: None

**TDD Approach:**
- RED: Write test for pi conversation items
- GREEN: Add pi-specific rendering
- RED: Write test for cost display
- GREEN: Show cost in preview
- REFACTOR: Extract provider-specific rendering

**Checklist:**
- [ ] RED: Write test for pi provider icon
- [ ] GREEN: Add pi icon to conversation items
- [ ] RED: Write test for model name display
- [ ] GREEN: Show model name in preview
- [ ] RED: Write test for cost in preview
- [ ] GREEN: Display formatted cost
- [ ] RED: Write test for thinking indicator
- [ ] GREEN: Show indicator if thinking used
- [ ] RED: Write test for pi-specific filters
- [ ] GREEN: Add filters for pi conversations
- [ ] RED: Write test for sorting by cost
- [ ] GREEN: Update sorting to include cost option
- [ ] RED: Write test for bulk actions
- [ ] GREEN: Add bulk actions for pi conversations
- [ ] RED: Write test with mixed providers
- [ ] GREEN: Verify all providers render correctly
- [ ] REFACTOR: Extract ConversationListItem
- [ ] Ensure performance with many conversations
- [ ] Verify all tests pass

**Conversation Item:**
```typescript
function ConversationItem({ id }: Props) {
  const conv = useAtomValue(conversationAtomFamily(id));
  const isPi = conv.provider === 'pi';
  
  return (
    <div className={`conversation-item provider-${conv.provider}`}>
      <div className="conversation-header">
        <ProviderBadge provider={conv.provider} />
        <span className="conversation-title">
          {conv.messages[0]?.content.slice(0, 50)}...
        </span>
      </div>
      
      {isPi && (
        <div className="conversation-meta">
          <span className="model-name" title={conv.model}>
            {conv.modelDisplayName || conv.model}
          </span>
          {conv.hasThinking && (
            <span className="thinking-indicator" title="Uses thinking mode">
              🧠
            </span>
          )}
          {conv.totalCostFormatted && (
            <span className="cost" title="Total cost">
              {conv.totalCostFormatted}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Pi conversations distinguishable
- [ ] Metadata displays correctly
- [ ] Filters work as expected
- [ ] Performance acceptable (100+ conversations)
- [ ] Mobile view works well
- [ ] Test coverage >85%

---

### 4.8 Create Pi Settings Panel
**File**: `client/src/components/PiSettings.tsx`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: None

**TDD Approach:**
- RED: Write test for settings rendering
- GREEN: Render settings form
- RED: Write test for settings persistence
- GREEN: Save to localStorage/server
- REFACTOR: Extract settings hooks

**Checklist:**
- [ ] RED: Write test for rendering settings panel
- [ ] GREEN: Create PiSettings component
- [ ] RED: Write test for thinking visibility toggle
- [ ] GREEN: Add toggle for showing thinking
- [ ] RED: Write test for default model selection
- [ ] GREEN: Add default model dropdown
- [ ] RED: Write test for default thinking level
- [ ] GREEN: Add default thinking level selector
- [ ] RED: Write test for cost display preferences
- [ ] GREEN: Add cost display options
- [ ] RED: Write test for session directory config
- [ ] GREEN: Add session directory input
- [ ] RED: Write test for pi binary path config
- [ ] GREEN: Add binary path configuration
- [ ] RED: Write test for extension/skill preferences
- [ ] GREEN: Add extension/skill toggles
- [ ] RED: Write test for settings persistence
- [ ] GREEN: Save settings to localStorage
- [ ] RED: Write test for settings validation
- [ ] GREEN: Validate all settings
- [ ] REFACTOR: Extract usePiSettings hook
- [ ] Verify all tests pass

**Settings Panel:**
```typescript
export function PiSettings() {
  const [settings, setSettings] = useUIStore((s) => [
    s.piSettings,
    s.setPiSettings,
  ]);
  
  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };
  
  return (
    <div className="pi-settings">
      <h3>Pi Provider Settings</h3>
      
      <fieldset>
        <legend>Display Options</legend>
        
        <label>
          <input
            type="checkbox"
            checked={settings.showThinking}
            onChange={(e) => handleSettingChange('showThinking', e.target.checked)}
          />
          Show Thinking Blocks
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.showCostInMessages}
            onChange={(e) => handleSettingChange('showCostInMessages', e.target.checked)}
          />
          Show Cost in Messages
        </label>
      </fieldset>
      
      <fieldset>
        <legend>Defaults</legend>
        
        <label>
          Default Model:
          <select
            value={settings.defaultModel}
            onChange={(e) => handleSettingChange('defaultModel', e.target.value)}
          >
            {PI_MODELS.map((model) => (
              <option value={model.id} key={model.id}>
                {model.displayName}
              </option>
            ))}
          </select>
        </label>
        
        <label>
          Default Thinking Level:
          <select
            value={settings.defaultThinking}
            onChange={(e) => handleSettingChange('defaultThinking', e.target.value)}
          >
            <option value="off">Off</option>
            <option value="minimal">Minimal</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="xhigh">Extra High</option>
          </select>
        </label>
      </fieldset>
      
      <button onClick={() => setSettings(DEFAULT_PI_SETTINGS)}>
        Reset to Defaults
      </button>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] All settings work correctly
- [ ] Settings persist across sessions
- [ ] Validation prevents invalid values
- [ ] UI is intuitive and clear
- [ ] Changes take effect immediately
- [ ] Test coverage >85%
- [ ] Accessibility: labels, keyboard nav

---

## Phase Completion Criteria

- [ ] All 8 tasks completed
- [ ] Pi-specific UI components render correctly
- [ ] Thinking blocks display and toggle properly
- [ ] Cost and token displays accurate (using Money.format())
- [ ] Model selector works seamlessly
- [ ] Styling is consistent and polished
- [ ] All UI tests passing
- [ ] Code review completed
- [ ] UX review completed
- [ ] Accessibility audit passed
- [ ] Documentation updated

## Updated Metrics

**Original**: 8 tasks, ~32 hours  
**Revised**: 8 tasks, ~32 hours  
**Impact**: No change in task count, better quality with TDD

## Blockers

None identified.

## Notes

- Consider A/B testing thinking block visibility default
- Monitor performance with many thinking blocks
- Gather user feedback on cost display preferences
- Consider adding cost alerts/budgets
- All cost display uses Money.format() - never raw numbers
- All thinking display uses ThinkingBlock.getContent()
- Ensure accessibility throughout (WCAG AA minimum)

## Value Object Usage in UI

| Domain Concept | Value Object | UI Usage |
|----------------|--------------|----------|
| Thinking Content | `ThinkingBlock` | `thinking.getContent()` for display |
| Cost Amount | `Money` | `cost.format()` for display, server-formatted strings |
| Session ID | `SessionId` | `id.toString()` in URLs/links |
| Conversation ID | `ConversationId` | `id.toString()` in routes |

## Next Phase

Upon completion, proceed to **Phase 5: Advanced Features** (`phase-5-tasks.md`)
