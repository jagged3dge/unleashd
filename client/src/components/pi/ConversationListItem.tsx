import React from 'react';

interface ConversationListItemProps {
  id: string;
  preview: string;
  cost?: string;
}

export function ConversationListItem({ id, preview, cost }: ConversationListItemProps) {
  return (
    <div className="conversation-item">
      <span>{preview}</span>
      {cost && <span className="cost">{cost}</span>}
    </div>
  );
}
