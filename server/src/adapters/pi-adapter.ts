/**
 * Pi Disk Adapter
 *
 * Loads pi session files from disk and converts them to unleashd Conversation format.
 *
 * Single Responsibility: Pi session file loading only.
 */

import { readFile } from 'fs/promises';
import { basename } from 'path';
import type {
  PiSessionEntry,
  PiUserMessage,
  PiAssistantMessage,
  PiToolResultMessage,
} from '@unleashd/shared';
import {
  PiSessionEntrySchema,
  isPiUserMessage,
  isPiAssistantMessage,
  isPiToolResult,
} from '@unleashd/shared';

/**
 * Unleashd conversation format (simplified for adapter)
 */
export interface Conversation {
  id: string;
  sessionId: string;
  provider: 'pi';
  model?: string;
  messages: Message[];
  totalCost: number;
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message format
 */
export interface Message {
  role: 'user' | 'assistant' | 'toolResult';
  content: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Disk adapter for pi sessions
 */
export class PiDiskAdapter {
  readonly provider = 'pi' as const;

  /**
   * Load a session from a JSONL file
   */
  async loadSession(sessionPath: string): Promise<Conversation | null> {
    try {
      const content = await readFile(sessionPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      // Extract session ID from filename
      const sessionId = basename(sessionPath, '.jsonl');

      // Parse all entries
      const entries: PiSessionEntry[] = [];
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const result = PiSessionEntrySchema.safeParse(json);
          if (result.success) {
            entries.push(result.data);
          } else {
            console.warn(`[PiDiskAdapter] Invalid entry in ${sessionId}:`, result.error);
          }
        } catch (error) {
          console.warn(`[PiDiskAdapter] Failed to parse line in ${sessionId}:`, error);
        }
      }

      if (entries.length === 0) {
        return null;
      }

      // Convert to unleashd message format
      const messages: Message[] = [];
      let totalCost = 0;
      let totalTokens = 0;
      let model: string | undefined;

      for (const entry of entries) {
        if (isPiUserMessage(entry)) {
          messages.push(this.convertUserMessage(entry));
        } else if (isPiAssistantMessage(entry)) {
          const msg = this.convertAssistantMessage(entry);
          messages.push(msg);

          // Track model
          if (!model && entry.model) {
            model = `${entry.provider}/${entry.model}`;
          }

          // Track usage
          if (entry.usage) {
            totalTokens += entry.usage.input + entry.usage.output;
            if (entry.usage.cost) {
              totalCost += entry.usage.cost.total;
            }
          }
        } else if (isPiToolResult(entry)) {
          messages.push(this.convertToolResult(entry));
        }
      }

      // Determine timestamps
      const firstTimestamp = entries[0]?.timestamp || Date.now();
      const lastTimestamp = entries[entries.length - 1]?.timestamp || Date.now();

      return {
        id: sessionId,
        sessionId,
        provider: 'pi',
        model,
        messages,
        totalCost,
        totalTokens,
        createdAt: new Date(firstTimestamp),
        updatedAt: new Date(lastTimestamp),
      };
    } catch (error) {
      // File not found or other I/O error
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      console.error(`[PiDiskAdapter] Error loading session ${sessionPath}:`, error);
      return null;
    }
  }

  /**
   * Convert pi user message to unleashd format
   */
  private convertUserMessage(entry: PiUserMessage): Message {
    // Extract text content
    let content: string;
    if (typeof entry.content === 'string') {
      content = entry.content;
    } else {
      // Array of content blocks
      const textBlocks = entry.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text);
      content = textBlocks.join('\n');
    }

    return {
      role: 'user',
      content,
      timestamp: entry.timestamp,
    };
  }

  /**
   * Convert pi assistant message to unleashd format
   */
  private convertAssistantMessage(entry: PiAssistantMessage): Message {
    // Extract text content (excluding thinking blocks)
    const textBlocks = entry.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text);

    const content = textBlocks.join('\n');

    return {
      role: 'assistant',
      content,
      timestamp: entry.timestamp,
      model: entry.model,
      usage: entry.usage,
    };
  }

  /**
   * Convert pi tool result to unleashd format
   */
  private convertToolResult(entry: PiToolResultMessage): Message {
    // Extract text content from result
    const textBlocks = entry.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text);

    const content = textBlocks.join('\n');

    return {
      role: 'toolResult',
      content,
      timestamp: entry.timestamp,
      toolName: entry.toolName,
      isError: entry.isError,
    };
  }
}
