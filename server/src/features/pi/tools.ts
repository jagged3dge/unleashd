export interface ToolConfig {
  name: string;
  description: string;
  schema: any;
}

export async function registerTools(tools: ToolConfig[]): Promise<void> {
  // Integration point: Start RPC with --tools flag
}
