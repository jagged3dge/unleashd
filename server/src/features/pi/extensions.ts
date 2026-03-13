export async function discoverExtensions(): Promise<string[]> {
  // Integration point: RPC get_commands with source='extension'
  return [];
}

export async function invokeExtension(name: string, args: any): Promise<void> {
  // Integration point: Send prompt with /command syntax
}
