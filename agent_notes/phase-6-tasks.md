# Phase 6: Testing & Deployment

**Duration**: Week 6  
**Status**: Not Started  
**Start Date**: TBD  
**Completion Date**: TBD

## Objectives

- Comprehensive test coverage for pi integration
- Performance optimization and benchmarking
- Security review and hardening
- Documentation completion
- Deployment preparation
- Production readiness validation

## Tasks

### 6.1 Unit Test Coverage
**Files**: Various `__tests__` directories  
**Status**: ⬜ Not Started  
**Estimated Time**: 8 hours  
**Dependencies**: Phases 1-5 complete

**Checklist:**
- [ ] Achieve >80% coverage for pi provider code
- [ ] Test all RPC command methods
- [ ] Test event translation layer
- [ ] Test session persistence
- [ ] Test thinking block extraction
- [ ] Test cost calculation
- [ ] Test model decomposition
- [ ] Test error handling paths
- [ ] Test edge cases and boundary conditions
- [ ] Review and fix flaky tests

**Test Organization:**
```
server/src/providers/__tests__/
  ├── pi.test.ts                    # Provider interface
  ├── pi-rpc-client.test.ts        # RPC client core
  ├── pi-events.test.ts            # Event translation
  ├── pi-session.test.ts           # Session management
  └── pi-cost.test.ts              # Cost calculation

server/src/adapters/__tests__/
  ├── pi-adapter.test.ts           # Disk adapter
  ├── pi-thinking.test.ts          # Thinking extraction
  └── pi-discovery.test.ts         # Session discovery
```

**Key Test Cases:**
```typescript
describe('PiRpcClient', () => {
  it('should spawn pi process successfully', async () => {
    const client = new PiRpcClient();
    await client.start({ model: 'anthropic/claude-3-5-sonnet-latest' });
    expect(client.isRunning()).toBe(true);
    await client.stop();
  });
  
  it('should handle malformed JSONL gracefully', async () => {
    const client = new PiRpcClient();
    await client.start();
    
    // Inject malformed line
    client['handleStdout']('not valid json\n');
    
    // Should not crash, should log error
    expect(mockLogger.error).toHaveBeenCalled();
  });
  
  it('should correlate command responses by ID', async () => {
    const client = new PiRpcClient();
    await client.start();
    
    const promise = client.sendCommand({ type: 'get_state' });
    
    // Simulate response
    client['handleStdout'](JSON.stringify({
      type: 'response',
      id: '123',
      success: true,
      data: { isStreaming: false }
    }) + '\n');
    
    const result = await promise;
    expect(result.data.isStreaming).toBe(false);
  });
});
```

**Acceptance Criteria:**
- Test coverage >80% for all pi modules
- All unit tests pass consistently
- No flaky tests (100 runs without failure)
- Edge cases are covered
- Mock usage is appropriate

---

