import React from 'react';

interface TokenUsageProps {
  totalTokens: number;
}

export function TokenUsage({ totalTokens }: TokenUsageProps) {
  return <div className="token-usage">{totalTokens.toLocaleString()} tokens</div>;
}
