import React from 'react';
import { TableIcon, BoardIcon, GanttIcon, LookaheadIcon } from '../common/Icons';

export type ViewMode = 'table' | 'board' | 'gantt' | 'lookahead';

interface ViewModeSwitcherProps {
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const modes: { id: ViewMode; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'table', label: 'Table', icon: TableIcon },
  { id: 'board', label: 'Board', icon: BoardIcon },
  { id: 'gantt', label: 'Gantt', icon: GanttIcon },
  { id: 'lookahead', label: 'Lookahead', icon: LookaheadIcon },
];

const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({ activeMode, onModeChange }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {modes.map(({ id, label, icon: Icon }) => {
        const isActive = activeMode === id;
        return (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isActive ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-label={`Switch to ${label} view`}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewModeSwitcher;