import React, { useState, useEffect, useRef } from 'react';
import { V3Column, V3Row, CellValue, evaluateFormula } from '../types';

interface FormulaBarProps {
  selection: { rowIdx: number; colIdx: number } | null;
  rows: V3Row[];
  columns: V3Column[];
  onCommit: (rowId: string, colId: string, value: CellValue) => void;
}

function getCellLabel(colIdx: number, rowIdx: number): string {
  // Col label: A, B, ... Z, AA, AB, ...
  let col = '';
  let n = colIdx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return `${col}${rowIdx + 1}`;
}

const FormulaBar: React.FC<FormulaBarProps> = ({ selection, rows, columns, onCommit }) => {
  const [formula, setFormula] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatRows = React.useMemo(() => {
    const result: V3Row[] = [];
    const flatten = (items: V3Row[]) => {
      items.forEach(r => {
        result.push(r);
        if (r.isExpanded && r.children) flatten(r.children);
      });
    };
    flatten(rows);
    return result;
  }, [rows]);

  const selectedRow = selection !== null ? flatRows[selection.rowIdx] : null;
  const selectedCol = selection !== null ? columns[selection.colIdx] : null;
  const cellLabel = selection ? getCellLabel(selection.colIdx, selection.rowIdx) : '';

  useEffect(() => {
    if (!selection || !selectedRow || !selectedCol) { setFormula(''); return; }
    // Show formula string for formula columns, raw value otherwise
    if (selectedCol.type === 'formula' && selectedCol.formula) {
      setFormula(selectedCol.formula);
    } else {
      const raw = selectedRow.cells[selectedCol.id];
      setFormula(raw === null || raw === undefined ? '' : String(raw));
    }
    setIsEditing(false);
  }, [selection, flatRows, selectedCol]);

  const handleCommit = () => {
    if (!selectedRow || !selectedCol) return;
    setIsEditing(false);
    const isNum = selectedCol.type === 'number' || selectedCol.type === 'currency';
    const val = formula.startsWith('=') ? formula : isNum ? (parseFloat(formula.replace(/,/g, '')) || null) : formula;
    onCommit(selectedRow.id, selectedCol.id, val);
  };

  return (
    <div className="flex items-center h-9 border-b border-gray-200 bg-white select-none">
      {/* Cell address box */}
      <div className="flex items-center justify-center h-full w-[90px] border-r border-gray-200 px-2 shrink-0">
        <span className="text-xs font-mono font-semibold text-gray-600 tracking-wider">
          {cellLabel || '—'}
        </span>
      </div>

      {/* fx label */}
      <div className="flex items-center justify-center h-full w-8 border-r border-gray-200 shrink-0">
        <span className="text-[11px] italic text-gray-400 font-serif">fx</span>
      </div>

      {/* Formula input */}
      <input
        ref={inputRef}
        value={formula}
        disabled={!selection || !selectedCol?.editable}
        onChange={(e) => { setFormula(e.target.value); setIsEditing(true); }}
        onFocus={() => setIsEditing(true)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); handleCommit(); }
          if (e.key === 'Escape') { setIsEditing(false); setFormula(''); }
        }}
        placeholder={selection ? (selectedCol?.editable ? 'Enter value or formula (e.g. =labor+material)' : 'Read-only formula') : 'Select a cell'}
        className={`flex-1 h-full px-3 text-xs font-mono text-gray-800 outline-none bg-transparent transition-colors
          ${isEditing ? 'bg-blue-50' : ''}
          ${!selection ? 'text-gray-400' : ''}
          ${formula.startsWith('=') ? 'text-blue-700' : ''}
        `}
      />
    </div>
  );
};

export default FormulaBar;