### 6.2 Integration Test Suite
**File**: `server/src/__tests__/integration/pi.test.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 10 hours  
**Dependencies**: Task 6.1

**Checklist:**
- [ ] Test complete conversation flow
- [ ] Test session persistence and resume
- [ ] Test model switching
- [ ] Test thinking mode toggling
- [ ] Test tool execution
- [ ] Test streaming with interruption
- [ ] Test error recovery
- [ ] Test concurrent conversations
- [ ] Test WebSocket event broadcasting
- [ ] Test provider switching

**Integration Test Structure:**
```typescript
describe('Pi Integration', () => {
  let server: Server;
  let wsClient: WebSocket;
  
  beforeAll(async () => {
    server = await startTestServer();
    wsClient = await connectWebSocket(server.port);
  });
  
  afterAll(async () => {
    await wsClient.close();
    await server.stop();
  });
  
  it('should create pi conversation and stream response', async () => {
    // Create conversation
    const createMsg = {
      type: 'new_conversation',
      provider: 'pi',
      model: 'anthropic/claude-3-5-sonnet-latest',
    };
    
    wsClient.send(JSON.stringify(createMsg));
    
    const created = await waitForMessage(wsClient, 'conversation_created');
    expect(created.conversation.provider).toBe('pi');
    
    // Send message
    const sendMsg = {
      type: 'send_message',
      conversationId: created.conversation.id,
      content: 'Count to 5',
    };
    
    wsClient.send(JSON.stringify(sendMsg));
    
    // Collect chunks
    const chunks: string[] = [];
    await waitForMessages(wsClient, (msg) => {
      if (msg.type === 'chunk') {
        chunks.push(msg.text);
      }
      return msg.type === 'message_complete';
    });
    
    const response = chunks.join('');
    expect(response).toContain('1');
    expect(response).toContain('5');
  });
  
  it('should persist and resume session', async () => {
    // Create conversation and send message
    const convId = await createAndSendMessage('Test session persistence');
    
    // Restart server
    await server.stop();
    server = await startTestServer();
    wsClient = await connectWebSocket(server.port);
    
    // Wait for init with loaded conversations
    const init = await waitForMessage(wsClient, 'init');
    const loadedConv = init.conversations.find((c) => c.id === convId);
    
    expect(loadedConv).toBeDefined();
    expect(loadedConv.messages.length).toBeGreaterThan(0);
  });
});
```

**Acceptance Criteria:**
- All integration tests pass
- Tests cover realistic user workflows
- Tests run reliably in CI
- Tests clean up resources properly
- Performance is acceptable (tests run <5min)

---

### 6.3 Contract Tests
**File**: `server/src/__tests__/contracts/pi-rpc.test.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Task 6.1

**Checklist:**
- [ ] Test pi RPC protocol compliance
- [ ] Verify all command types are supported
- [ ] Verify all event types are handled
- [ ] Test protocol version compatibility
- [ ] Test JSONL framing edge cases
- [ ] Test timeout handling
- [ ] Test request/response correlation
- [ ] Document protocol assumptions
- [ ] Create protocol regression tests

**Contract Test Example:**
```typescript
describe('Pi RPC Protocol Contract', () => {
  it('should comply with pi RPC protocol version 1.0', async () => {
    const client = new PiRpcClient();
    await client.start();
    
    // Send prompt command
    const command = {
      id: 'test-1',
      type: 'prompt',
      message: 'Hello',
    };
    
    client['stdin'].write(JSON.stringify(command) + '\n');
    
    // Expect response with matching ID
    const response = await waitForResponse(client, 'test-1');
    expect(response).toMatchObject({
      id: 'test-1',
      type: 'response',
      command: 'prompt',
      success: true,
    });
  });
  
  it('should handle all documented event types', async () => {
    const eventTypes = new Set([
      'agent_start',
      'message_update',
      'tool_execution_start',
      'message_end',
      'agent_end',
    ]);
    
    const receivedEvents = new Set();
    
    client.on('*', (event) => {
      receivedEvents.add(event.type);
    });
    
    await client.prompt('List files');
    await waitForCompletion(client);
    
    expect(receivedEvents).toContain('agent_start');
    expect(receivedEvents).toContain('agent_end');
  });
});
```

**Acceptance Criteria:**
- All RPC commands are tested
- All event types are verified
- Protocol edge cases are covered
- Version compatibility is documented
- Contract tests catch protocol changes

---

### 6.4 Performance Benchmarks
**File**: `server/src/__tests__/benchmarks/pi.bench.ts`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Tasks 6.1, 6.2

**Checklist:**
- [ ] Benchmark process spawn time
- [ ] Benchmark first token latency
- [ ] Benchmark streaming throughput
- [ ] Benchmark session load time
- [ ] Benchmark concurrent conversations
- [ ] Benchmark memory usage over time
- [ ] Benchmark CPU usage
- [ ] Create performance baseline
- [ ] Document performance targets
- [ ] Add performance regression detection

