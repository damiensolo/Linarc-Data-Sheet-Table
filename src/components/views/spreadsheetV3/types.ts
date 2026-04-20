// ─── SpreadsheetV3 Types ───────────────────────────────────────────────────────
// A superset of the V2 BudgetLineItem model with freeform column/sheet support.

export type V3ColumnType = 'text' | 'number' | 'currency' | 'date' | 'formula' | 'select' | 'checkbox';

export interface V3Column {
  id: string;
  label: string;
  type: V3ColumnType;
  width: number;
  align?: 'left' | 'right' | 'center';
  visible?: boolean;
  editable?: boolean;
  isTotal?: boolean;
  /** For 'select' columns: list of options */
  options?: string[];
  /** For 'formula' columns: the formula string e.g. "=labor+material+equipment" */
  formula?: string;
}

export type CellValue = string | number | boolean | null;

export interface V3CellStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface V3Row {
  id: string;
  cells: Record<string, CellValue>;
  style?: V3CellStyle;
  cellStyles?: Record<string, V3CellStyle>;
  children?: V3Row[];
  isExpanded?: boolean;
  isGroup?: boolean;
  level?: number;
}

export interface V3Sheet {
  id: string;
  name: string;
  columns: V3Column[];
  rows: V3Row[];
  frozenColumns?: number;
  showSubtotals?: boolean;
}

export interface V3Selection {
  start: { row: number; col: number };
  end: { row: number; col: number };
}

export type V3Template = 'blank' | 'budget' | 'schedule';

// ─── Formula evaluation ─────────────────────────────────────────────────────

/** Evaluate a formula string like "=labor+material" against a row's cells */
export function evaluateFormula(formula: string, cells: Record<string, CellValue>): CellValue {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1);

  try {
    // Replace column references with their values
    const evalExpr = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
      const val = cells[match];
      if (val === null || val === undefined || val === '') return '0';
      if (typeof val === 'boolean') return val ? '1' : '0';
      return String(val).replace(/,/g, '');
    });

    // Basic SUM function support
    const sumMatch = evalExpr.match(/^SUM\(([^)]+)\)$/i);
    if (sumMatch) {
      const parts = sumMatch[1].split(',').map(s => parseFloat(s.trim()) || 0);
      return parts.reduce((a, b) => a + b, 0);
    }

    // Safe numeric eval
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + evalExpr + ')')();
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch {
    return '#ERR';
  }
}
