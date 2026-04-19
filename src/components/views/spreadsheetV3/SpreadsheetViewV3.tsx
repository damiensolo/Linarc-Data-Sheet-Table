import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { V3Sheet, V3Row, V3Column, V3CellStyle, CellValue, V3Template, evaluateFormula } from './types';
import { createTemplateSheets } from './templates';
import TemplatePicker from './components/TemplatePicker';
import FormulaBar from './components/FormulaBar';
import SheetTabs from './components/SheetTabs';
import V3Header from './components/V3Header';
import V3RowComponent from './components/V3Row';
import SpreadsheetToolbar from '../spreadsheet/components/SpreadsheetToolbar';
import AddColumnModal from './components/AddColumnModal';
import { ContextMenu, ContextMenuItem } from '../../common/ui/ContextMenu';
import {
  PlusIcon, ScissorsIcon, CopyIcon, ClipboardIcon, TrashIcon,
  ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon, XIcon,
  FillColorIcon, IndentIcon, OutdentIcon,
} from '../../common/Icons';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../constants/designTokens';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../constants/spreadsheetLayout';
import { useProject } from '../../../context/ProjectContext';
import { COLUMN_TYPES } from './components/AddColumnModal';
import { V3ColumnType } from './types';

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

// ─── Row tree helpers ─────────────────────────────────────────────────────────
function indentRowInTree(rows: V3Row[], rowId: string): { rows: V3Row[]; newParentId: string } | null {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === rowId) {
      if (i === 0) return null;
      const prev = rows[i - 1];
      const row = rows[i];
      // Preserve the parent's isGroup status — don't force group styling on normal rows
      const newPrev: V3Row = { ...prev, children: [...(prev.children ?? []), row] };
      return { rows: [...rows.slice(0, i - 1), newPrev, ...rows.slice(i + 1)], newParentId: prev.id };
    }
    if (rows[i].children?.length) {
      const result = indentRowInTree(rows[i].children!, rowId);
      if (result) return { rows: rows.map((r, j) => j === i ? { ...r, children: result.rows } : r), newParentId: result.newParentId };
    }
  }
  return null;
}

function outdentRowInTree(rows: V3Row[], rowId: string): V3Row[] | null {
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].children?.length) continue;
    const childIdx = rows[i].children!.findIndex(c => c.id === rowId);
    if (childIdx >= 0) {
      const extracted = rows[i].children![childIdx];
      const newChildren = rows[i].children!.filter((_, j) => j !== childIdx);
      const newParent: V3Row = { ...rows[i], children: newChildren.length > 0 ? newChildren : undefined, isGroup: newChildren.length > 0 };
      return [...rows.slice(0, i), newParent, extracted, ...rows.slice(i + 1)];
    }
    const newChildren = outdentRowInTree(rows[i].children!, rowId);
    if (newChildren !== null) return rows.map((r, j) => j === i ? { ...r, children: newChildren } : r);
  }
  return null;
}

function collectExpandableIdsFromRow(row: V3Row): string[] {
  const ids: string[] = [];
  if (row.children?.length) {
    ids.push(row.id);
    row.children.forEach((child) => {
      ids.push(...collectExpandableIdsFromRow(child));
    });
  }
  return ids;
}

