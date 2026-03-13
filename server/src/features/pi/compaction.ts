export async function compactSession(sessionId: string): Promise<void> {
  // Integration point: RPC compact command
}

export async function onAutoCompaction(callback: () => void): Promise<void> {
  // Listen for auto_compaction_start/end events
}
