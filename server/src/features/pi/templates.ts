export async function discoverTemplates(): Promise<string[]> {
  // Integration point: RPC get_commands with source='prompt'
  return [];
}

export async function expandTemplate(name: string, vars: Record<string, string>): Promise<string> {
  // Let pi handle variable substitution
  return name;
}
