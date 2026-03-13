# Phase 5: Advanced Features

**Duration**: Week 5  
**Status**: ✅ Complete  
**Start Date**: 2026-03-13  
**Completion Date**: 2026-03-13

## Objectives

- Integrate pi's extension system
- Support pi skills and prompt templates
- Implement context file management
- Add pi-specific tooling and workflows
- Enable custom pi configurations
- Support advanced pi features (forking, compaction)

## Tasks

### 5.1 Extension System Integration
**File**: `server/src/providers/pi-extensions.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Phase 2 complete

**Checklist:**
- [ ] Implement extension discovery from pi
- [ ] List available extensions via RPC
- [ ] Handle extension command invocation
- [ ] Route extension UI requests to WebSocket
- [ ] Implement extension UI response handling
- [ ] Support extension configuration
- [ ] Add extension enable/disable controls
- [ ] Test with common pi extensions
- [ ] Document extension integration
- [ ] Handle extension errors gracefully

**Extension Discovery:**
```typescript
async function discoverPiExtensions(rpcClient: PiRpcClient): Promise<Extension[]> {
  const commands = await rpcClient.sendCommand({ type: 'get_commands' });
  
  return commands.data.commands
    .filter((cmd) => cmd.source === 'extension')
    .map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      path: cmd.path,
    }));
}
```

**Extension UI Protocol:**
```typescript
// Handle extension UI requests from pi
rpcClient.on('extension_ui_request', async (request) => {
  if (request.method === 'select') {
    // Forward to WebSocket client
    const response = await promptUser(conversationId, {
      type: 'select',
      title: request.title,
      options: request.options,
    });
    
    // Send response back to pi
    await rpcClient.stdin.write(JSON.stringify({
      type: 'extension_ui_response',
      id: request.id,
      value: response.selected,
    }) + '\n');
  }
});
```

**Acceptance Criteria:**
- Extensions can be discovered
- Extension commands can be invoked
- Extension UI dialogs work through WebSocket
- Extension errors are caught and reported
- Common extensions work correctly

---

### 5.2 Skills System Integration
**File**: `server/src/providers/pi-skills.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Task 5.1

**Checklist:**
- [ ] Implement skill discovery
- [ ] List available skills
- [ ] Support skill invocation via `/skill:name`
- [ ] Load skill README.md content
- [ ] Display skill documentation in UI
- [ ] Handle skill dependencies
- [ ] Support project-local skills
- [ ] Support user-level skills
- [ ] Test with common skills (brave-search, etc.)
- [ ] Document skill usage

**Skill Discovery:**
```typescript
interface PiSkill {
  name: string;
  description: string;
  location: 'user' | 'project' | 'path';
  path: string;
  readme?: string;
}

async function discoverPiSkills(rpcClient: PiRpcClient): Promise<PiSkill[]> {
  const commands = await rpcClient.sendCommand({ type: 'get_commands' });
  
  return commands.data.commands
    .filter((cmd) => cmd.source === 'skill')
    .map(async (cmd) => {
      const readme = await readSkillReadme(cmd.path);
      return {
        name: cmd.name.replace('skill:', ''),
        description: cmd.description,
        location: cmd.location,
        path: cmd.path,
        readme,
      };
    });
}
```

**Skill Invocation:**
```typescript
// In message handler
if (message.startsWith('/skill:')) {
  const skillName = message.split(':')[1].split(' ')[0];
  const args = message.slice(message.indexOf(' ') + 1);
  
  await rpcClient.prompt(`/skill:${skillName} ${args}`);
}
```

**Acceptance Criteria:**
- Skills are discovered correctly
- Skill invocation works via chat
- Skill documentation is accessible
- Both user and project skills work
- Skill errors are handled well

---

### 5.3 Prompt Template Support
**File**: `server/src/providers/pi-prompts.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Task 5.1

**Checklist:**
- [ ] Implement prompt template discovery
- [ ] List available templates
- [ ] Support template invocation
- [ ] Handle template variables
- [ ] Display template documentation
- [ ] Support nested templates
- [ ] Add template creation UI
- [ ] Test with various templates
- [ ] Document template system
- [ ] Handle template errors

**Template Discovery:**
```typescript
interface PiPromptTemplate {
  name: string;
  description?: string;
  location: 'user' | 'project' | 'path';
  path: string;
  variables?: string[];
}

