// No import needed

interface SettingsPanelProps {
  showThinking: boolean;
  onToggleThinking: (show: boolean) => void;
}

export function SettingsPanel({ showThinking, onToggleThinking }: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      <label>
        <input 
          type="checkbox" 
          checked={showThinking} 
          onChange={(e) => onToggleThinking(e.target.checked)} 
        />
        Show Thinking
      </label>
    </div>
  );
}
