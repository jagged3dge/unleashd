import React from 'react';

interface PiMessageProps {
  content: string;
  thinking?: string[];
  cost?: string;
}

export function PiMessage({ content, thinking, cost }: PiMessageProps) {
  return (
    <div className="pi-message">
      {thinking?.map((t, i) => (
        <div key={i} className="thinking">{t}</div>
      ))}
      <div className="content">{content}</div>
      {cost && <div className="cost">{cost}</div>}
    </div>
  );
}