async function discoverPiPrompts(rpcClient: PiRpcClient): Promise<PiPromptTemplate[]> {
  const commands = await rpcClient.sendCommand({ type: 'get_commands' });
  
  return commands.data.commands
    .filter((cmd) => cmd.source === 'prompt')
    .map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      location: cmd.location,
      path: cmd.path,
      variables: extractTemplateVariables(cmd.path),
    }));
}
```

**Template Expansion:**
```typescript
// Templates are expanded by pi automatically when invoked
// Just need to forward the /template command
if (message.startsWith('/')) {
  const templateName = message.split(' ')[0].slice(1);
  const templates = await discoverPiPrompts(rpcClient);
  
  if (templates.some((t) => t.name === templateName)) {
    await rpcClient.prompt(message);
  }
}
```

**Acceptance Criteria:**
- Templates are discovered and listed
- Template invocation works correctly
- Variables are handled properly
- Template UI is intuitive
- Common templates work well

---

### 5.4 Context File Management
**File**: `server/src/providers/pi-context.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Phase 2 complete

**Checklist:**
- [ ] Support `@file` syntax for context inclusion
- [ ] Parse context file references from messages
- [ ] Validate context file paths
- [ ] Show included files in UI
- [ ] Support glob patterns for multiple files
- [ ] Handle context file read errors
- [ ] Add context file size limits
- [ ] Implement context file preview
- [ ] Support .picontext file discovery
- [ ] Document context file usage

**Context Inclusion:**
```typescript
// Pi handles @file syntax automatically, but we can enhance the UI
function extractContextFiles(message: string): string[] {
  const pattern = /@([^\s]+)/g;
  const matches = message.match(pattern) || [];
  return matches.map((m) => m.slice(1));
}

// Display context files in message UI
function MessageWithContext({ message }: Props) {
  const contextFiles = extractContextFiles(message.content);
  
  return (
    <>
      {contextFiles.length > 0 && (
        <div className="context-files">
          <span>Included files:</span>
          {contextFiles.map((file) => (
            <FileChip key={file} path={file} />
          ))}
        </div>
      )}
      <div className="message-content">
        {message.content}
      </div>
    </>
  );
}
```

**Acceptance Criteria:**
- Context files are recognized in messages
- File inclusions work correctly
- UI shows included files clearly
- Glob patterns work as expected
- File size limits are enforced

---

### 5.5 Session Forking Support
**File**: `server/src/providers/pi-fork.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Phase 3 complete

**Checklist:**
- [ ] Implement fork command via RPC
- [ ] UI for selecting fork point
- [ ] Create forked conversation in unleashd
- [ ] Link forked conversations to parent
- [ ] Display fork tree in UI
- [ ] Support switching between forks
- [ ] Handle fork metadata
- [ ] Test fork persistence
- [ ] Document forking workflow
- [ ] Add fork comparison view

**Fork Implementation:**
```typescript
async function forkPiSession(
  conversationId: string,
  entryId: string
): Promise<string> {
  const conv = conversations.get(conversationId);
  if (!conv || conv.provider !== 'pi') {
    throw new Error('Not a pi conversation');
  }
  
  // Fork via RPC
  const result = await conv.rpcClient.sendCommand({
    type: 'fork',
    entryId,
  });
  
  if (result.data.cancelled) {
    throw new Error('Fork cancelled');
  }
  
  // Create new conversation for the fork
  const forkedId = generateUUID();
  const forkedConv = await createConversation({
    id: forkedId,
    provider: 'pi',
    parentConversationId: conversationId,
    forkPoint: entryId,
  });
  
  return forkedId;
}
```

**Fork UI:**
```typescript
function ForkButton({ conversationId, messageId }: Props) {
  const handleFork = async () => {
    const forkedId = await forkPiSession(conversationId, messageId);
    navigate(`/conversation/${forkedId}`);
  };
  
  return (
    <button onClick={handleFork} className="fork-button">
      🌿 Fork from here
    </button>
  );
}
```

**Acceptance Criteria:**
- Sessions can be forked at any message
- Forked conversations are independent
- Parent-fork relationship is preserved
- Fork tree is navigable
- Forks persist correctly

---

### 5.6 Compaction Support
**File**: `server/src/providers/pi-compaction.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 5 hours  
**Dependencies**: Phase 2 complete

**Checklist:**
- [ ] Implement manual compaction via RPC
- [ ] Support auto-compaction events
- [ ] Display compaction summaries
- [ ] Show token savings from compaction
- [ ] Add compaction controls to UI
- [ ] Handle compaction errors
- [ ] Test compaction with large sessions
- [ ] Document compaction behavior
- [ ] Add compaction history
- [ ] Support custom compaction instructions

