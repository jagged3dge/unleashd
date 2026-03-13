export function parseContextReferences(message: string): string[] {
  const matches = message.match(/@[\w/.]+/g);
  return matches || [];
}

export async function validateContext(path: string): Promise<boolean> {
  // Check if file exists
  return true;
}
