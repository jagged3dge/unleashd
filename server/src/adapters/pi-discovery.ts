/**
 * Pi Session Discovery
 * 
 * Discover pi sessions in the sessions directory.
 */

import { readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';

export interface PiSessionMeta {
  sessionId: string;
  path: string;
  createdAt: Date;
  lastModified: Date;
}

/**
 * Discover all pi sessions in directory
 */
export async function discoverPiSessions(sessionDir?: string): Promise<PiSessionMeta[]> {
  const dir = sessionDir || join(homedir(), '.pi/agent/sessions');
  
  try {
    const files = await readdir(dir, { withFileTypes: true });
    const sessions: PiSessionMeta[] = [];
    
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.jsonl')) {
        const filePath = join(dir, file.name);
        const meta = await extractSessionMeta(filePath);
        if (meta) sessions.push(meta);
      }
    }
    
    return sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch {
    return [];
  }
}

/**
 * Extract metadata from session file
 */
export async function extractSessionMeta(filePath: string): Promise<PiSessionMeta | null> {
  try {
    const stats = await stat(filePath);
    return {
      sessionId: basename(filePath, '.jsonl'),
      path: filePath,
      createdAt: stats.birthtime,
      lastModified: stats.mtime,
    };
  } catch {
    return null;
  }
}