**Compaction Implementation:**
```typescript
async function compactPiSession(
  conversationId: string,
  customInstructions?: string
): Promise<CompactionResult> {
  const conv = conversations.get(conversationId);
  if (!conv || conv.provider !== 'pi') {
    throw new Error('Not a pi conversation');
  }
  
  const result = await conv.rpcClient.sendCommand({
    type: 'compact',
    customInstructions,
  });
  
  // Update conversation state
  conv.lastCompaction = {
    timestamp: Date.now(),
    summary: result.data.summary,
    tokensBefore: result.data.tokensBefore,
    tokensAfter: getCurrentTokenCount(conv),
  };
  
  broadcastConversationUpdate(conversationId);
  
  return result.data;
}
```

**Compaction UI:**
```typescript
function CompactionButton({ conversationId }: Props) {
  const [compacting, setCompacting] = useState(false);
  const handleCompact = async () => {
    setCompacting(true);
    try {
      const result = await compactPiSession(conversationId);
      notify(`Saved ${result.tokensBefore - result.tokensAfter} tokens`);
    } finally {
      setCompacting(false);
    }
  };
  
  return (
    <button onClick={handleCompact} disabled={compacting}>
      {compacting ? 'Compacting...' : '🗜️ Compact Context'}
    </button>
  );
}
```

**Acceptance Criteria:**
- Manual compaction works correctly
- Auto-compaction events are handled
- Summaries are displayed clearly
- Token savings are calculated accurately
- Compaction errors are handled well

---

### 5.7 Custom Tool Integration
**File**: `server/src/providers/pi-custom-tools.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: Phase 2 complete

**Checklist:**
- [ ] Support custom tool configuration
- [ ] Allow enabling/disabling built-in tools
- [ ] Add unleashd-specific tools to pi
- [ ] Handle tool execution events
- [ ] Display tool output in UI
- [ ] Add tool execution history
- [ ] Test with various tools
- [ ] Document tool system
- [ ] Handle tool errors
- [ ] Add tool performance metrics

**Custom Tools:**
```typescript
interface PiToolConfig {
  enabledBuiltins: string[]; // read, bash, edit, write
  customTools?: Tool[];
}

async function configurePiTools(
  conversationId: string,
  config: PiToolConfig
): Promise<void> {
  const conv = conversations.get(conversationId);
  if (!conv || conv.provider !== 'pi') return;
  
  // Restart pi with new tool configuration
  await conv.rpcClient.stop();
  await conv.rpcClient.start({
    ...conv.config,
    tools: config.enabledBuiltins.join(','),
  });
}
```

**Acceptance Criteria:**
- Tool configuration can be changed
- Custom tools can be added
- Tool execution is tracked
- Tool output displays correctly
- Tool errors are handled

---

### 5.8 Advanced Configuration
**File**: `server/src/config/pi-config.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: None

**Checklist:**
- [ ] Create pi configuration schema
- [ ] Support environment variable overrides
- [ ] Add per-conversation configuration
- [ ] Implement configuration validation
- [ ] Support configuration presets
- [ ] Add configuration UI
- [ ] Document all configuration options
- [ ] Test various configurations
- [ ] Handle configuration errors
- [ ] Support configuration migration

**Configuration Schema:**
```typescript
interface PiConfig {
  binary: string;
  sessionDir: string;
  defaultModel: string;
  defaultThinking: ThinkingLevel;
  tools: string[];
  extensions: string[];
  skills: string[];
  maxRetries: number;
  timeout: number;
  autoCompaction: boolean;
  compactionThreshold: number;
}

const defaultPiConfig: PiConfig = {
  binary: 'pi',
  sessionDir: '~/.pi/agent/sessions',
  defaultModel: 'anthropic/claude-3-5-sonnet-latest',
  defaultThinking: 'medium',
  tools: ['read', 'bash', 'edit', 'write'],
  extensions: [],
  skills: [],
  maxRetries: 3,
  timeout: 300000,
  autoCompaction: true,
  compactionThreshold: 0.8,
};
```

**Acceptance Criteria:**
- All configuration options work
- Validation prevents invalid configs
- Configuration can be changed at runtime
- Changes take effect appropriately
- Configuration is well-documented

---

## Phase Completion Criteria

- [ ] All 8 tasks completed
- [ ] Extensions work correctly
- [ ] Skills can be used
- [ ] Prompt templates function properly
- [ ] Context files are supported
- [ ] Forking works as expected
- [ ] Compaction is functional
- [ ] All advanced features tested
- [ ] Code review completed
- [ ] Documentation complete

## Blockers

- May need specific pi extensions for testing
- Forking feature requires pi RPC support

## Notes

- Extension UI protocol may need iteration based on usage
- Consider creating unleashd-specific pi extensions
- Document best practices for using advanced features
- Gather feedback on feature priorities

## Next Phase

Upon completion, proceed to **Phase 6: Testing & Deployment** (`phase-6-tasks.md`)
