export function calculatePiCost(usage: any): number {
  return usage.cost?.total || 0;
}

export function aggregateCost(costs: number[]): number {
  return costs.reduce((sum, cost) => sum + cost, 0);
}
