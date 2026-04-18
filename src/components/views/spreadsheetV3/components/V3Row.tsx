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
  rowIndex: number;        // absolute flat index, used for row number display
  level: number;
  columns: V3Column[];
  isSelected: boolean;
  isExpanded: boolean;
  isSummary?: boolean;
  focusedCell: { rowId: string; colId: string } | null;
  editingCell: { rowId: string; colId: string; initial?: string } | null;
  inRangeSelection: boolean;       // true when this row has any cell in the drag-range
  rangeColIds: Set<string>;        // which column ids are highlighted by range selection
  isScrolled: boolean;
  isAtEnd: boolean;
  fontSize: number;
  displayDensity: 'compact' | 'standard' | 'comfortable';
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onCellClick: (rowId: string, colId: string, e: React.MouseEvent) => void;
  onCellDoubleClick: (rowId: string, colId: string) => void;
  onStopEdit: () => void;
  onUpdateCell: (rowId: string, colId: string, value: CellValue, direction?: 'up' | 'down' | 'left' | 'right') => void;
  onContextMenu: (e: React.MouseEvent, type: 'row' | 'cell', rowId: string, colId?: string) => void;
  onCellMouseDown: (rowId: string, colId: string, e: React.MouseEvent) => void;
  onCellMouseEnter: (rowId: string, colId: string) => void;
}

const HEIGHT: Record<string, string> = { compact: 'h-7', standard: 'h-9', comfortable: 'h-11' };

