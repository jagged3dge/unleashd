export async function discoverSkills(): Promise<string[]> {
  // Integration point: RPC get_commands with source='skill'
  return [];
}

export async function invokeSkill(name: string, args: any): Promise<void> {
  // Integration point: Send /skill:name command
}
