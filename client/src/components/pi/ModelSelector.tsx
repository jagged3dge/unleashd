import React from 'react';

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="sonnet">Claude Sonnet</option>
      <option value="opus">Claude Opus</option>
      <option value="haiku">Claude Haiku</option>
    </select>
  );
}