const V3RowComponent: React.FC<V3RowProps> = ({
  row, rowIndex, level, columns, isSelected, isExpanded, isSummary,
  focusedCell, editingCell, inRangeSelection, rangeColIds,
  isScrolled, isAtEnd, fontSize, displayDensity,
  onToggleSelect, onToggleExpand, onCellClick, onCellDoubleClick,
  onStopEdit, onUpdateCell, onContextMenu, onCellMouseDown, onCellMouseEnter,
}) => {
  const hClass = HEIGHT[displayDensity] ?? 'h-7';
  const hasChildren = !!row.children?.length;
  const isGroup = !!row.isGroup;
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editingCell?.rowId === row.id) {
      const col = columns.find(c => c.id === editingCell.colId);
      const raw = row.cells[editingCell.colId];
      setEditValue(editingCell.initial !== undefined ? editingCell.initial : raw === null || raw === undefined ? '' : String(raw));
    }
  }, [editingCell]);

  useEffect(() => {
    if (editingCell?.rowId === row.id && inputRef.current) {
      inputRef.current.focus();
      if (editingCell.initial === undefined) inputRef.current.select();
    }
  }, [editingCell]);

  const commitEdit = (colId: string, dir?: 'up' | 'down' | 'left' | 'right') => {
    const col = columns.find(c => c.id === colId);
    let val: CellValue = editValue;
    if (col?.type === 'number' || col?.type === 'currency') {
      val = editValue === '' ? null : parseFloat(editValue.replace(/,/g, '')) || 0;
    } else if (col?.type === 'checkbox') {
      val = editValue === 'true';
    }
    onUpdateCell(row.id, colId, val, dir);
    onStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent, colId: string) => {
    switch (e.key) {
      case 'Enter':    e.preventDefault(); commitEdit(colId, e.shiftKey ? 'up' : 'down'); break;
      case 'Tab':      e.preventDefault(); commitEdit(colId, e.shiftKey ? 'left' : 'right'); break;
      case 'Escape':   e.preventDefault(); onStopEdit(); break;
      case 'ArrowUp':  if (inputRef.current?.selectionStart === 0) { e.preventDefault(); commitEdit(colId, 'up'); } break;
      case 'ArrowDown':if (inputRef.current?.selectionStart === editValue.length) { e.preventDefault(); commitEdit(colId, 'down'); } break;
    }
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
          className="h-4 w-4 rounded border-gray-300 text-blue-600 absolute inset-0 m-auto z-50"
        />
      );
    }
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => commitEdit(col.id)}
        onKeyDown={(e) => handleKeyDown(e, col.id)}
        type={col.type === 'date' ? 'date' : 'text'}
        className="absolute inset-0 w-full h-full px-2 bg-white text-gray-900 border-2 border-blue-600 outline-none z-50 shadow-sm text-xs font-mono"
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

  return (
    <tr
      className={`group relative transition-colors ${hClass} ${rowBg}`}
      style={{ color: row.style?.textColor }}
    >
      {/* Row number / checkbox */}
      <td
        onClick={() => !isSummary && onToggleSelect(row.id)}
        onContextMenu={(e) => !isSummary && onContextMenu(e, 'row', row.id)}
        className={`sticky left-0 z-30 border-r border-gray-200 text-center p-0 cursor-pointer transition-colors
          ${isSelected && !isSummary ? 'bg-blue-600 text-white' : stickyBg()}
          ${isScrolled ? 'after:content-[""] after:absolute after:top-0 after:bottom-0 after:-right-1.5 after:w-1.5 after:bg-gradient-to-r after:from-black/10 after:to-transparent after:pointer-events-none' : ''}
        `}
        style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, maxWidth: ROW_NUM_WIDTH }}
      >
        <div className="flex items-center justify-center h-full">
          {!isSummary && (
            <>
              <span className={`text-[11px] font-mono text-gray-400 ${isSelected ? 'hidden' : 'group-hover:hidden'}`}>
                {isGroup ? '' : rowIndex + 1}
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
      {columns.map((col) => {
        const isFocused = focusedCell?.rowId === row.id && focusedCell?.colId === col.id;
        const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
        const inRange = rangeColIds.has(col.id) && inRangeSelection;
        const cellStyle = row.cellStyles?.[col.id] ?? {};
        const isEditable = col.editable && col.type !== 'formula' && !isSummary;

        const tdStyle: React.CSSProperties = {
          width: col.width,
          minWidth: col.width,
          maxWidth: col.width,
          backgroundColor: cellStyle.backgroundColor ?? undefined,
          color: cellStyle.textColor ?? undefined,
        };

        return (
          <td
            key={col.id}
            className={`border-r border-gray-200 px-2 relative transition-colors cursor-default
              ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
              ${isSummary ? 'bg-gray-50' : ''}
              ${isSelected && !cellStyle.backgroundColor && !isSummary ? 'bg-blue-50' : ''}
              ${inRange && !isFocused ? 'bg-blue-50' : ''}
              ${col.type === 'formula' && !cellStyle.backgroundColor ? 'bg-amber-50/40' : ''}
              ${isEditable ? 'hover:cursor-text' : ''}
            `}
            style={tdStyle}
            onClick={(e) => !isSummary && onCellClick(row.id, col.id, e)}
            onDoubleClick={() => isEditable && onCellDoubleClick(row.id, col.id)}
            onContextMenu={(e) => !isSummary && onContextMenu(e, 'cell', row.id, col.id)}
            onMouseDown={(e) => !isSummary && onCellMouseDown(row.id, col.id, e)}
            onMouseEnter={() => !isSummary && onCellMouseEnter(row.id, col.id)}
          >
            {/* Range/focus ring */}
            {inRange && !isFocused && (
              <div className="absolute inset-0 border border-blue-300 pointer-events-none z-10" />
            )}
            {isFocused && !isEditing && (
              <div className="absolute inset-0 border-2 border-blue-600 pointer-events-none z-20 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.3)]" />
            )}
            {cellStyle.borderColor && (
              <div className="absolute inset-0 border-2 pointer-events-none z-20" style={{ borderColor: cellStyle.borderColor }} />
            )}

            {/* Editing */}
            {isEditing ? renderEditInput(col) : (
              <div
                className={`flex items-center h-full w-full overflow-hidden relative z-10 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}
                style={{ paddingLeft: col.id === 'name' && (isGroup || level > 0) ? `${level * 16 + (hasChildren ? 0 : 20)}px` : undefined }}
              >
                {/* Expand toggle for name column */}
                {col.id === 'name' && hasChildren && (
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
          </td>
        );
      })}

      {/* Add-column placeholder cell */}
      <td className="border-r border-gray-200 bg-transparent" style={{ width: 44, minWidth: 44 }} />

      {/* Sticky right actions */}
      <td
        className={`sticky right-0 z-30 border-l border-gray-200 transition-all
          ${stickyBg()}
          ${!isAtEnd ? 'before:content-[""] before:absolute before:top-0 before:bottom-0 before:-left-1.5 before:w-1.5 before:bg-gradient-to-l before:from-black/10 before:to-transparent before:pointer-events-none' : ''}
        `}
        style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH }}
      >
        {/* placeholder for future row action menu */}
      </td>
    </tr>
  );
};

export default V3RowComponent;
