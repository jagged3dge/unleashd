export async function forkSession(sessionId: string, entryId: string): Promise<string> {
  // Integration point: RPC fork command
  return 'forked-session-id';
}

export interface ForkTree {
  parent?: string;
  children: string[];
}

export async function getForkTree(sessionId: string): Promise<ForkTree> {
  return { children: [] };
}
