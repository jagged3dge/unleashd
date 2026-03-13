import React, { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
  index: number;
}

export function ThinkingBlock({ thinking, index }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="thinking-block">
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? '▼' : '▶'} Thinking {index + 1}
      </button>
      {expanded && <div className="thinking-content">{thinking}</div>}
    </div>
  );
}