// ─── Main component ──────────────────────────────────────────────────────────
const SpreadsheetViewV3: React.FC = () => {
  const { activeView, updateView } = useProject();

  // ── Sheets stored in the View object so duplication and persistence work ──
  const sheets: V3Sheet[] = activeView.v3Sheets ?? [];
  const showTemplatePicker = !activeView.v3Sheets || activeView.v3Sheets.length === 0;

  const [activeSheetId, setActiveSheetId] = useState<string>(() => activeView.v3ActiveSheetId ?? '');

  // Keep v3ActiveSheetId in sync with local selection
  const handleSetActiveSheetId = useCallback((id: string) => {
    setActiveSheetId(id);
    updateView({ v3ActiveSheetId: id });
  }, [updateView]);

  const handleSelectTemplate = (template: V3Template) => {
    const newSheets = createTemplateSheets(template);
    updateView({ v3Sheets: newSheets, v3ActiveSheetId: newSheets[0].id });
    setActiveSheetId(newSheets[0].id);
  };

  // sheetsRef always holds the latest sheets — lets setSheets be stable (no stale closures)
  const sheetsRef = useRef<V3Sheet[]>(activeView.v3Sheets ?? []);
  sheetsRef.current = activeView.v3Sheets ?? [];

  const setSheets = useCallback((updater: V3Sheet[] | ((prev: V3Sheet[]) => V3Sheet[])) => {
    const next = typeof updater === 'function' ? updater(sheetsRef.current) : updater;
    sheetsRef.current = next;
    updateView({ v3Sheets: next });
  }, [updateView]); // stable — does not depend on activeView.v3Sheets

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
  const [editSource, setEditSource] = useState<'cell' | 'formula' | null>(null);
  const [liveCellEdit, setLiveCellEdit] = useState<{ rowId: string; colId: string; value: string } | null>(null);
  const [clipboard, setClipboard] = useState<V3Row[] | null>(null);
  const [scrollState, setScrollState] = useState({ isAtStart: true, isAtEnd: false, isScrolledTop: false });
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ colId: string; dir: 'asc' | 'desc' } | null>(null);
  const density = (activeView?.displayDensity ?? 'compact') as 'compact' | 'standard' | 'comfortable';
  const fontSize = activeView?.fontSize ?? 12;
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [addRowCount, setAddRowCount] = useState(10);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean; position: { x: number; y: number };
    type: 'row' | 'cell' | 'column';
    rowId?: string; colId?: string;
  } | null>(null);

  // Column selection
  const [selectedColId, setSelectedColId] = useState<string | null>(null);

  // Cell-level clipboard (for cut/copy/paste of cell values)
  const [cellClipboard, setCellClipboard] = useState<{ grid: (CellValue | null)[][]; colIds: string[] } | null>(null);

  // Range selection (shift-click / mouse drag)
  const [rangeAnchor, setRangeAnchor] = useState<{ rowId: string; colId: string } | null>(null);
  const [rangeEnd, setRangeEnd] = useState<{ rowId: string; colId: string } | null>(null);
  const isDragging = useRef(false);

  // Fill handle
  const [fillAnchor, setFillAnchor] = useState<{ rowId: string; colId: string } | null>(null);
  const [fillRangeRowIds, setFillRangeRowIds] = useState<Set<string>>(new Set());
  const isFillDragging = useRef(false);
  const fillJustApplied = useRef(false);
  const applyFillRef = useRef<() => void>(() => {});

  // Undo / Redo
  const undoStack = useRef<V3Row[][]>([]);
  const redoStack = useRef<V3Row[][]>([]);

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

  // Restore keyboard focus only when no text input currently owns focus.
  useEffect(() => {
    if (!editingCell && editSource !== 'formula' && containerRef.current) {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTextInputActive =
        !!activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
      if (!isTextInputActive) {
        containerRef.current.focus({ preventScroll: true });
      }
    }
  }, [editingCell, editSource]);

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

  // ── Undo / Redo ────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!undoStack.current.length || !activeSheet) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    setSheets(s => s.map(sh => sh.id === activeSheetId ? { ...sh, rows: prev } : sh));
  }, [activeSheet, activeSheetId]);

  const handleRedo = useCallback(() => {
    if (!redoStack.current.length || !activeSheet) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    setSheets(s => s.map(sh => sh.id === activeSheetId ? { ...sh, rows: next } : sh));
  }, [activeSheet, activeSheetId]);

  // ── Fill handle ────────────────────────────────────────────────────────
  const handleFillHandleMouseDown = useCallback((rowId: string, colId: string) => {
    isFillDragging.current = true;
    setFillAnchor({ rowId, colId });
    setFillRangeRowIds(new Set());
  }, []);

  const handleFillRowEnter = useCallback((rowId: string) => {
    if (!isFillDragging.current || !fillAnchor) return;
    const anchorIdx = flatRows.findIndex(f => f.row.id === fillAnchor.rowId);
    const endIdx = flatRows.findIndex(f => f.row.id === rowId);
    if (anchorIdx < 0 || endIdx <= anchorIdx) { setFillRangeRowIds(new Set()); return; }
    const ids = new Set<string>();
    for (let i = anchorIdx + 1; i <= endIdx; i++) {
      if (!flatRows[i].isSummary) ids.add(flatRows[i].row.id);
    }
    setFillRangeRowIds(ids);
  }, [fillAnchor, flatRows]);

  // Keep applyFillRef up to date so the stable mouseup handler can call it
  useEffect(() => {
    applyFillRef.current = () => {
      if (!fillAnchor || fillRangeRowIds.size === 0) return;
      const { rowId, colId } = fillAnchor;
      const sourceRow = flatRows.find(f => f.row.id === rowId);
      if (!sourceRow) return;
      const value = sourceRow.row.cells[colId] ?? null;
      undoStack.current.push(JSON.parse(JSON.stringify(activeSheet?.rows ?? [])));
      if (undoStack.current.length > 100) undoStack.current.shift();
      redoStack.current = [];
      updateRows(rows => {
        const apply = (items: V3Row[]): V3Row[] => items.map(r => {
          if (fillRangeRowIds.has(r.id)) return { ...r, cells: { ...r.cells, [colId]: value } };
          return { ...r, children: r.children ? apply(r.children) : undefined };
        });
        return apply(rows);
      });
      setFillAnchor(null);
      setFillRangeRowIds(new Set());
    };
  }, [fillAnchor, fillRangeRowIds, flatRows, activeSheet, updateRows]);

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

  const handleIndentRow = useCallback((rowId: string) => {
    const rows = sheetsRef.current.find(s => s.id === activeSheetId)?.rows;
    if (!rows) return;
    const result = indentRowInTree(rows, rowId);
    if (!result) return;
    updateRows(() => result.rows);
    setExpandedIds(prev => new Set([...prev, result.newParentId]));
  }, [activeSheetId, updateRows]);

  const handleOutdentRow = useCallback((rowId: string) => {
    const rows = sheetsRef.current.find(s => s.id === activeSheetId)?.rows;
    if (!rows) return;
    const newRows = outdentRowInTree(rows, rowId);
    if (newRows) updateRows(() => newRows);
  }, [activeSheetId, updateRows]);

  const handleUpdateCell = useCallback((rowId: string, colId: string, value: CellValue, direction?: 'up' | 'down' | 'left' | 'right') => {
    // Snapshot for undo before applying change
    if (activeSheet) {
      undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
      if (undoStack.current.length > 100) undoStack.current.shift();
      redoStack.current = [];
    }

    const update = (rows: V3Row[]): V3Row[] => rows.map(r => {
      if (r.id === rowId) return { ...r, cells: { ...r.cells, [colId]: value } };
      return { ...r, children: r.children ? update(r.children) : undefined };
    });
    updateRows(update);
    setEditingCell(null);
    setEditSource(null);
    setLiveCellEdit(null);

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
  }, [flatRows, columns, focusedCell, updateRows, activeSheet]);

  const getCellDisplayValue = useCallback((rowId: string, colId: string): string => {
    const row = flatRows.find(f => f.row.id === rowId && !f.isSummary)?.row;
    const col = columns.find(c => c.id === colId);
    if (!row || !col) return '';
    if (col.type === 'formula' && col.formula) return col.formula;
    const raw = row.cells[colId];
    return raw === null || raw === undefined ? '' : String(raw);
  }, [flatRows, columns]);

  useEffect(() => {
    if (!editingCell) {
      setEditSource(null);
      setLiveCellEdit(null);
      return;
    }
    const seed = editingCell.initial ?? getCellDisplayValue(editingCell.rowId, editingCell.colId);
    setLiveCellEdit({ rowId: editingCell.rowId, colId: editingCell.colId, value: seed });
  }, [editingCell, getCellDisplayValue]);

  const handleLiveCellEditChange = useCallback((rowId: string, colId: string, value: string) => {
    setLiveCellEdit({ rowId, colId, value });
  }, []);

  const handleFormulaBarStartEdit = useCallback((rowId: string, colId: string) => {
    setFocusedCell({ rowId, colId });
    setEditSource('formula');
    setEditingCell(prev => prev?.rowId === rowId && prev?.colId === colId ? prev : { rowId, colId });
    setLiveCellEdit({ rowId, colId, value: getCellDisplayValue(rowId, colId) });
  }, [getCellDisplayValue]);

  // ── Cell focus/click ───────────────────────────────────────────────────
  const handleCellClick = (rowId: string, colId: string, e: React.MouseEvent) => {
    // Swallow the click that follows a fill-drag mouseup
    if (fillJustApplied.current) { fillJustApplied.current = false; return; }

    if (e.shiftKey && rangeAnchor) {
      setRangeEnd({ rowId, colId });
      setEditingCell(null);
      return;
    }
    setFocusedCell({ rowId, colId });
    setRangeAnchor({ rowId, colId });
    setRangeEnd(null);
    setSelectedRowIds(new Set());
    setLiveCellEdit(null);
    setEditSource(null);
    setEditingCell(null);
  };

  const handleCellMouseDown = (rowId: string, colId: string, e: React.MouseEvent) => {
    if (e.button !== 0 || isFillDragging.current) return;
    isDragging.current = true;
    setRangeAnchor({ rowId, colId });
    setRangeEnd(null);
    setFocusedCell({ rowId, colId });
  };

  const handleCellMouseEnter = (rowId: string, colId: string) => {
    if (isFillDragging.current) return;
    if (isDragging.current) setRangeEnd({ rowId, colId });
  };

  // Stable global mouseup — handles both range selection and fill drag
  useEffect(() => {
    const up = () => {
      isDragging.current = false;
      if (isFillDragging.current) {
        applyFillRef.current();
        isFillDragging.current = false;
        fillJustApplied.current = true;
        // Clear the flag after click events have had a chance to fire
        setTimeout(() => { fillJustApplied.current = false; }, 100);
      }
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === 'z') { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); return; }
      if (e.key === 'y') { e.preventDefault(); handleRedo(); return; }
      if (e.key === 'c') {
        e.preventDefault();
        if (selectedColId) handleCopyColumn(selectedColId); else handleCellCopy(false);
        return;
      }
      if (e.key === 'x') {
        e.preventDefault();
        if (selectedColId) handleCutColumn(selectedColId); else handleCellCopy(true);
        return;
      }
      if (e.key === 'v') {
        e.preventDefault();
        if (selectedColId) handlePasteColumn(selectedColId); else handleCellPaste();
        return;
      }
    }

    if (editingCell) return;

    // Column selected — only handle escape/delete
    if (selectedColId) {
      if (e.key === 'Escape') { setSelectedColId(null); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleClearColumn(selectedColId); return; }
      return;
    }

    if (!focusedCell) return;

    const rIdx = flatRows.findIndex(f => f.row.id === focusedCell.rowId);
    const cIdx = columns.findIndex(c => c.id === focusedCell.colId);
    if (rIdx < 0 || cIdx < 0) return;
    const focusedFlatRow = flatRows[rIdx];
    if (!focusedFlatRow || focusedFlatRow.isSummary) return;
    const focusedRowId = focusedFlatRow.row.id;

    const moveTo = (nr: number, nc: number) => {
      const nextRow = flatRows[Math.max(0, Math.min(flatRows.length - 1, nr))];
      const nextCol = columns[Math.max(0, Math.min(columns.length - 1, nc))];
      setFocusedCell({ rowId: nextRow.row.id, colId: nextCol.id });
      return { nextRow, nextCol };
    };

    const move = (dr: number, dc: number) => {
      e.preventDefault();
      let nr = rIdx + dr, nc = cIdx + dc;
      if (e.key === 'Tab' && !e.shiftKey && nc >= columns.length) { nc = 0; nr++; }
      if (e.key === 'Tab' && e.shiftKey && nc < 0) { nc = columns.length - 1; nr--; }
      const { nextRow, nextCol } = moveTo(nr, nc);
      if (e.shiftKey && e.key !== 'Tab') setRangeEnd({ rowId: nextRow.row.id, colId: nextCol.id });
    };

    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === ']') {
      e.preventDefault();
      handleIndentRow(focusedRowId);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === '[') {
      e.preventDefault();
      handleOutdentRow(focusedRowId);
      return;
    }

    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      const ids = collectExpandableIdsFromRow(focusedFlatRow.row);
      if (!ids.length) return;
      setExpandedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      return;
    }

    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      const ids = collectExpandableIdsFromRow(focusedFlatRow.row);
      if (!ids.length) return;
      setExpandedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
      return;
    }

    if (e.shiftKey && e.key === ' ') {
      e.preventDefault();
      setSelectedRowIds(prev => {
        const next = new Set(prev);
        if (next.has(focusedRowId)) next.delete(focusedRowId);
        else next.add(focusedRowId);
        return next;
      });
      return;
    }

    switch (e.key) {
      case 'ArrowUp':    move(-1, 0); break;
      case 'ArrowDown':  move(1, 0); break;
      case 'ArrowLeft':  move(0, -1); break;
      case 'ArrowRight': move(0, 1); break;
      case 'Tab': {
        e.preventDefault();
        let nr = rIdx, nc = cIdx + (e.shiftKey ? -1 : 1);
        if (!e.shiftKey && nc >= columns.length) { nc = 0; nr++; }
        if (e.shiftKey && nc < 0) { nc = columns.length - 1; nr--; }
        nr = Math.max(0, Math.min(flatRows.length - 1, nr));
        nc = Math.max(0, Math.min(columns.length - 1, nc));
        setFocusedCell({ rowId: flatRows[nr].row.id, colId: columns[nc].id });
        if (columns[nc].editable && columns[nc].type !== 'formula' && !flatRows[nr].isSummary) {
          setEditSource('cell');
          setEditingCell({ rowId: flatRows[nr].row.id, colId: columns[nc].id });
        }
        break;
      }
      case 'Enter':
        e.preventDefault();
        move(1, 0);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (rangeSet) {
          clearCellsInRange();
        } else if (columns[cIdx]?.editable && !flatRows[rIdx].isSummary) {
          handleUpdateCell(flatRows[rIdx].row.id, columns[cIdx].id, null);
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const col = columns[cIdx];
          if (col?.editable && !flatRows[rIdx].isSummary) {
            setEditSource('cell');
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

  // ── Column selection & operations ─────────────────────────────────────────
  const handleColumnHeaderClick = useCallback((colId: string) => {
    setSelectedColId(prev => prev === colId ? null : colId);
    setRangeAnchor(null);
    setRangeEnd(null);
    setSelectedRowIds(new Set());
    setFocusedCell(null);
    setEditingCell(null);
    setEditSource(null);
  }, []);

  const handleUpdateColumn = useCallback((colId: string, updates: Partial<Omit<V3Column, 'id'>>) => {
    updateSheet({ columns: (activeSheet?.columns ?? []).map(c => c.id === colId ? { ...c, ...updates } : c) });
  }, [activeSheet, updateSheet]);

  const handleRenameColumn = useCallback((colId: string, newLabel: string) => {
    handleUpdateColumn(colId, { label: newLabel });
  }, [handleUpdateColumn]);

  const handleAddManyRows = useCallback(() => {
    const count = Math.max(1, Math.min(1000, addRowCount));
    const newRows: V3Row[] = Array.from({ length: count }, () => ({ id: uid('row'), cells: {} }));
    updateRows(rows => [...rows, ...newRows]);
    setTimeout(() => scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight), 60);
  }, [addRowCount, updateRows]);

  const handleInsertColumnLeft = useCallback((colId: string) => {
    const cols = [...(activeSheet?.columns ?? [])];
    const idx = cols.findIndex(c => c.id === colId);
    if (idx < 0) return;
    const newCol: V3Column = { id: uid('col'), label: `Col ${cols.length + 1}`, type: 'text', width: 150, editable: true, visible: true };
    cols.splice(idx, 0, newCol);
    updateSheet({ columns: cols });
  }, [activeSheet, updateSheet]);

  const handleInsertColumnRight = useCallback((colId: string) => {
    const cols = [...(activeSheet?.columns ?? [])];
    const idx = cols.findIndex(c => c.id === colId);
    if (idx < 0) return;
    const newCol: V3Column = { id: uid('col'), label: `Col ${cols.length + 1}`, type: 'text', width: 150, editable: true, visible: true };
    cols.splice(idx + 1, 0, newCol);
    updateSheet({ columns: cols });
  }, [activeSheet, updateSheet]);

  const handleDeleteColumn = useCallback((colId: string) => {
    updateSheet({ columns: (activeSheet?.columns ?? []).filter(c => c.id !== colId) });
    setSelectedColId(prev => prev === colId ? null : prev);
  }, [activeSheet, updateSheet]);

  const handleClearColumn = useCallback((colId: string) => {
    if (!activeSheet) return;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];
    updateRows(rows => {
      const clear = (items: V3Row[]): V3Row[] => items.map(r => ({
        ...r, cells: { ...r.cells, [colId]: null },
        children: r.children ? clear(r.children) : undefined,
      }));
      return clear(rows);
    });
  }, [activeSheet, updateRows]);

  const handleCopyColumn = useCallback((colId: string) => {
    const allRows = flatRows.filter(f => !f.isSummary);
    setCellClipboard({ grid: allRows.map(f => [f.row.cells[colId] ?? null]), colIds: [colId] });
  }, [flatRows]);

  const handleCutColumn = useCallback((colId: string) => {
    handleCopyColumn(colId);
    handleClearColumn(colId);
  }, [handleCopyColumn, handleClearColumn]);

  const handlePasteColumn = useCallback((colId: string) => {
    if (!cellClipboard || !activeSheet) return;
    const col = columns.find(c => c.id === colId);
    if (!col?.editable || col.type === 'formula') return;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];
    const nonSummaryRows = flatRows.filter(f => !f.isSummary);
    const updates: Record<string, CellValue | null> = {};
    cellClipboard.grid.forEach((rowData, ri) => {
      const target = nonSummaryRows[ri];
      if (target) updates[target.row.id] = rowData[0] ?? null;
    });
    updateRows(rows => {
      const apply = (items: V3Row[]): V3Row[] => items.map(r => {
        let next = r;
        if (r.id in updates) next = { ...r, cells: { ...r.cells, [colId]: updates[r.id] } };
        if (next.children) next = { ...next, children: apply(next.children) };
        return next;
      });
      return apply(rows);
    });
  }, [cellClipboard, activeSheet, columns, flatRows, updateRows]);

  // ── Cell clipboard (range) ─────────────────────────────────────────────────
  const getCellsInRange = useCallback((): { grid: (CellValue | null)[][]; colIds: string[] } | null => {
    if (rangeSet) {
      const rowsSlice = flatRows.slice(rangeSet.r0, rangeSet.r1 + 1);
      const colsSlice = columns.slice(rangeSet.c0, rangeSet.c1 + 1);
      return { grid: rowsSlice.map(f => colsSlice.map(c => f.row.cells[c.id] ?? null)), colIds: colsSlice.map(c => c.id) };
    }
    if (focusedCell) {
      const flat = flatRows.find(f => f.row.id === focusedCell.rowId);
      if (!flat) return null;
      return { grid: [[flat.row.cells[focusedCell.colId] ?? null]], colIds: [focusedCell.colId] };
    }
    return null;
  }, [rangeSet, flatRows, columns, focusedCell]);

  const clearCellsInRange = useCallback(() => {
    if (rangeSet) {
      const rows = flatRows.slice(rangeSet.r0, rangeSet.r1 + 1).filter(f => !f.isSummary);
      const cols = columns.slice(rangeSet.c0, rangeSet.c1 + 1).filter(c => c.editable && c.type !== 'formula');
      if (!rows.length || !cols.length) return;
      const rowIds = new Set(rows.map(f => f.row.id));
      const colIds = new Set(cols.map(c => c.id));
      if (activeSheet) { undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows))); redoStack.current = []; }
      updateRows(all => {
        const clear = (items: V3Row[]): V3Row[] => items.map(r => {
          let next = r;
          if (rowIds.has(r.id)) {
            const cells = { ...r.cells };
            colIds.forEach((cid: string) => { cells[cid] = null; });
            next = { ...r, cells };
          }
          if (next.children) next = { ...next, children: clear(next.children) };
          return next;
        });
        return clear(all);
      });
    } else if (focusedCell) {
      const col = columns.find(c => c.id === focusedCell.colId);
      if (col?.editable && col.type !== 'formula') handleUpdateCell(focusedCell.rowId, focusedCell.colId, null);
    }
  }, [rangeSet, flatRows, columns, focusedCell, activeSheet, updateRows, handleUpdateCell]);

  const handleCellCopy = useCallback((cut = false) => {
    const data = getCellsInRange();
    if (!data) return;
    setCellClipboard(data);
    if (cut) clearCellsInRange();
  }, [getCellsInRange, clearCellsInRange]);

  const handleCellPaste = useCallback((targetRowId?: string, targetColId?: string) => {
    if (!cellClipboard) return;
    const pasteRowId = targetRowId ?? focusedCell?.rowId;
    const pasteColId = targetColId ?? focusedCell?.colId;
    if (!pasteRowId || !pasteColId || !activeSheet) return;
    const startRowIdx = flatRows.findIndex(f => f.row.id === pasteRowId);
    const startColIdx = columns.findIndex(c => c.id === pasteColId);
    if (startRowIdx < 0 || startColIdx < 0) return;
    undoStack.current.push(JSON.parse(JSON.stringify(activeSheet.rows)));
    redoStack.current = [];
    const updates: Record<string, Record<string, CellValue | null>> = {};
    cellClipboard.grid.forEach((rowData, ri) => {
      const target = flatRows[startRowIdx + ri];
      if (!target || target.isSummary) return;
      rowData.forEach((val, ci) => {
        const targetCol = columns[startColIdx + ci];
        if (!targetCol?.editable || targetCol.type === 'formula') return;
        if (!updates[target.row.id]) updates[target.row.id] = {};
        updates[target.row.id][targetCol.id] = val;
      });
    });
    updateRows(rows => {
      const apply = (items: V3Row[]): V3Row[] => items.map(r => {
        let next = r;
        if (updates[r.id]) next = { ...r, cells: { ...r.cells, ...updates[r.id] } };
        if (next.children) next = { ...next, children: apply(next.children) };
        return next;
      });
      return apply(rows);
    });
  }, [cellClipboard, focusedCell, flatRows, columns, activeSheet, updateRows]);

  // Direct cell copy for context menu (bypasses range state)
  const contextMenuCellCopy = useCallback((rowId: string, colId: string, cut = false) => {
    const flat = flatRows.find(f => f.row.id === rowId);
    if (!flat) return;
    setCellClipboard({ grid: [[flat.row.cells[colId] ?? null]], colIds: [colId] });
    if (cut) {
      const col = columns.find(c => c.id === colId);
      if (col?.editable && col.type !== 'formula') handleUpdateCell(rowId, colId, null);
    }
  }, [flatRows, columns, handleUpdateCell]);

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
    handleSetActiveSheetId(s.id);
  };

  const handleRenameSheet = (id: string, name: string) => setSheets(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  const handleDeleteSheet = (id: string) => {
    setSheets(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeSheetId === id && next.length) handleSetActiveSheetId(next[0].id);
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

    // ── Column context menu ───────────────────────────────────────────────
    if (type === 'column' && colId) {
      const currentCol = columns.find(c => c.id === colId);
      return [
        { label: 'Cut column',         icon: <ScissorsIcon className="w-4 h-4" />,    shortcut: '⌘X', onClick: () => handleCutColumn(colId) },
        { label: 'Copy column',        icon: <CopyIcon className="w-4 h-4" />,         shortcut: '⌘C', onClick: () => handleCopyColumn(colId) },
        { label: 'Paste into column',  icon: <ClipboardIcon className="w-4 h-4" />,   shortcut: '⌘V', disabled: !cellClipboard, onClick: () => handlePasteColumn(colId) },
        { separator: true } as any,
        { label: 'Insert column left',  icon: <ChevronLeftIcon className="w-4 h-4" />,  onClick: () => handleInsertColumnLeft(colId) },
        { label: 'Insert column right', icon: <ChevronRightIcon className="w-4 h-4" />, onClick: () => handleInsertColumnRight(colId) },
        { separator: true } as any,
        { label: 'Sort A → Z', icon: <ArrowUpIcon className="w-4 h-4" />,   onClick: () => setSort({ colId, dir: 'asc' }) },
        { label: 'Sort Z → A', icon: <ArrowDownIcon className="w-4 h-4" />, onClick: () => setSort({ colId, dir: 'desc' }) },
        { separator: true } as any,
        // ── Column type inline picker ─────────────────────────────────
        {
          label: 'Column Type', onClick: () => {},
          render: (onClose: () => void) => (
            <div className="px-3 py-2">
              <div className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Column Type</div>
              <div className="grid grid-cols-4 gap-1">
                {COLUMN_TYPES.map(ct => (
                  <button
                    key={ct.id}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-center text-[10px] transition-all border
                      ${currentCol?.type === ct.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                      }`}
                    onClick={() => {
                      if (ct.id === 'formula' || ct.id === 'select') {
                        setEditingColumnId(colId);
                      } else {
                        handleUpdateColumn(colId, {
                          type: ct.id,
                          editable: true,
                          align: (ct.id === 'number' || ct.id === 'currency') ? 'right' : 'left',
                          isTotal: ct.id === 'currency' || ct.id === 'number',
                        });
                      }
                      onClose();
                    }}
                  >
                    <span className="text-sm leading-none">{ct.icon}</span>
                    <span className="font-medium">{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ),
        } as any,
        {
          label: 'Edit Column…', icon: <span className="w-4 h-4 flex items-center justify-center text-gray-500 text-xs">✎</span>,
          onClick: () => setEditingColumnId(colId),
        },
        { separator: true } as any,
        { label: 'Clear column',  icon: <XIcon className="w-4 h-4" />,      onClick: () => handleClearColumn(colId) },
        { label: 'Delete column', icon: <TrashIcon className="w-4 h-4" />,  danger: true, onClick: () => handleDeleteColumn(colId) },
      ];
    }

    // ── Cell context menu ─────────────────────────────────────────────────
    if (type === 'cell' && rowId && colId) {
      return [
        { label: 'Cut',   icon: <ScissorsIcon className="w-4 h-4" />,   shortcut: '⌘X', onClick: () => contextMenuCellCopy(rowId, colId, true) },
        { label: 'Copy',  icon: <CopyIcon className="w-4 h-4" />,        shortcut: '⌘C', onClick: () => contextMenuCellCopy(rowId, colId, false) },
        { label: 'Paste', icon: <ClipboardIcon className="w-4 h-4" />,  shortcut: '⌘V', disabled: !cellClipboard, onClick: () => handleCellPaste(rowId, colId) },
        { separator: true } as any,
        { label: 'Clear cell', icon: <XIcon className="w-4 h-4" />, onClick: () => handleUpdateCell(rowId, colId, null) },
        { separator: true } as any,
        { label: 'Insert row above', icon: <ArrowUpIcon className="w-4 h-4" />,   onClick: () => handleInsertRow(rowId) },
        { label: 'Insert row below', icon: <ArrowDownIcon className="w-4 h-4" />, onClick: () => handleInsertRow(rowId) },
        { label: 'Add child row',    icon: <PlusIcon className="w-4 h-4" />,      onClick: () => handleAddSubRow(rowId) },
        { separator: true } as any,
        { label: 'Indent row',  shortcut: '⌘]',  icon: <IndentIcon className="w-4 h-4" />,  onClick: () => handleIndentRow(rowId) },
        { label: 'Outdent row', shortcut: '⌘[', icon: <OutdentIcon className="w-4 h-4" />, onClick: () => handleOutdentRow(rowId) },
        { separator: true } as any,
        {
          label: 'Background Color', icon: <FillColorIcon className="w-4 h-4 text-gray-600" />, onClick: () => {},
          render: (onClose) => (
            <div className="px-3 py-2">
              <div className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Background</div>
              <div className="flex flex-wrap gap-1">
                <button className="w-5 h-5 rounded border border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-100 font-bold"
                  onClick={() => { handleStyleUpdate({ backgroundColor: undefined }, new Set([rowId])); onClose(); }}>✕</button>
                {BACKGROUND_COLORS.map(c => (
                  <button key={c} className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => { handleStyleUpdate({ backgroundColor: c }, new Set([rowId])); onClose(); }} />
                ))}
              </div>
            </div>
          ),
        } as any,
        { separator: true } as any,
        { label: 'Delete row', icon: <TrashIcon className="w-4 h-4" />, danger: true, onClick: () => handleDeleteRows(new Set([rowId])) },
      ];
    }

    // ── Row context menu (row number click) ──────────────────────────────
    if (rowId) {
      return [
        { label: 'Insert row above', icon: <ArrowUpIcon className="w-4 h-4" />,   onClick: () => handleInsertRow(rowId) },
        { label: 'Insert row below', icon: <ArrowDownIcon className="w-4 h-4" />, onClick: () => handleInsertRow(rowId) },
        { label: 'Add child row',    icon: <PlusIcon className="w-4 h-4" />,      onClick: () => handleAddSubRow(rowId) },
        { separator: true } as any,
        { label: 'Indent row',  icon: <IndentIcon className="w-4 h-4" />,  onClick: () => handleIndentRow(rowId) },
        { label: 'Outdent row', icon: <OutdentIcon className="w-4 h-4" />, onClick: () => handleOutdentRow(rowId) },
        { separator: true } as any,
        {
          label: 'Background Color', icon: <FillColorIcon className="w-4 h-4 text-gray-600" />, onClick: () => {},
          render: (onClose) => (
            <div className="px-3 py-2">
              <div className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Background</div>
              <div className="flex flex-wrap gap-1">
                <button className="w-5 h-5 rounded border border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-100 font-bold"
                  onClick={() => { handleStyleUpdate({ backgroundColor: undefined }, new Set([rowId])); onClose(); }}>✕</button>
                {BACKGROUND_COLORS.map(c => (
                  <button key={c} className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => { handleStyleUpdate({ backgroundColor: c }, new Set([rowId])); onClose(); }} />
                ))}
              </div>
            </div>
          ),
        } as any,
        { separator: true } as any,
        { label: 'Delete row', icon: <TrashIcon className="w-4 h-4" />, danger: true, onClick: () => handleDeleteRows(new Set([rowId])) },
      ];
    }

    return [];
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
      className="flex flex-col h-full px-4 pt-[7px] pb-[7px] outline-none focus:ring-0 overflow-hidden gap-[7px]"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => { isDragging.current = false; }}
    >
      {/* ── Toolbar (reuses shared SpreadsheetToolbar) ── */}
      <div className="flex items-center gap-2">
        <SpreadsheetToolbar
          isAllSelected={isAllSelected}
          handleToggleAll={() => {
            if (isAllSelected) setSelectedRowIds(new Set());
            else setSelectedRowIds(new Set(selectableFlat.map(f => f.row.id)));
          }}
          toolbarCheckboxRef={checkboxRef}
          hasRowSelection={selectedRowIds.size > 0}
          selectedCount={selectedRowIds.size}
          onStyleUpdate={(style) => handleStyleUpdate(style as Partial<V3CellStyle>)}
          onCut={() => handleCut()}
          onCopy={() => handleCopy()}
          onPaste={() => handlePaste()}
          onDelete={() => handleDeleteRows(selectedRowIds)}
          onDeselectAll={() => setSelectedRowIds(new Set())}
        />
      </div>

      {/* ── Table card ── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col focus:outline-none max-h-full min-h-0 flex-grow">

        {/* ── Formula bar ── */}
        <FormulaBar
          selection={formulaBarSelection}
          rows={flatRows.map(f => f.row)}
          columns={columns}
          liveEdit={liveCellEdit}
          onStartEdit={handleFormulaBarStartEdit}
          onLiveChange={handleLiveCellEditChange}
          onCommit={handleFormulaBarCommit}
        />

        {/* ── Main scroll area ── */}
        <div className="overflow-auto relative select-none focus:outline-none min-h-0 flex-grow" ref={scrollRef}>
          <table className="border-collapse min-w-max table-fixed" style={{ fontSize }}>
            <V3Header
              columns={columns}
              focusedColId={focusedCell?.colId ?? null}
              selectedColId={selectedColId}
              resizingColumnId={resizingColId}
              sort={sort}
              isScrolled={!scrollState.isAtStart}
              isAtEnd={scrollState.isAtEnd}
              isVerticalScrolled={scrollState.isScrolledTop}
              fontSize={fontSize}
              displayDensity={density}
              onColumnHeaderClick={handleColumnHeaderClick}
              onRenameColumn={handleRenameColumn}
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
              {flatRows.map(({ row, level, isSummary }, globalIdx) => (
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
                  selectedColId={selectedColId}
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
                  fillAnchorCell={fillAnchor}
                  fillRangeRowIds={fillRangeRowIds}
                  onCellClick={handleCellClick}
                  onUpdateCell={handleUpdateCell}
                  onContextMenu={(e, type, rowId, colId) => handleContextMenu(e, type, rowId, colId)}
                  onCellMouseDown={handleCellMouseDown}
                  onCellMouseEnter={handleCellMouseEnter}
                  onFillHandleMouseDown={handleFillHandleMouseDown}
                  onRowMouseEnter={handleFillRowEnter}
                  liveEdit={liveCellEdit}
                  activeEditSource={editSource}
                  onLiveEditChange={handleLiveCellEditChange}
                  onStopEdit={() => { setEditingCell(null); setEditSource(null); setLiveCellEdit(null); }}
                />
              ))}
            </tbody>

            {/* ── Totals footer ── */}
            <tfoot className="bg-gray-100 text-gray-900 border-t-2 border-gray-300 sticky bottom-0 z-30 font-bold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <tr className="h-9">
                <td
                  className={`sticky left-0 z-40 border-r border-gray-300 text-center bg-gray-100 ${!scrollState.isAtStart ? 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}
                  style={{ width: SPREADSHEET_INDEX_COLUMN_WIDTH, minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, fontSize }}
                >
                  Total
                </td>
                {columns.map(col => (
                  <td key={col.id}
                    className={`border-r border-gray-300 px-2 bg-gray-100 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    style={{ width: col.width, fontSize }}
                  >
                    {col.isTotal && totals[col.id] !== undefined
                      ? (col.type === 'number' ? totals[col.id].toLocaleString() : formatCurrency(totals[col.id]))
                      : ''}
                  </td>
                ))}
                <td className="bg-gray-100 border-r border-gray-300" style={{ width: 44 }} />
                <td
                  className={`sticky right-0 z-40 border-l border-gray-200 bg-gray-100 w-20 ${!scrollState.isAtEnd ? 'shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}
                />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Add row / Add more rows ── */}
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-4 flex-wrap">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            <div className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center">
              <PlusIcon className="w-2.5 h-2.5" />
            </div>
            Add row
          </button>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>Add</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={addRowCount}
              onChange={e => setAddRowCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-center text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <span>more rows</span>
            <button
              onClick={handleAddManyRows}
              className="px-2.5 py-0.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded font-medium transition-colors border border-blue-200 hover:border-blue-400"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* ── Sheet tabs ── */}
      <SheetTabs
        sheets={sheets}
        activeSheetId={activeSheetId}
        onSelectSheet={(id) => { handleSetActiveSheetId(id); setFocusedCell(null); setSelectedRowIds(new Set()); setEditingCell(null); setEditSource(null); setLiveCellEdit(null); }}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
      />

      {/* ── Modals ── */}
      {showAddColumn && (
        <AddColumnModal onAdd={handleAddColumn} onClose={() => setShowAddColumn(false)} />
      )}
      {editingColumnId && (() => {
        const col = columns.find(c => c.id === editingColumnId);
        if (!col) return null;
        return (
          <AddColumnModal
            mode="edit"
            initialValues={{ label: col.label, type: col.type, formula: col.formula, options: col.options }}
            onAdd={(updates) => {
              handleUpdateColumn(editingColumnId, updates);
              setEditingColumnId(null);
            }}
            onClose={() => setEditingColumnId(null)}
          />
        );
      })()}

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
