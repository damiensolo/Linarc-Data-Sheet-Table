import React, { useState, useRef, useEffect } from 'react';
import { V3Column, V3ColumnType } from '../types';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '../../../common/Icons';
import { Resizer } from '../../../common/ui/Resizer';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../../constants/spreadsheetLayout';

export const ROW_NUM_WIDTH = SPREADSHEET_INDEX_COLUMN_WIDTH;
export const ACTIONS_WIDTH = 80;

interface V3HeaderProps {
  columns: V3Column[];
  focusedColId: string | null;
  selectedColId: string | null;
  resizingColumnId: string | null;
  sort: { colId: string; dir: 'asc' | 'desc' } | null;
  isScrolled: boolean;
  isAtEnd: boolean;
  isVerticalScrolled: boolean;
  fontSize: number;
  displayDensity: 'compact' | 'standard' | 'comfortable';
  onColumnHeaderClick: (colId: string) => void;
  onRenameColumn: (colId: string, newLabel: string) => void;
  onResize: (colId: string) => (e: React.MouseEvent) => void;
  onColumnMove: (fromId: string, toId: string, pos: 'left' | 'right') => void;
  onAddColumn: () => void;
  onContextMenu: (e: React.MouseEvent, colId: string) => void;
  cutColId: string | null;
  isAllSelected: boolean;
  onToggleAll: () => void;
  checkboxRef: React.RefObject<HTMLInputElement>;
}

const HEADER_HEIGHT: Record<string, string> = {
  compact: 'h-8', standard: 'h-10', comfortable: 'h-12',
};

// Inline rename input for a column header
const RenameInput: React.FC<{
  initialValue: string;
  onCommit: (val: string) => void;
  onCancel: () => void;
}> = ({ initialValue, onCommit, onCancel }) => {
  const [val, setVal] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = () => { if (val.trim()) onCommit(val.trim()); else onCancel(); };

  return (
    <input
      ref={ref}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        e.stopPropagation();
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      className="w-full bg-white border border-blue-500 rounded px-1 py-0 text-xs font-semibold text-gray-900 outline-none shadow-sm"
      style={{ minWidth: 0 }}
    />
  );
};

