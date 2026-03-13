/**
 * Pi Thinking Block Utilities
 *
 * Extract and manage thinking blocks from pi assistant messages.
 */

import type { PiContentBlock } from '@unleashd/shared';

/**
 * Result of thinking extraction
 */
export interface ThinkingExtraction {
  textContent: string;
  thinkingBlocks: string[];
  hasThinking: boolean;
}

/**
 * Extract thinking blocks and text content from pi content array
 */
export function extractThinking(content: any[]): ThinkingExtraction {
  const textParts: string[] = [];
  const thinkingBlocks: string[] = [];

  for (const block of content) {
    if (block.type === 'text') {
      textParts.push(block.text);
    } else if (block.type === 'thinking') {
      thinkingBlocks.push(block.thinking);
    }
  }

  return {
    textContent: textParts.join('\n'),
    thinkingBlocks,
    hasThinking: thinkingBlocks.length > 0,
  };
}

/**
 * Check if content array has thinking blocks
 */
export function hasThinking(content: any[]): boolean {
  return content.some(block => block.type === 'thinking');
}

/**
 * Filter out thinking blocks from content array
 */
export function filterThinking(content: any[]): any[] {
  return content.filter(block => block.type !== 'thinking');
}
