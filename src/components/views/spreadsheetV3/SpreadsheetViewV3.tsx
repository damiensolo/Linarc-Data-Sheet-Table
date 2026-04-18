import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { V3Sheet, V3Row, V3Column, V3CellStyle, CellValue, V3Template, evaluateFormula } from './types';
import { createTemplateSheets } from './templates';
import TemplatePicker from './components/TemplatePicker';
import FormulaBar from './components/FormulaBar';
import SheetTabs from './components/SheetTabs';
import V3Header from './components/V3Header';
import V3RowComponent from './components/V3Row';
import V3Toolbar from './components/V3Toolbar';
import AddColumnModal from './components/AddColumnModal';
import { ContextMenu, ContextMenuItem } from '../../common/ui/ContextMenu';
import {
  PlusIcon, ScissorsIcon, CopyIcon, ClipboardIcon, TrashIcon,
  ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon,
  FillColorIcon, TextColorIcon, BorderColorIcon,
} from '../../common/Icons';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../constants/designTokens';
import ColorPicker from '../../common/ui/ColorPicker';

// ─── Flat row representation for rendering ────────────────────────────────────
interface FlatRow {
  row: V3Row;
  level: number;
  isSummary: boolean;
  parentId?: string;
}

function flattenRows(rows: V3Row[], expandedIds: Set<string>, level = 0, parentId?: string): FlatRow[] {
  const result: FlatRow[] = [];
  for (const row of rows) {
    result.push({ row, level, isSummary: false, parentId });
    if (row.children?.length && expandedIds.has(row.id)) {
      result.push(...flattenRows(row.children, expandedIds, level + 1, row.id));
      // summary row for groups
      if (row.isGroup) result.push({ row, level: level + 1, isSummary: true, parentId: row.id });
    }
  }
  return result;
}

// ─── Column totals ─────────────────────────────────────────────────────────────
function sumColumn(rows: V3Row[], col: V3Column): number {
  let total = 0;
  const recurse = (items: V3Row[]) => {
    for (const r of items) {
      const val = col.type === 'formula' && col.formula
        ? Number(evaluateFormula(col.formula, r.cells) || 0)
        : Number(r.cells[col.id] || 0);
      if (!r.children?.length) total += isNaN(val) ? 0 : val;
      if (r.children) recurse(r.children);
    }
  };
  recurse(rows);
  return total;
}

function formatCurrency(v: number) {
  const abs = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${abs})` : abs;
}

// ─── ID generator ─────────────────────────────────────────────────────────────
let _uid = 1;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${_uid++}`;

