import React, { useState } from 'react';
import { V3Column, V3ColumnType } from '../types';
import { PlusIcon, SortIcon, ArrowUpIcon, ArrowDownIcon } from '../../../common/Icons';
import { Resizer } from '../../../common/ui/Resizer';

// ─── Row number gutter width ────────────────────────────────────────────────
export const ROW_NUM_WIDTH = 56;
export const ACTIONS_WIDTH = 60;

// ─── Column type badge ──────────────────────────────────────────────────────
const TYPE_BADGE: Record<V3ColumnType, string> = {
  text:     'Aa',
  number:   '#',
  currency: '$',
  date:     '📅',
  formula:  '=',
  select:   '▾',
  checkbox: '☑',
};

interface V3HeaderProps {
  columns: V3Column[];
  focusedColId: string | null;
  resizingColumnId: string | null;
  sort: { colId: string; dir: 'asc' | 'desc' } | null;
  isScrolled: boolean;
  isAtEnd: boolean;
  isVerticalScrolled: boolean;
  fontSize: number;
  onSort: (colId: string) => void;
  onResize: (colId: string) => (e: React.MouseEvent) => void;
  onColumnMove: (fromId: string, toId: string, pos: 'left' | 'right') => void;
  onAddColumn: () => void;
  onContextMenu: (e: React.MouseEvent, colId: string) => void;
  isAllSelected: boolean;
  onToggleAll: () => void;
  checkboxRef: React.RefObject<HTMLInputElement>;
}

const V3Header: React.FC<V3HeaderProps> = ({
  columns, focusedColId, resizingColumnId, sort, isScrolled, isAtEnd,
  isVerticalScrolled, fontSize, onSort, onResize, onColumnMove,
  onAddColumn, onContextMenu, isAllSelected, onToggleAll, checkboxRef,
}) => {
  const [dropIndicator, setDropIndicator] = useState<{ id: string; pos: 'left' | 'right' } | null>(null);

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    e.dataTransfer.setData('text/plain', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropIndicator({ id: colId, pos: e.clientX > rect.left + rect.width / 2 ? 'right' : 'left' });
  };

  const handleDrop = (e: React.DragEvent, toId: string) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain');
    if (fromId && fromId !== toId && dropIndicator) onColumnMove(fromId, toId, dropIndicator.pos);
    setDropIndicator(null);
  };

  return (
    <thead className={`sticky top-0 z-40 bg-gray-50 font-semibold text-gray-600 transition-shadow duration-200
      ${isVerticalScrolled ? 'shadow-[0_4px_6px_-2px_rgba(0,0,0,0.1)]' : ''}`}
    >
      <tr>
        {/* Row number / checkbox col */}
        <th
          className={`sticky left-0 z-[51] border-r border-gray-200 bg-gray-50 text-center p-0 transition-all
            ${isScrolled ? 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]' : ''}`}
          style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, maxWidth: ROW_NUM_WIDTH, boxShadow: 'inset 0 -1px 0 #e5e7eb', fontSize }}
        >
          <div className="flex items-center justify-center h-full">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onToggleAll}
              ref={checkboxRef}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
          </div>
        </th>

        {/* Data columns */}
        {columns.map((col) => (
          <th
            key={col.id}
            className={`border-r border-gray-200 px-2 whitespace-nowrap uppercase font-semibold relative group cursor-pointer
              ${col.align === 'right' ? 'text-right' : 'text-left'}
              ${focusedColId === col.id ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-600'}
              ${col.type === 'formula' ? 'bg-amber-50/60' : ''}`}
            style={{ width: col.width, minWidth: col.width, fontSize, boxShadow: 'inset 0 -1px 0 #e5e7eb' }}
            onClick={() => onSort(col.id)}
            onContextMenu={(e) => onContextMenu(e, col.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, col.id)}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragLeave={() => setDropIndicator(null)}
          >
            {/* Drop indicator */}
            {dropIndicator?.id === col.id && (
              <div className={`absolute top-0 h-full w-1 bg-blue-500 z-20 rounded-full ${dropIndicator.pos === 'left' ? 'left-0' : 'right-0'}`} />
            )}

            <div className={`flex items-center h-full w-full gap-1 overflow-hidden ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
              {/* Type badge */}
              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 rounded px-1 py-0.5 leading-none shrink-0 select-none">
                {TYPE_BADGE[col.type]}
              </span>
              <span className="truncate">{col.label}</span>
              {sort?.colId === col.id ? (
                sort.dir === 'asc'
                  ? <ArrowUpIcon className="w-3 h-3 text-blue-500 shrink-0" />
                  : <ArrowDownIcon className="w-3 h-3 text-blue-500 shrink-0" />
              ) : (
                <SortIcon className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              )}
            </div>

            <Resizer onMouseDown={onResize(col.id)} isActive={resizingColumnId === col.id} />
          </th>
        ))}

        {/* Add column button */}
        <th
          className="bg-gray-50 border-r border-gray-200 px-2 cursor-pointer hover:bg-gray-100 transition-colors group"
          style={{ width: 44, minWidth: 44, boxShadow: 'inset 0 -1px 0 #e5e7eb' }}
          onClick={onAddColumn}
          title="Add column"
        >
          <div className="flex items-center justify-center h-full">
            <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </th>

        {/* Sticky right Actions col */}
        <th
          className={`sticky right-0 z-[51] border-l border-gray-200 bg-gray-50 text-center uppercase font-semibold transition-all
            ${!isAtEnd ? 'shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.15)]' : ''}`}
          style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH, fontSize, boxShadow: 'inset 0 -1px 0 #e5e7eb' }}
        >
          <span className="text-gray-500">Actions</span>
        </th>
      </tr>
    </thead>
  );
};

export default V3Header;
