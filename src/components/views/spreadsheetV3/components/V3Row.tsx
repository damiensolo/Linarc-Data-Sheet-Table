import React, { useState, useRef, useEffect, useMemo } from 'react';
import { V3Row, V3Column, V3CellStyle, CellValue, evaluateFormula } from '../types';
import { ChevronRightIcon, ChevronDownIcon } from '../../../common/Icons';
import { ROW_NUM_WIDTH, ACTIONS_WIDTH } from './V3Header';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (v: CellValue) => {
  const n = Number(v);
  if (isNaN(n)) return '';
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${abs})` : abs;
};

const STATUS_COLORS: Record<string, string> = {
  'Completed':   'bg-green-100 text-green-700',
  'Done':        'bg-green-100 text-green-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Active':      'bg-blue-100 text-blue-700',
  'In Review':   'bg-purple-100 text-purple-700',
  'Not Started': 'bg-gray-100 text-gray-600',
  'Planned':     'bg-gray-100 text-gray-600',
  'Blocked':     'bg-red-100 text-red-700',
  'Urgent':      'bg-red-100 text-red-700',
  'High':        'bg-orange-100 text-orange-700',
  'Medium':      'bg-yellow-100 text-yellow-700',
  'Low':         'bg-green-100 text-green-700',
};

interface V3RowProps {
  row: V3Row;
  rowIndex: number;
  level: number;
  columns: V3Column[];
  isSelected: boolean;
  isExpanded: boolean;
  isSummary?: boolean;
  focusedCell: { rowId: string; colId: string } | null;
  editingCell: { rowId: string; colId: string; initial?: string; cursorAtEnd?: boolean; mode?: 'append' } | null;
  inRangeSelection: boolean;
  rangeColIds: Set<string>;
  selectedColId: string | null;
  isScrolled: boolean;
  isAtEnd: boolean;
  fontSize: number;
  displayDensity: 'compact' | 'standard' | 'comfortable';
  fillAnchorCell: { rowId: string; colId: string } | null;
  fillRangeRowIds: Set<string>;
  cutColId: string | null;
  cutCellColIds: Set<string>;
  liveEdit: { rowId: string; colId: string; value: string } | null;
  activeEditSource: 'cell' | 'formula' | null;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onLiveEditChange: (rowId: string, colId: string, value: string) => void;
  onCellClick: (rowId: string, colId: string, e: React.MouseEvent) => void;
  onCellDoubleClick: (rowId: string, colId: string) => void;
  onStopEdit: () => void;
  onUpdateCell: (rowId: string, colId: string, value: CellValue, direction?: 'up' | 'down' | 'left' | 'right') => void;
  onContextMenu: (e: React.MouseEvent, type: 'row' | 'cell', rowId: string, colId?: string) => void;
  onCellMouseDown: (rowId: string, colId: string, e: React.MouseEvent) => void;
  onCellMouseEnter: (rowId: string, colId: string) => void;
  onFillHandleMouseDown: (rowId: string, colId: string) => void;
  onRowMouseEnter: (rowId: string) => void;
}

const HEIGHT: Record<string, string> = { compact: 'h-7', standard: 'h-9', comfortable: 'h-11' };

const V3RowComponent: React.FC<V3RowProps> = ({
  row, rowIndex, level, columns, isSelected, isExpanded, isSummary,
  focusedCell, editingCell, inRangeSelection, rangeColIds, selectedColId,
  isScrolled, isAtEnd, fontSize, displayDensity,
  fillAnchorCell, fillRangeRowIds, cutColId, cutCellColIds, liveEdit, activeEditSource,
  onToggleSelect, onToggleExpand, onCellClick, onCellDoubleClick,
  onLiveEditChange, onStopEdit, onUpdateCell, onContextMenu, onCellMouseDown, onCellMouseEnter,
  onFillHandleMouseDown, onRowMouseEnter,
}) => {
  const hClass = HEIGHT[displayDensity] ?? 'h-7';
  const hasChildren = !!row.children?.length;
  const isGroup = !!row.isGroup;
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const ignoreCellClick = useRef(false);
  const lastMouseDownRef = useRef<{ time: number; rowId: string; colId: string } | null>(null);
  const isFillTarget = fillRangeRowIds.has(row.id);
  // Prevents double-commit: set to true when commit fires (keydown path), or when Escape cancels.
  // onBlur checks this ref so it won't commit a second time.
  const skipNextCommitRef = useRef(false);

  useEffect(() => {
    if (editingCell?.rowId === row.id) {
      skipNextCommitRef.current = false;
      const raw = row.cells[editingCell.colId];
      setEditValue(editingCell.initial !== undefined ? editingCell.initial : raw === null || raw === undefined ? '' : String(raw));
    }
  }, [editingCell]);

  useEffect(() => {
    if (activeEditSource !== 'cell') return;
    if (editingCell?.rowId === row.id && inputRef.current) {
      const input = inputRef.current;
      input.focus();
      
      if (editingCell.initial !== undefined) {
        // Typing: cursor at end (already handled by value update)
      } else if (editingCell.mode === 'append') {
        // F2 or Double-click: cursor at end
        const len = input.value.length;
        input.setSelectionRange(len, len);
      } else {
        // Default: select all
        input.select();
      }
    }
  }, [editingCell, activeEditSource]);

  const commitEdit = (colId: string, dir?: 'up' | 'down' | 'left' | 'right') => {
    if (skipNextCommitRef.current) return;
    skipNextCommitRef.current = true;
    const col = columns.find(c => c.id === colId);
    const currentEditValue = liveEdit?.rowId === row.id && liveEdit.colId === colId ? liveEdit.value : editValue;
    let val: CellValue = currentEditValue;
    if (col?.type === 'number' || col?.type === 'currency') {
      val = currentEditValue === '' ? null : parseFloat(currentEditValue.replace(/,/g, '')) || 0;
    } else if (col?.type === 'checkbox') {
      val = currentEditValue === 'true';
    }
    onUpdateCell(row.id, colId, val, dir);
    onStopEdit();
  };

  const editMountTime = useRef(Date.now());
  useEffect(() => {
    if (editingCell?.rowId === row.id) {
      editMountTime.current = Date.now();
    }
  }, [editingCell]);

  const handleKeyDown = (e: React.KeyboardEvent, colId: string) => {
    e.stopPropagation();
    switch (e.key) {
      case 'Enter':
        // Prevent auto-repeat Enter from instantly closing the edit session it just opened
        if (e.repeat || Date.now() - editMountTime.current < 250) return;
        e.preventDefault(); 
        commitEdit(colId, e.shiftKey ? 'up' : 'down'); 
        break;
      case 'Tab':      e.preventDefault(); commitEdit(colId, e.shiftKey ? 'left' : 'right'); break;
      case 'Escape':   e.preventDefault(); skipNextCommitRef.current = true; onStopEdit(); break;
      case 'ArrowUp':    e.preventDefault(); commitEdit(colId, 'up'); break;
      case 'ArrowDown':  e.preventDefault(); commitEdit(colId, 'down'); break;
    }
  };

  // Track double click timing to prevent onClick from cancelling the edit
  const lastClickRef = useRef<{ time: number; rowId: string; colId: string }>({ time: 0, rowId: '', colId: '' });

  const handleClick = (rowId: string, colId: string, e: React.MouseEvent) => {
    if (isSummary) return;
    if (ignoreCellClick.current) { ignoreCellClick.current = false; return; }
    
    // In Navigation Mode, a single click just selects the cell.
    // If we are already editing, SpreadsheetViewV3 will handle the click-outside.
    onCellClick(rowId, colId, e);
  };

  const renderCellContent = (col: V3Column): React.ReactNode => {
    if (isSummary) {
      if (col.id === 'name') return <span className="text-gray-500 italic text-xs">subtotal</span>;
      if (col.isTotal && row.children) {
        const sum = row.children.reduce((acc, c) => {
          const v = col.type === 'formula' && col.formula
            ? Number(evaluateFormula(col.formula, c.cells) || 0)
            : Number(c.cells[col.id] || 0);
          return acc + v;
        }, 0);
        return col.type === 'currency' || col.type === 'formula'
          ? formatCurrency(sum)
          : sum || '';
      }
      return '';
    }

    const raw = row.cells[col.id];
    if (liveEdit?.rowId === row.id && liveEdit.colId === col.id) return liveEdit.value;

    if (col.type === 'formula' && col.formula) {
      const result = evaluateFormula(col.formula, row.cells);
      return (
        <span className="text-blue-700 font-medium">
          {typeof result === 'number' ? formatCurrency(result) : result}
        </span>
      );
    }

    if (col.type === 'currency') return formatCurrency(raw);
    if (col.type === 'number') return raw !== null && raw !== undefined ? Number(raw).toLocaleString() : '';
    if (col.type === 'checkbox') return (
      <input type="checkbox" checked={!!raw} readOnly className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
    );
    if (col.type === 'select' && raw) {
      const colorClass = STATUS_COLORS[String(raw)] ?? 'bg-gray-100 text-gray-600';
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}>
          {String(raw)}
        </span>
      );
    }
    if (col.type === 'date' && raw) {
      return <span className="text-gray-700 font-mono text-xs">{String(raw)}</span>;
    }
    return raw !== null && raw !== undefined ? String(raw) : '';
  };

  const renderEditInput = (col: V3Column) => {
    if (col.type === 'select' && col.options?.length) {
      return (
        <select
          ref={selectRef}
          defaultValue={String(row.cells[col.id] ?? '')}
          onChange={(e) => { onUpdateCell(row.id, col.id, e.target.value); onStopEdit(); }}
          onBlur={() => onStopEdit()}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          className="absolute inset-0 w-full h-full px-2 bg-white border-2 border-blue-600 outline-none z-50 text-xs"
        >
          <option value="">—</option>
          {col.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (col.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          defaultChecked={!!row.cells[col.id]}
          onChange={(e) => { onUpdateCell(row.id, col.id, e.target.checked); onStopEdit(); }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 absolute inset-0 m-auto z-50"
        />
      );
    }
    return (
      <input
        ref={inputRef}
        value={liveEdit?.rowId === row.id && liveEdit.colId === col.id ? liveEdit.value : editValue}
        onChange={(e) => {
          setEditValue(e.target.value);
          onLiveEditChange(row.id, col.id, e.target.value);
        }}
        onBlur={() => commitEdit(col.id)}
        onKeyDown={(e) => handleKeyDown(e, col.id)}
        onClick={(e) => e.stopPropagation()}
        type={col.type === 'date' ? 'date' : 'text'}
        className="absolute inset-0 w-full h-full px-2 bg-white text-gray-900 border border-blue-500 outline-none z-50 shadow-sm text-xs font-mono"
        style={{ fontSize }}
      />
    );
  };

  const rowBg = useMemo(() => {
    if (isSelected) return 'bg-blue-100';
    if (isSummary) return 'bg-gray-50 font-bold';
    if (isGroup) return 'bg-gray-50/80 font-semibold border-y border-gray-200';
    if (row.style?.backgroundColor) return '';
    return rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
  }, [isSelected, isSummary, isGroup, rowIndex, row.style]);

  const stickyBg = () => {
    if (isSelected) return 'bg-blue-100';
    if (isSummary) return 'bg-gray-50';
    if (isGroup) return 'bg-gray-50';
    if (row.style?.backgroundColor) return '';
    return rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  };

  const rowStyleBg = (!isSelected && !isSummary && !isGroup) ? row.style?.backgroundColor : undefined;

  return (
    <tr
      className={`group relative transition-colors ${hClass} ${rowBg}`}
      style={{ color: row.style?.textColor, backgroundColor: rowStyleBg }}
      onMouseEnter={() => !isSummary && onRowMouseEnter(row.id)}
    >
      {/* Row number / checkbox */}
      <td
        onClick={() => !isSummary && onToggleSelect(row.id)}
        onContextMenu={(e) => !isSummary && onContextMenu(e, 'row', row.id)}
        className={`sticky left-0 z-30 border-r border-b border-gray-200 text-center p-0 cursor-pointer transition-colors
          ${isSelected && !isSummary ? 'bg-blue-600 text-white' : stickyBg()}
          ${isScrolled ? 'after:content-[""] after:absolute after:top-0 after:bottom-0 after:-right-[6px] after:w-[6px] after:bg-gradient-to-r after:from-black/[0.12] after:to-transparent after:pointer-events-none' : ''}
        `}
        style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, maxWidth: ROW_NUM_WIDTH, backgroundColor: isSelected || isSummary || isGroup ? undefined : row.style?.backgroundColor }}
      >
        <div className="flex items-center justify-center h-full">
          {!isSummary && (
            <>
              <span className={`font-mono text-gray-500 ${isSelected ? 'hidden' : 'group-hover:hidden'}`} style={{ fontSize }}>
                {rowIndex + 1}
              </span>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(row.id)}
                onClick={(e) => e.stopPropagation()}
                className={`h-4 w-4 rounded border-gray-300 text-blue-600 ${isSelected ? 'block' : 'hidden group-hover:block'}`}
              />
            </>
          )}
        </div>
        {/* Custom border stripes */}
        {row.style?.borderColor && (
          <>
            <div className="absolute top-0 left-0 right-0 h-px pointer-events-none z-40" style={{ backgroundColor: row.style.borderColor }} />
            <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none z-40" style={{ backgroundColor: row.style.borderColor }} />
          </>
        )}
      </td>

      {/* Data cells */}
      {columns.map((col, colIndex) => {
        const isFirstCol = colIndex === 0;
        const isFocused = focusedCell?.rowId === row.id && focusedCell?.colId === col.id;
        const isEditing = activeEditSource === 'cell' && editingCell?.rowId === row.id && editingCell?.colId === col.id;
        const inRange = rangeColIds.has(col.id) && inRangeSelection;
        const cellStyle = row.cellStyles?.[col.id] ?? {};
        const isEditable = col.editable && col.type !== 'formula' && !isSummary;

        const isFillHandle = !isSummary && focusedCell?.rowId === row.id && focusedCell?.colId === col.id && col.editable && col.type !== 'formula';
        const isFillRangeCell = !isSummary && isFillTarget && fillAnchorCell?.colId === col.id;
        const isColSelected = !isSummary && selectedColId === col.id;
        const isCutCell = !isSummary && (cutColId === col.id || cutCellColIds.has(col.id));

        const tdStyle: React.CSSProperties = {
          width: col.width,
          minWidth: col.width,
          maxWidth: col.width,
          backgroundColor: cellStyle.backgroundColor ?? rowStyleBg,
          color: cellStyle.textColor ?? undefined,
          ...(isColSelected ? { boxShadow: 'inset 2px 0 0 0 #2563eb, inset -2px 0 0 0 #2563eb' } : {}),
        };

        return (
          <td
            key={col.id}
            className={`border-r border-b border-gray-200 px-2 relative transition-colors cursor-default
              ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
              ${isSummary ? 'bg-gray-50' : ''}
              ${isSelected && !cellStyle.backgroundColor && !isSummary ? 'bg-blue-50' : ''}
              ${inRange && !isFocused ? 'bg-blue-50' : ''}
              ${isColSelected && !isSelected && !inRange && !cellStyle.backgroundColor ? 'bg-blue-50' : ''}
              ${isFillRangeCell && !cellStyle.backgroundColor ? 'bg-blue-50/60' : ''}
              ${col.type === 'formula' && !cellStyle.backgroundColor && !isColSelected ? 'bg-amber-50/40' : ''}
              ${isEditing ? 'cursor-text' : ''}
            `}
            style={tdStyle}
            onClick={(e) => handleClick(row.id, col.id, e)}
            onDoubleClick={(e) => {
              if (!isSummary) {
                lastClickRef.current = { time: Date.now(), rowId: row.id, colId: col.id }; // Mark as double click
                onCellDoubleClick(row.id, col.id);
              }
            }}
            onContextMenu={(e) => !isSummary && onContextMenu(e, 'cell', row.id, col.id)}
            onMouseDown={(e) => !isSummary && onCellMouseDown(row.id, col.id, e)}
            onMouseEnter={() => !isSummary && onCellMouseEnter(row.id, col.id)}
          >
            {/* Range selection ring */}
            {inRange && !isFocused && (
              <div className="absolute inset-0 border border-blue-300 pointer-events-none z-10" />
            )}
            {/* Focus ring */}
            {isFocused && !isEditing && (
              <div className="absolute inset-0 border-2 border-blue-600 pointer-events-none z-20 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.3)]" />
            )}
            {/* Fill range dashed border */}
            {isFillRangeCell && (
              <div className="absolute inset-0 border border-dashed border-blue-500 pointer-events-none z-20" />
            )}
            {/* Custom cell border */}
            {(cellStyle.borderColor || row.style?.borderColor) && (
              <div className="absolute inset-0 border-2 pointer-events-none z-20" style={{ borderColor: cellStyle.borderColor ?? row.style?.borderColor }} />
            )}
            {/* Cut dashed border */}
            {isCutCell && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none z-[21]" />
            )}
            {/* Edit mode outer ring */}
            {isEditing && (
              <div className="absolute inset-0 pointer-events-none z-[55]" style={{ boxShadow: 'inset 0 0 0 2px #2563eb, 0 0 0 2px #93c5fd' }} />
            )}

            {/* Editing */}
            {isEditing ? renderEditInput(col) : (
              <div
                className={`flex items-center h-full w-full overflow-hidden relative z-10 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}
                style={{ paddingLeft: isFirstCol && (isGroup || level > 0) ? `${level * 16 + (hasChildren ? 0 : 20)}px` : undefined }}
              >
                {isFirstCol && hasChildren && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(row.id); }}
                    className="mr-1 p-0.5 rounded hover:bg-blue-100 text-blue-500 shrink-0 transition-colors"
                  >
                    {isExpanded ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
                  </button>
                )}
                <span className="truncate text-xs" style={{ fontSize }}>
                  {renderCellContent(col)}
                </span>
              </div>
            )}

            {/* Fill handle — larger transparent hit area with centered visual square */}
            {isFillHandle && (
              <div
                className="absolute z-30 cursor-crosshair select-none flex items-end justify-end"
                style={{ bottom: -8, right: -8, width: 18, height: 18, padding: 3 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  ignoreCellClick.current = true;
                  onFillHandleMouseDown(row.id, col.id);
                }}
              >
                <div style={{ width: 9, height: 9, backgroundColor: '#1a73e8', border: '2px solid white', borderRadius: 1, boxShadow: '0 0 0 1px #1a73e8' }} />
              </div>
            )}
          </td>
        );
      })}

      {/* Add-column placeholder cell */}
      <td className="border-r border-gray-200 bg-transparent" style={{ width: 44, minWidth: 44 }} />

      {/* Sticky right actions */}
      <td
        className={`sticky right-0 z-30 w-20 px-2 border-l border-gray-200 transition-all duration-200 relative
          ${stickyBg()}
          ${!isAtEnd ? 'before:content-[""] before:absolute before:top-0 before:bottom-0 before:-left-[6px] before:w-[6px] before:bg-gradient-to-l before:from-black/[0.12] before:to-transparent before:pointer-events-none' : ''}
        `}
        style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH, maxWidth: ACTIONS_WIDTH, backgroundColor: isSelected || isSummary || isGroup ? undefined : row.style?.backgroundColor }}
      />
    </tr>
  );
};