// ─── Main component ──────────────────────────────────────────────────────────
const SpreadsheetViewV3: React.FC = () => {
  // ── Template picker ──────────────────────────────────────────────────────
  const [showTemplatePicker, setShowTemplatePicker] = useState(true);
  const [sheets, setSheets] = useState<V3Sheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string>('');

  const handleSelectTemplate = (template: V3Template) => {
    const newSheets = createTemplateSheets(template);
    setSheets(newSheets);
    setActiveSheetId(newSheets[0].id);
    setShowTemplatePicker(false);
  };

  const activeSheet = useMemo(() => sheets.find(s => s.id === activeSheetId) ?? sheets[0], [sheets, activeSheetId]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    // Will be re-initialized after template loads via effect below
    return ids;
  });

  useEffect(() => {
    if (!activeSheet) return;
    const defaults = new Set<string>();
    const gather = (rows: V3Row[]) => rows.forEach(r => {
      if ((r.isExpanded || r.isGroup) && r.children?.length) { defaults.add(r.id); gather(r.children!); }
    });
    gather(activeSheet.rows);
    setExpandedIds(defaults);
  }, [activeSheetId]);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string; initial?: string } | null>(null);
  const [clipboard, setClipboard] = useState<V3Row[] | null>(null);
  const [scrollState, setScrollState] = useState({ isAtStart: true, isAtEnd: false, isScrolledTop: false });
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ colId: string; dir: 'asc' | 'desc' } | null>(null);
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard');
  const [fontSize, setFontSize] = useState(12);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean; position: { x: number; y: number };
    type: 'row' | 'cell' | 'column';
    rowId?: string; colId?: string;
  } | null>(null);

  // Range selection (shift-click / mouse drag)
  const [rangeAnchor, setRangeAnchor] = useState<{ rowId: string; colId: string } | null>(null);
  const [rangeEnd, setRangeEnd] = useState<{ rowId: string; colId: string } | null>(null);
  const isDragging = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const activeResizerRef = useRef<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────
  const columns = useMemo(() => (activeSheet?.columns ?? []).filter(c => c.visible !== false), [activeSheet]);

  const sortedRows = useMemo(() => {
    if (!sort || !activeSheet) return activeSheet?.rows ?? [];
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...activeSheet.rows].sort((a, b) => {
      const va = a.cells[sort.colId] ?? '';
      const vb = b.cells[sort.colId] ?? '';
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
  }, [activeSheet, sort]);

  const flatRows = useMemo(() => flattenRows(sortedRows, expandedIds), [sortedRows, expandedIds]);

  const selectableFlat = useMemo(() => flatRows.filter(f => !f.isSummary), [flatRows]);
  const isAllSelected = selectableFlat.length > 0 && selectableFlat.every(f => selectedRowIds.has(f.row.id));
  const isSomeSelected = !isAllSelected && selectableFlat.some(f => selectedRowIds.has(f.row.id));
  useEffect(() => { if (checkboxRef.current) checkboxRef.current.indeterminate = isSomeSelected; }, [isSomeSelected]);

  // ── Scroll handler ────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setScrollState({
      isAtStart: el.scrollLeft <= 2,
      isAtEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      isScrolledTop: el.scrollTop > 0,
    });
    el.addEventListener('scroll', update);
    setTimeout(update, 100);
    return () => el.removeEventListener('scroll', update);
  }, [flatRows, columns]);

  // ── Range selection helpers ───────────────────────────────────────────
  const rangeSet = useMemo(() => {
    if (!rangeAnchor || !rangeEnd) return null;
    const aRowIdx = flatRows.findIndex(f => f.row.id === rangeAnchor.rowId);
    const eRowIdx = flatRows.findIndex(f => f.row.id === rangeEnd.rowId);
    const aColIdx = columns.findIndex(c => c.id === rangeAnchor.colId);
    const eColIdx = columns.findIndex(c => c.id === rangeEnd.colId);
    if (aRowIdx < 0 || eRowIdx < 0) return null;
    const r0 = Math.min(aRowIdx, eRowIdx), r1 = Math.max(aRowIdx, eRowIdx);
    const c0 = Math.min(aColIdx, eColIdx), c1 = Math.max(aColIdx, eColIdx);
    return { r0, r1, c0, c1 };
  }, [rangeAnchor, rangeEnd, flatRows, columns]);

  const isInRange = (rowId: string): boolean => {
    if (!rangeSet) return false;
    const idx = flatRows.findIndex(f => f.row.id === rowId);
    return idx >= rangeSet.r0 && idx <= rangeSet.r1;
  };

  const rangeColIds = useMemo(() => {
    if (!rangeSet) return new Set<string>();
    return new Set(columns.slice(rangeSet.c0, rangeSet.c1 + 1).map(c => c.id));
  }, [rangeSet, columns]);

  // ── Sheet helpers ─────────────────────────────────────────────────────
  const updateSheet = useCallback((updates: Partial<V3Sheet>) => {
    setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, ...updates } : s));
  }, [activeSheetId]);

  const updateRows = useCallback((updater: (rows: V3Row[]) => V3Row[]) => {
    setSheets(prev => prev.map(s =>
      s.id === activeSheetId ? { ...s, rows: updater(s.rows) } : s
    ));
  }, [activeSheetId]);

  // ── Row CRUD ────────────────────────────────────────────────────────────
  const handleAddRow = () => {
    const newRow: V3Row = { id: uid('row'), cells: {} };
    updateRows(rows => [...rows, newRow]);
    setTimeout(() => scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight), 60);
  };

  const handleDeleteRows = (ids: Set<string>) => {
    const filter = (rows: V3Row[]): V3Row[] =>
      rows.filter(r => !ids.has(r.id)).map(r => ({ ...r, children: r.children ? filter(r.children) : undefined }));
    updateRows(filter);
    setSelectedRowIds(new Set());
  };

  const handleInsertRow = (afterId: string) => {
    const insert = (rows: V3Row[]): V3Row[] => {
      const idx = rows.findIndex(r => r.id === afterId);
      if (idx >= 0) {
        const next = [...rows];
        next.splice(idx + 1, 0, { id: uid('row'), cells: {} });
        return next;
      }
      return rows.map(r => ({ ...r, children: r.children ? insert(r.children) : undefined }));
    };
    updateRows(insert);
  };

  const handleAddSubRow = (parentId: string) => {
    const add = (rows: V3Row[]): V3Row[] => rows.map(r => {
      if (r.id === parentId) {
        const child: V3Row = { id: uid('row'), cells: {} };
        return { ...r, children: [...(r.children ?? []), child], isExpanded: true };
      }
      return { ...r, children: r.children ? add(r.children) : undefined };
    });
    updateRows(add);
    setExpandedIds(prev => new Set([...prev, parentId]));
  };

  const handleUpdateCell = useCallback((rowId: string, colId: string, value: CellValue, direction?: 'up' | 'down' | 'left' | 'right') => {
    const update = (rows: V3Row[]): V3Row[] => rows.map(r => {
      if (r.id === rowId) return { ...r, cells: { ...r.cells, [colId]: value } };
      return { ...r, children: r.children ? update(r.children) : undefined };
    });
    updateRows(update);
    setEditingCell(null);

    if (direction && focusedCell) {
      const flatIdx = flatRows.findIndex(f => f.row.id === rowId);
      const colIdx = columns.findIndex(c => c.id === colId);
      let nr = flatIdx, nc = colIdx;
      if (direction === 'down') nr = Math.min(flatRows.length - 1, flatIdx + 1);
      if (direction === 'up') nr = Math.max(0, flatIdx - 1);
      if (direction === 'right') nc = Math.min(columns.length - 1, colIdx + 1);
      if (direction === 'left') nc = Math.max(0, colIdx - 1);
      if (nr !== flatIdx || nc !== colIdx) {
        setFocusedCell({ rowId: flatRows[nr].row.id, colId: columns[nc].id });
      }
    }
  }, [flatRows, columns, focusedCell, updateRows]);

  // ── Cell focus/click ───────────────────────────────────────────────────
  const handleCellClick = (rowId: string, colId: string, e: React.MouseEvent) => {
    setEditingCell(null);
    if (e.shiftKey && rangeAnchor) {
      setRangeEnd({ rowId, colId });
    } else {
      setFocusedCell({ rowId, colId });
      setRangeAnchor({ rowId, colId });
      setRangeEnd(null);
    }
    setSelectedRowIds(new Set());
  };

  const handleCellMouseDown = (rowId: string, colId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    setRangeAnchor({ rowId, colId });
    setRangeEnd(null);
    setFocusedCell({ rowId, colId });
  };

  const handleCellMouseEnter = (rowId: string, colId: string) => {
    if (isDragging.current) setRangeEnd({ rowId, colId });
  };

  useEffect(() => {
    const up = () => { isDragging.current = false; };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) return;
    if (!focusedCell) return;

    const rIdx = flatRows.findIndex(f => f.row.id === focusedCell.rowId);
    const cIdx = columns.findIndex(c => c.id === focusedCell.colId);
    if (rIdx < 0 || cIdx < 0) return;

    const move = (dr: number, dc: number) => {
      e.preventDefault();
      let nr = Math.max(0, Math.min(flatRows.length - 1, rIdx + dr));
      let nc = Math.max(0, Math.min(columns.length - 1, cIdx + dc));
      if (e.key === 'Tab' && !e.shiftKey && nc >= columns.length) { nc = 0; nr = Math.min(flatRows.length - 1, nr + 1); }
      if (e.key === 'Tab' && e.shiftKey && nc < 0) { nc = columns.length - 1; nr = Math.max(0, nr - 1); }
      const next = flatRows[nr];
      setFocusedCell({ rowId: next.row.id, colId: columns[nc].id });
      if (e.shiftKey && e.key !== 'Tab') setRangeEnd({ rowId: next.row.id, colId: columns[nc].id });
    };

    switch (e.key) {
      case 'ArrowUp':    move(-1, 0); break;
      case 'ArrowDown':  move(1, 0); break;
      case 'ArrowLeft':  move(0, -1); break;
      case 'ArrowRight': move(0, 1); break;
      case 'Tab':        move(0, e.shiftKey ? -1 : 1); break;
      case 'Enter':
        const targetCol = columns[cIdx];
        if (targetCol?.editable && flatRows[rIdx] && !flatRows[rIdx].isSummary) {
          e.preventDefault();
          setEditingCell({ rowId: flatRows[rIdx].row.id, colId: targetCol.id });
        } else { move(1, 0); }
        break;
      case 'Delete':
      case 'Backspace':
        if (columns[cIdx]?.editable && !flatRows[rIdx].isSummary) {
          handleUpdateCell(flatRows[rIdx].row.id, columns[cIdx].id, null);
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const col = columns[cIdx];
          if (col?.editable && !flatRows[rIdx].isSummary) {
            setEditingCell({ rowId: flatRows[rIdx].row.id, colId: col.id, initial: e.key });
          }
        }
    }
  };

  // ── Cut / Copy / Paste ──────────────────────────────────────────────────
  const handleCut = useCallback((ids?: Set<string>) => {
    const target = ids ?? selectedRowIds;
    const items: V3Row[] = [];
    const find = (rows: V3Row[]) => rows.forEach(r => { if (target.has(r.id)) items.push(JSON.parse(JSON.stringify(r))); if (r.children) find(r.children); });
    find(activeSheet?.rows ?? []);
    if (items.length) { setClipboard(items); handleDeleteRows(target); }
  }, [selectedRowIds, activeSheet]);

  const handleCopy = useCallback((ids?: Set<string>) => {
    const target = ids ?? selectedRowIds;
    const items: V3Row[] = [];
    const find = (rows: V3Row[]) => rows.forEach(r => { if (target.has(r.id)) items.push(JSON.parse(JSON.stringify(r))); if (r.children) find(r.children); });
    find(activeSheet?.rows ?? []);
    if (items.length) setClipboard(items);
  }, [selectedRowIds, activeSheet]);

  const handlePaste = useCallback((afterId?: string) => {
    if (!clipboard?.length) return;
    const fresh = clipboard.map(r => ({ ...r, id: uid('row'), cells: { ...r.cells } }));
    if (afterId) {
      const ins = (rows: V3Row[]): V3Row[] => {
        const idx = rows.findIndex(r => r.id === afterId);
        if (idx >= 0) { const next = [...rows]; next.splice(idx + 1, 0, ...fresh); return next; }
        return rows.map(r => ({ ...r, children: r.children ? ins(r.children) : undefined }));
      };
      updateRows(ins);
    } else {
      updateRows(rows => [...rows, ...fresh]);
    }
  }, [clipboard, updateRows]);

  // ── Style update ─────────────────────────────────────────────────────────
  const handleStyleUpdate = (style: Partial<V3CellStyle>, ids?: Set<string>) => {
    const target = ids ?? selectedRowIds;
    const update = (rows: V3Row[]): V3Row[] => rows.map(r => {
      let next = r;
      if (target.has(r.id)) {
        const merged = { ...(r.style ?? {}), ...style };
        Object.keys(style).forEach(k => { if ((style as any)[k] === undefined) delete (merged as any)[k]; });
        next = { ...r, style: merged };
      }
      if (next.children) next = { ...next, children: update(next.children) };
      return next;
    });
    updateRows(update);
  };

  // ── Column CRUD ────────────────────────────────────────────────────────
  const handleAddColumn = (colDef: Omit<V3Column, 'id'>) => {
    const newCol: V3Column = { ...colDef, id: uid('col') };
    updateSheet({ columns: [...(activeSheet?.columns ?? []), newCol] });
    setShowAddColumn(false);
  };

  const handleResizeColumn = useCallback((colId: string, newWidth: number) => {
    updateSheet({ columns: (activeSheet?.columns ?? []).map(c => c.id === colId ? { ...c, width: Math.max(newWidth, 50) } : c) });
  }, [activeSheet, updateSheet]);

  const onMouseDownResize = (colId: string) => (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    activeResizerRef.current = colId; setResizingColId(colId);
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    const startX = e.clientX, startWidth = col.width;
    const onMove = (ev: MouseEvent) => { if (activeResizerRef.current === colId) handleResizeColumn(colId, startWidth + (ev.clientX - startX)); };
    const onUp = () => { activeResizerRef.current = null; setResizingColId(null); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  const handleColumnMove = (fromId: string, toId: string, pos: 'left' | 'right') => {
    const cols = [...(activeSheet?.columns ?? [])];
    const si = cols.findIndex(c => c.id === fromId);
    let ti = cols.findIndex(c => c.id === toId);
    if (si < 0 || ti < 0) return;
    if (pos === 'right') ti++;
    if (si < ti) ti--;
    const [moved] = cols.splice(si, 1);
    cols.splice(ti, 0, moved);
    updateSheet({ columns: cols });
  };

  const handleSort = (colId: string) => {
    setSort(prev => {
      if (prev?.colId === colId) return prev.dir === 'asc' ? { colId, dir: 'desc' } : null;
      return { colId, dir: 'asc' };
    });
  };

  // ── Sheet management ──────────────────────────────────────────────────
  const handleAddSheet = () => {
    const s: V3Sheet = {
      id: uid('sheet'),
      name: `Sheet ${sheets.length + 1}`,
      columns: [
        { id: uid('col'), label: 'A', type: 'text', width: 200, editable: true, visible: true },
        { id: uid('col'), label: 'B', type: 'text', width: 150, editable: true, visible: true },
        { id: uid('col'), label: 'C', type: 'text', width: 150, editable: true, visible: true },
      ],
      rows: Array.from({ length: 10 }, () => ({ id: uid('row'), cells: {} })),
    };
    setSheets(prev => [...prev, s]);
    setActiveSheetId(s.id);
  };

  const handleRenameSheet = (id: string, name: string) => setSheets(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  const handleDeleteSheet = (id: string) => {
    setSheets(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeSheetId === id && next.length) setActiveSheetId(next[0].id);
      return next;
    });
  };

  // ── Context menu ─────────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent, type: 'row' | 'cell' | 'column', rowId?: string, colId?: string) => {
    e.preventDefault();
    setContextMenu({ visible: true, position: { x: e.clientX, y: e.clientY }, type, rowId, colId });
  };

  const getContextItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const { type, rowId, colId } = contextMenu;
    const base: ContextMenuItem[] = [
      { label: 'Cut',   icon: <ScissorsIcon className="w-4 h-4" />, shortcut: '⌘X', onClick: () => rowId && handleCut(new Set([rowId])) },
      { label: 'Copy',  icon: <CopyIcon className="w-4 h-4" />,     shortcut: '⌘C', onClick: () => rowId && handleCopy(new Set([rowId])) },
      { label: 'Paste', icon: <ClipboardIcon className="w-4 h-4" />, shortcut: '⌘V', disabled: !clipboard, onClick: () => handlePaste(rowId) },
      { separator: true } as any,
      { label: 'Insert row above', icon: <ArrowUpIcon className="w-4 h-4" />, onClick: () => rowId && handleInsertRow(rowId) },
      { label: 'Insert row below', icon: <ArrowDownIcon className="w-4 h-4" />, onClick: () => rowId && handleInsertRow(rowId) },
      { label: 'Add sub-row',      icon: <PlusIcon className="w-4 h-4" />, onClick: () => rowId && handleAddSubRow(rowId) },
      { separator: true } as any,
    ];

    const bgSubMenu: ContextMenuItem[] = [
      { label: 'Clear', icon: <div className="w-3 h-3 rounded-full border border-gray-300" />, onClick: () => rowId && handleStyleUpdate({ backgroundColor: undefined }, new Set([rowId])) },
      ...BACKGROUND_COLORS.map(c => ({
        label: ' ',
        icon: <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c }} />,
        onClick: () => rowId && handleStyleUpdate({ backgroundColor: c }, new Set([rowId])),
      })),
    ];

    return [
      ...base,
      { label: 'Background Color', icon: <FillColorIcon className="w-4 h-4 text-gray-600" />, submenu: bgSubMenu },
      { separator: true } as any,
      { label: 'Delete row', icon: <TrashIcon className="w-4 h-4" />, danger: true, onClick: () => rowId && handleDeleteRows(new Set([rowId])) },
    ];
  };

  // ── Totals ────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const col of columns) {
      if (col.isTotal) result[col.id] = sumColumn(activeSheet?.rows ?? [], col);
    }
    return result;
  }, [columns, activeSheet]);

  // ── Formula bar selection ─────────────────────────────────────────────
  const formulaBarSelection = useMemo(() => {
    if (!focusedCell) return null;
    const ri = flatRows.findIndex(f => f.row.id === focusedCell.rowId);
    const ci = columns.findIndex(c => c.id === focusedCell.colId);
    return ri >= 0 && ci >= 0 ? { rowIdx: ri, colIdx: ci } : null;
  }, [focusedCell, flatRows, columns]);

  const handleFormulaBarCommit = (rowId: string, colId: string, value: CellValue) => {
    handleUpdateCell(rowId, colId, value);
  };

  // ── Template picker shown until user picks ────────────────────────────
  if (showTemplatePicker) return <TemplatePicker onSelect={handleSelectTemplate} />;
  if (!activeSheet) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full outline-none focus:outline-none overflow-hidden bg-white"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => { isDragging.current = false; }}
    >
      {/* ── Toolbar ── */}
      <div className="px-4 pt-[7px] shrink-0">
        <V3Toolbar
          selectedCount={selectedRowIds.size}
          hasClipboard={!!clipboard?.length}
          onCut={() => handleCut()}
          onCopy={() => handleCopy()}
          onPaste={() => handlePaste()}
          onDelete={() => handleDeleteRows(selectedRowIds)}
          onDeselectAll={() => setSelectedRowIds(new Set())}
          onStyleUpdate={handleStyleUpdate}
          onAddRow={handleAddRow}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          density={density}
          onDensityChange={setDensity}
        />
      </div>

      {/* ── Formula bar ── */}
      <div className="px-4 shrink-0">
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <FormulaBar
            selection={formulaBarSelection}
            rows={flatRows.map(f => f.row)}
            columns={columns}
            onCommit={handleFormulaBarCommit}
          />

          {/* ── Main grid ── */}
          <div className="overflow-auto relative" ref={scrollRef} style={{ maxHeight: 'calc(100vh - 260px)' }}>
            <table className="border-collapse min-w-max table-fixed" style={{ fontSize }}>
              <V3Header
                columns={columns}
                focusedColId={focusedCell?.colId ?? null}
                resizingColumnId={resizingColId}
                sort={sort}
                isScrolled={!scrollState.isAtStart}
                isAtEnd={scrollState.isAtEnd}
                isVerticalScrolled={scrollState.isScrolledTop}
                fontSize={fontSize}
                onSort={handleSort}
                onResize={onMouseDownResize}
                onColumnMove={handleColumnMove}
                onAddColumn={() => setShowAddColumn(true)}
                onContextMenu={(e, colId) => handleContextMenu(e, 'column', undefined, colId)}
                isAllSelected={isAllSelected}
                onToggleAll={() => {
                  if (isAllSelected) setSelectedRowIds(new Set());
                  else setSelectedRowIds(new Set(selectableFlat.map(f => f.row.id)));
                }}
                checkboxRef={checkboxRef}
              />

              <tbody>
                {flatRows.map(({ row, level, isSummary, parentId }, globalIdx) => (
                  <V3RowComponent
                    key={`${row.id}-${isSummary ? 'sum' : 'row'}`}
                    row={row}
                    rowIndex={globalIdx}
                    level={level}
                    columns={columns}
                    isSelected={selectedRowIds.has(row.id)}
                    isExpanded={expandedIds.has(row.id)}
                    isSummary={isSummary}
                    focusedCell={focusedCell}
                    editingCell={editingCell}
                    inRangeSelection={isInRange(row.id)}
                    rangeColIds={rangeColIds}
                    isScrolled={!scrollState.isAtStart}
                    isAtEnd={scrollState.isAtEnd}
                    fontSize={fontSize}
                    displayDensity={density}
                    onToggleSelect={(id) => {
                      setSelectedRowIds(prev => {
                        const next = new Set(prev);
                        next.has(id) ? next.delete(id) : next.add(id);
                        return next;
                      });
                    }}
                    onToggleExpand={(id) => {
                      setExpandedIds(prev => {
                        const next = new Set(prev);
                        next.has(id) ? next.delete(id) : next.add(id);
                        return next;
                      });
                    }}
                    onCellClick={handleCellClick}
                    onCellDoubleClick={(rowId, colId) => setEditingCell({ rowId, colId })}
                    onStopEdit={() => setEditingCell(null)}
                    onUpdateCell={handleUpdateCell}
                    onContextMenu={(e, type, rowId, colId) => handleContextMenu(e, type, rowId, colId)}
                    onCellMouseDown={handleCellMouseDown}
                    onCellMouseEnter={handleCellMouseEnter}
                  />
                ))}
              </tbody>

              {/* ── Totals footer ── */}
              <tfoot className="sticky bottom-0 z-30 bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <tr className="h-9">
                  <td
                    className={`sticky left-0 z-40 border-r border-gray-300 text-center bg-gray-100 text-xs
                      ${!scrollState.isAtStart ? 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.2)]' : ''}`}
                    style={{ width: 56, minWidth: 56, maxWidth: 56, fontSize }}
                  >
                    Total
                  </td>
                  {columns.map(col => (
                    <td key={col.id} className={`border-r border-gray-300 px-2 bg-gray-100 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      style={{ width: col.width, fontSize }}
                    >
                      {col.isTotal && totals[col.id] !== undefined
                        ? (col.type === 'number' ? totals[col.id].toLocaleString() : formatCurrency(totals[col.id]))
                        : ''}
                    </td>
                  ))}
                  {/* placeholder for add-col th */}
                  <td className="bg-gray-100 border-r border-gray-300" style={{ width: 44 }} />
                  <td
                    className={`sticky right-0 z-40 border-l border-gray-200 bg-gray-100
                      ${!scrollState.isAtEnd ? 'shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.2)]' : ''}`}
                    style={{ width: 60, minWidth: 60 }}
                  />
                </tr>
              </tfoot>
            </table>

            {/* ── Add row inline button ── */}
            <div className="p-2 border-t border-gray-100 bg-white flex items-center">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors py-1 px-2 rounded hover:bg-blue-50"
              >
                <div className="w-4 h-4 rounded-full border border-blue-400 flex items-center justify-center">
                  <PlusIcon className="w-2.5 h-2.5" />
                </div>
                Add row
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sheet tabs ── */}
      <div className="px-4 mt-auto shrink-0">
        <SheetTabs
          sheets={sheets}
          activeSheetId={activeSheetId}
          onSelectSheet={(id) => { setActiveSheetId(id); setFocusedCell(null); setSelectedRowIds(new Set()); setEditingCell(null); }}
          onAddSheet={handleAddSheet}
          onRenameSheet={handleRenameSheet}
          onDeleteSheet={handleDeleteSheet}
        />
      </div>

      {/* ── Modals ── */}
      {showAddColumn && <AddColumnModal onAdd={handleAddColumn} onClose={() => setShowAddColumn(false)} />}

      {/* ── Context menu ── */}
      {contextMenu?.visible && (
        <ContextMenu
          position={contextMenu.position}
          items={getContextItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default SpreadsheetViewV3;
