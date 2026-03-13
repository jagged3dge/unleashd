// No import needed

interface CostDisplayProps {
  totalCost: string;
}

export function CostDisplay({ totalCost }: CostDisplayProps) {
  return <div className="cost-display">Total: {totalCost}</div>;
}
