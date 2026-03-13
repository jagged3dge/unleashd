import { describe, it, expect, beforeEach, vi } from 'vitest';
import { discoverPiSessions, extractSessionMeta } from '../pi-discovery';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Pi Session Discovery', () => {
  const testDir = '/tmp/pi-test-sessions';

  beforeEach(() => {
    // Clean and create test directory
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  describe('RED: discoverPiSessions', () => {
    it('should find session files', async () => {
      writeFileSync(join(testDir, 'session1.jsonl'), '{"role":"user","content":"test","timestamp":1}');
      
      const sessions = await discoverPiSessions(testDir);
      expect(sessions).toHaveLength(1);
    });

    it('should extract session IDs', async () => {
      writeFileSync(join(testDir, 'test-session.jsonl'), '{"role":"user","content":"test","timestamp":1}');
      
      const sessions = await discoverPiSessions(testDir);
      expect(sessions[0].sessionId).toBe('test-session');
    });

    it('should sort by last modified', async () => {
      writeFileSync(join(testDir, 'old.jsonl'), '{"role":"user","content":"test","timestamp":1}');
      await new Promise(r => setTimeout(r, 10));
      writeFileSync(join(testDir, 'new.jsonl'), '{"role":"user","content":"test","timestamp":1}');
      
      const sessions = await discoverPiSessions(testDir);
      expect(sessions[0].sessionId).toBe('new');
    });

    it('should handle empty directory', async () => {
      const sessions = await discoverPiSessions(testDir);
      expect(sessions).toHaveLength(0);
    });
  });

  describe('RED: extractSessionMeta', () => {
    it('should extract metadata', async () => {
      const path = join(testDir, 'meta-test.jsonl');
      writeFileSync(path, '{"role":"user","content":"test","timestamp":1}');
      
      const meta = await extractSessionMeta(path);
      expect(meta).toBeDefined();
      expect(meta?.sessionId).toBe('meta-test');
    });

    it('should return null for non-existent file', async () => {
      const meta = await extractSessionMeta(join(testDir, 'nope.jsonl'));
      expect(meta).toBeNull();
    });
  });
});
