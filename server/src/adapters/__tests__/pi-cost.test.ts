import { describe, it, expect } from 'vitest';
import { calculatePiCost, aggregateCost } from '../pi-cost';

describe('Pi Cost Tracking', () => {
  it('should calculate cost from usage', () => {
    const usage = {
      input: 1000,
      output: 500,
      cost: { input: 0.003, output: 0.0075, total: 0.0105 }
    };
    const cost = calculatePiCost(usage);
    expect(cost).toBe(0.0105);
  });

  it('should aggregate costs', () => {
    const costs = [0.01, 0.02, 0.03];
    const total = aggregateCost(costs);
    expect(total).toBe(0.06);
  });
});