const V3Header: React.FC<V3HeaderProps> = ({
  columns, focusedColId, selectedColId, resizingColumnId, sort,
  isScrolled, isAtEnd, isVerticalScrolled, fontSize, displayDensity,
  onColumnHeaderClick, onRenameColumn, onResize, onColumnMove,
  onAddColumn, onContextMenu, cutColId, isAllSelected, onToggleAll, checkboxRef,
}) => {
  const heightClass = HEADER_HEIGHT[displayDensity] ?? 'h-10';
  const [dropIndicator, setDropIndicator] = useState<{ id: string; pos: 'left' | 'right' } | null>(null);
  const [hoveredColId,  setHoveredColId]  = useState<string | null>(null);
  const [renamingColId, setRenamingColId] = useState<string | null>(null);

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
    <thead className={`bg-gray-50 text-gray-700 font-semibold sticky top-0 z-40 transition-shadow duration-200
      ${isVerticalScrolled ? 'shadow-[0_4px_6px_-2px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)]' : ''}`}
    >
      <tr className={heightClass}>
        {/* Row number / checkbox col */}
        <th
          className={`sticky left-0 z-[51] border-r border-gray-200 bg-gray-50 text-center p-0 transition-all
            ${isScrolled ? 'after:content-[""] after:absolute after:top-0 after:bottom-0 after:-right-[6px] after:w-[6px] after:bg-gradient-to-r after:from-black/[0.12] after:to-transparent after:pointer-events-none' : ''}`}
          style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, maxWidth: ROW_NUM_WIDTH, fontSize, boxShadow: 'inset 0 -1px 0 #e5e7eb' }}
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
        {columns.map((col) => {
          const isColSelected = selectedColId === col.id;
          const isFocused     = focusedColId === col.id && !isColSelected;
          const isHovered     = hoveredColId === col.id;
          const isRenaming    = renamingColId === col.id;
          const showChevron   = (isHovered || isColSelected) && !isRenaming;

          return (
            <th
              key={col.id}
              className={`border-r border-gray-200 px-2 whitespace-nowrap uppercase font-semibold relative group cursor-pointer select-none
                ${col.align === 'right' ? 'text-right' : 'text-left'}
                ${isColSelected
                  ? 'bg-blue-200 text-blue-900'
                  : isFocused
                    ? 'bg-blue-100 text-blue-800'
                    : col.type === 'formula'
                      ? 'bg-amber-50/60 text-gray-700'
                      : 'bg-gray-50 text-gray-700'
                }`}
              style={{
                width: col.width, minWidth: col.width, fontSize,
                boxShadow: isColSelected
                  ? 'inset 0 -1px 0 #e5e7eb, inset 0 2px 0 0 #2563eb, inset 2px 0 0 0 #2563eb, inset -2px 0 0 0 #2563eb'
                  : 'inset 0 -1px 0 #e5e7eb',
              }}
              onClick={() => { if (!isRenaming) onColumnHeaderClick(col.id); }}
              onDoubleClick={() => { if (!isRenaming) setRenamingColId(col.id); }}
              onContextMenu={(e) => { e.preventDefault(); if (!isRenaming) onContextMenu(e, col.id); }}
              onMouseEnter={() => setHoveredColId(col.id)}
              onMouseLeave={() => setHoveredColId(null)}
              draggable={!isRenaming}
              onDragStart={(e) => handleDragStart(e, col.id)}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragLeave={() => setDropIndicator(null)}
            >
              {dropIndicator?.id === col.id && (
                <div className={`absolute top-0 h-full w-0.5 bg-blue-500 z-20 ${dropIndicator.pos === 'left' ? 'left-0' : 'right-0'}`} />
              )}
              {/* Cut column dashed border (top/left/right only — bottom continues through body cells) */}
              {cutColId === col.id && (
                <div className="absolute inset-0 border-l-2 border-r-2 border-t-2 border-dashed border-blue-600 pointer-events-none z-20" />
              )}

              <div className={`flex items-center h-full w-full gap-1 overflow-hidden ${showChevron ? 'pr-5' : ''}`}>
                {isRenaming ? (
                  <RenameInput
                    initialValue={col.label}
                    onCommit={(val) => { onRenameColumn(col.id, val); setRenamingColId(null); }}
                    onCancel={() => setRenamingColId(null)}
                  />
                ) : (
                  <>
                    <span className="truncate">{col.label}</span>
                    {sort?.colId === col.id && (
                      sort.dir === 'asc'
                        ? <ArrowUpIcon className="w-3 h-3 text-blue-500 shrink-0" />
                        : <ArrowDownIcon className="w-3 h-3 text-blue-500 shrink-0" />
                    )}
                  </>
                )}
              </div>

              {/* Chevron dropdown button — shown on hover or when column is selected */}
              {showChevron && (
                <button
                  className={`absolute right-0 top-0 h-full px-1.5 flex items-center justify-center z-10 transition-colors
                    ${isColSelected ? 'text-blue-700 hover:bg-blue-300' : 'text-gray-500 hover:bg-gray-200'}`}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const th = (e.currentTarget as HTMLElement).closest('th')!;
                    const rect = th.getBoundingClientRect();
                    const syntheticEvent = {
                      ...e,
                      clientX: rect.left,
                      clientY: rect.bottom,
                      preventDefault: () => {},
                    } as unknown as React.MouseEvent;
                    onContextMenu(syntheticEvent, col.id);
                  }}
                >
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
              )}

              <Resizer onMouseDown={onResize(col.id)} isActive={resizingColumnId === col.id} />
            </th>
          );
        })}

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
          className={`sticky right-0 z-[51] w-20 border-l border-gray-200 bg-gray-50 text-center uppercase font-semibold transition-all
            ${!isAtEnd ? 'before:content-[""] before:absolute before:top-0 before:bottom-0 before:-left-[6px] before:w-[6px] before:bg-gradient-to-l before:from-black/[0.12] before:to-transparent before:pointer-events-none' : ''}`}
          style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH, fontSize, boxShadow: 'inset 0 -1px 0 #e5e7eb' }}
        >
          <div className="flex items-center justify-center h-full w-full text-gray-700">
            Actions
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default V3Header;