**Benchmark Structure:**
```typescript
describe('Pi Performance Benchmarks', () => {
  it('should spawn process within 3 seconds', async () => {
    const iterations = 10;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const client = new PiRpcClient();
      await client.start();
      const elapsed = Date.now() - start;
      times.push(elapsed);
      await client.stop();
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    expect(avg).toBeLessThan(3000);
    
    console.log(`Average spawn time: ${avg.toFixed(0)}ms`);
  });
  
  it('should maintain stable memory with long-running session', async () => {
    const client = new PiRpcClient();
    await client.start();
    
    const initialMem = process.memoryUsage().heapUsed;
    
    // Run 100 messages
    for (let i = 0; i < 100; i++) {
      await client.prompt(`Message ${i}`);
      await waitForCompletion(client);
    }
    
    // Force GC
    if (global.gc) global.gc();
    
    const finalMem = process.memoryUsage().heapUsed;
    const growth = finalMem - initialMem;
    const growthMB = growth / 1024 / 1024;
    
    expect(growthMB).toBeLessThan(50); // <50MB growth
    
    await client.stop();
  });
});
```

**Performance Targets:**
- Process spawn: <3s
- First token: <2s
- Streaming latency: <100ms
- Session load: <500ms
- Memory growth: <50MB per 100 messages
- CPU usage: <50% average

**Acceptance Criteria:**
- All benchmarks meet targets
- Benchmarks run reliably
- Performance regressions are detected
- Results are documented
- Bottlenecks are identified and addressed

---

### 6.5 Security Review
**File**: `docs/security/pi-security-review.md`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: Phases 1-5 complete

**Checklist:**
- [ ] Review process spawning security
- [ ] Validate input sanitization
- [ ] Check for command injection risks
- [ ] Review file path validation
- [ ] Audit session file access
- [ ] Check API key handling
- [ ] Review error message leakage
- [ ] Test with malicious inputs
- [ ] Document security considerations
- [ ] Create security best practices guide

**Security Review Areas:**

1. **Process Spawning**
   - [ ] Validate binary path
   - [ ] Sanitize command arguments
   - [ ] Prevent shell injection
   - [ ] Use allowlist for binaries

2. **File System Access**
   - [ ] Validate session file paths
   - [ ] Prevent directory traversal
   - [ ] Check file permissions
   - [ ] Limit file sizes

3. **Input Validation**
   - [ ] Sanitize user messages
   - [ ] Validate model IDs
   - [ ] Validate thinking levels
   - [ ] Prevent prototype pollution

4. **API Keys**
   - [ ] Never log API keys
   - [ ] Sanitize from error messages
   - [ ] Use environment variables
   - [ ] Validate key formats

5. **RPC Protocol**
   - [ ] Validate all messages
   - [ ] Prevent message injection
   - [ ] Rate limit commands
   - [ ] Timeout long operations

**Acceptance Criteria:**
- All security issues identified
- High/critical issues fixed
- Security documentation complete
- Security tests added
- Security best practices documented

---

### 6.6 Documentation Completion
**Files**: Various `docs/` files  
**Status**: ⬜ Not Started  
**Estimated Time**: 10 hours  
**Dependencies**: Phases 1-5 complete

**Checklist:**
- [ ] Write user guide (`docs/providers/pi.md`)
- [ ] Write developer guide (`docs/development/pi-integration.md`)
- [ ] Write API reference (`docs/api/pi-provider.md`)
- [ ] Write troubleshooting guide (`docs/troubleshooting/pi.md`)
- [ ] Update main README with pi information
- [ ] Create pi setup/installation guide
- [ ] Document configuration options
- [ ] Create example workflows
- [ ] Add architecture diagrams
- [ ] Record demo videos

**Documentation Structure:**

**User Guide** (`docs/providers/pi.md`):
- Introduction to pi provider
- Installation and setup
- Creating conversations
- Model selection
- Using thinking modes
- Extensions and skills
- Cost tracking
- Troubleshooting

**Developer Guide** (`docs/development/pi-integration.md`):
- Architecture overview
- RPC protocol details
- Event translation
- Session persistence
- Testing strategies
- Contributing guidelines

**API Reference** (`docs/api/pi-provider.md`):
- Provider interface
- RPC client API
- Event types
- Configuration schema
- Error codes

**Troubleshooting Guide** (`docs/troubleshooting/pi.md`):
- Common errors
- Process spawn failures
- RPC communication issues
- Session loading problems
- Performance issues
- Debug mode

**Acceptance Criteria:**
- All documentation is complete
- Documentation is accurate and up-to-date
- Examples work correctly
- Diagrams are clear
- Video demos are recorded
- Documentation is reviewed

---