// Custom comparator: only re-render a row if something relevant to THAT row changed.
// This prevents all rows from re-rendering when focusedCell/editingCell/liveEdit changes
// for a different row (the common case during arrow-key navigation and cell editing).
function arePropsEqual(prev: V3RowProps, next: V3RowProps): boolean {
  const rowId = prev.row.id;

  if (prev.row !== next.row) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isExpanded !== next.isExpanded) return false;
  if (prev.isSummary !== next.isSummary) return false;
  if (prev.inRangeSelection !== next.inRangeSelection) return false;
  if (prev.rangeColIds !== next.rangeColIds) return false;
  if (prev.selectedColId !== next.selectedColId) return false;
  if (prev.isScrolled !== next.isScrolled) return false;
  if (prev.isAtEnd !== next.isAtEnd) return false;
  if (prev.fontSize !== next.fontSize) return false;
  if (prev.displayDensity !== next.displayDensity) return false;
  if (prev.fillAnchorCell !== next.fillAnchorCell) return false;
  if (prev.fillRangeRowIds !== next.fillRangeRowIds) return false;
  if (prev.cutColId !== next.cutColId) return false;
  if (prev.cutCellColIds !== next.cutCellColIds) return false;
  if (prev.activeEditSource !== next.activeEditSource) return false;

  // focusedCell: only care about THIS row's focused column
  const prevFocCol = prev.focusedCell?.rowId === rowId ? prev.focusedCell.colId : null;
  const nextFocCol = next.focusedCell?.rowId === rowId ? next.focusedCell.colId : null;
  if (prevFocCol !== nextFocCol) return false;

  // editingCell: only care about THIS row's editing column/mode
  const prevEditCol = prev.editingCell?.rowId === rowId ? prev.editingCell.colId : null;
  const nextEditCol = next.editingCell?.rowId === rowId ? next.editingCell.colId : null;
  if (prevEditCol !== nextEditCol) return false;
  if (prevEditCol !== null && nextEditCol !== null) {
    if (prev.editingCell?.initial !== next.editingCell?.initial) return false;
    if ((prev.editingCell as any)?.mode !== (next.editingCell as any)?.mode) return false;
  }

  // liveEdit: only care about THIS row's live value
  const prevLive = prev.liveEdit?.rowId === rowId ? prev.liveEdit : null;
  const nextLive = next.liveEdit?.rowId === rowId ? next.liveEdit : null;
  if (prevLive?.colId !== nextLive?.colId || prevLive?.value !== nextLive?.value) return false;

  return true;
}

export default React.memo(V3RowComponent, arePropsEqual);