### 6.7 Deployment Preparation
**File**: `deployment/pi-deployment.md`  
**Status**: ⬜ Not Started  
**Estimated Time**: 6 hours  
**Dependencies**: All previous tasks

**Checklist:**
- [ ] Create deployment checklist
- [ ] Document system requirements
- [ ] Create Docker support for pi
- [ ] Write deployment scripts
- [ ] Configure monitoring
- [ ] Set up error tracking
- [ ] Create rollback plan
- [ ] Test deployment in staging
- [ ] Document environment variables
- [ ] Create health check endpoints

**Deployment Checklist:**
1. **Prerequisites**
   - [ ] Node.js 18+ installed
   - [ ] Pi installed globally (`npm i -g @mariozechner/pi-coding-agent`)
   - [ ] API keys configured
   - [ ] Sufficient disk space for sessions

2. **Configuration**
   - [ ] Set PI_BINARY_PATH
   - [ ] Set PI_SESSION_DIR
   - [ ] Configure provider API keys
   - [ ] Set resource limits
   - [ ] Configure logging

3. **Verification**
   - [ ] Pi binary is accessible
   - [ ] RPC mode works
   - [ ] Sessions can be created
   - [ ] All providers work
   - [ ] WebSocket connections stable

4. **Monitoring**
   - [ ] Process health checks
   - [ ] Memory usage alerts
   - [ ] Error rate monitoring
   - [ ] Performance metrics
   - [ ] Cost tracking

**Docker Support:**
```dockerfile
FROM node:18

# Install pi
RUN npm install -g @mariozechner/pi-coding-agent

# Verify installation
RUN pi --version

# Copy app
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm install

# Start server
CMD ["npm", "start"]
```

**Acceptance Criteria:**
- Deployment process is documented
- Docker image works correctly
- Monitoring is configured
- Health checks are functional
- Rollback procedure is tested

---

### 6.8 Production Readiness Review
**File**: `docs/production-readiness.md`  
**Status**: ⬜ Not Started  
**Estimated Time**: 4 hours  
**Dependencies**: All previous tasks

**Checklist:**
- [ ] Review all phase completion criteria
- [ ] Verify test coverage targets met
- [ ] Confirm performance benchmarks passed
- [ ] Validate security review complete
- [ ] Check documentation completeness
- [ ] Test disaster recovery procedures
- [ ] Verify monitoring and alerting
- [ ] Conduct final code review
- [ ] Get stakeholder approval
- [ ] Create launch plan

**Production Readiness Checklist:**

**Code Quality:**
- [ ] Test coverage >80%
- [ ] No critical bugs
- [ ] No performance regressions
- [ ] Code review approved
- [ ] TypeScript strict mode
- [ ] Linting passes

**Functionality:**
- [ ] All features working
- [ ] Edge cases handled
- [ ] Error handling robust
- [ ] User workflows tested
- [ ] Integration tests pass

**Operations:**
- [ ] Monitoring configured
- [ ] Logging comprehensive
- [ ] Alerts set up
- [ ] Runbooks created
- [ ] On-call trained

**Documentation:**
- [ ] User guide complete
- [ ] API docs complete
- [ ] Troubleshooting guide complete
- [ ] Deployment docs complete
- [ ] Architecture documented

**Security:**
- [ ] Security review passed
- [ ] Vulnerabilities addressed
- [ ] API keys secured
- [ ] Input validation complete
- [ ] Rate limiting configured

**Acceptance Criteria:**
- All checklist items completed
- Sign-off from tech lead
- Sign-off from product owner
- Launch plan approved
- Rollback tested

---

## Phase Completion Criteria

- [ ] All 8 tasks completed
- [ ] Test coverage >80%
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Security review passed
- [ ] Documentation complete
- [ ] Deployment ready
- [ ] Production readiness confirmed
- [ ] Launch plan approved

## Blockers

None expected at this stage.

## Notes

- Schedule final review meeting with all stakeholders
- Prepare demo for launch announcement
- Create user migration guide if needed
- Plan phased rollout strategy

## Launch

Upon completion, pi provider integration is ready for production deployment! 🚀

**Post-Launch:**
- Monitor error rates and performance
- Gather user feedback
- Iterate on features
- Plan future enhancements
