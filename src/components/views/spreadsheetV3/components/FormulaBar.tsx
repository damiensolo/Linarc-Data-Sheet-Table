import React, { useState, useEffect, useRef } from 'react';
import { V3Column, V3Row, CellValue, evaluateFormula } from '../types';

interface FormulaBarProps {
  selection: { rowIdx: number; colIdx: number } | null;
  rows: V3Row[];
  columns: V3Column[];
  liveEdit: { rowId: string; colId: string; value: string } | null;
  onStartEdit: (rowId: string, colId: string) => void;
  onLiveChange: (rowId: string, colId: string, value: string) => void;
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

const FormulaBar: React.FC<FormulaBarProps> = ({ selection, rows, columns, liveEdit, onStartEdit, onLiveChange, onCommit }) => {
  const [formula, setFormula] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedRow = selection !== null ? rows[selection.rowIdx] : null;
  const selectedCol = selection !== null ? columns[selection.colIdx] : null;
  const cellLabel = selection ? getCellLabel(selection.colIdx, selection.rowIdx) : '';

  useEffect(() => {
    if (!selection || !selectedRow || !selectedCol) { setFormula(''); return; }
    if (liveEdit?.rowId === selectedRow.id && liveEdit.colId === selectedCol.id) {
      setFormula(liveEdit.value);
      return;
    }
    // Show formula string for formula columns, raw value otherwise
    if (selectedCol.type === 'formula' && selectedCol.formula) {
      setFormula(selectedCol.formula);
    } else {
      const raw = selectedRow.cells[selectedCol.id];
      setFormula(raw === null || raw === undefined ? '' : String(raw));
    }
    setIsEditing(false);
  }, [selection, selectedRow, selectedCol, liveEdit]);

  const getSelectedCellDisplayValue = () => {
    if (!selection || !selectedRow || !selectedCol) return '';
    if (selectedCol.type === 'formula' && selectedCol.formula) return selectedCol.formula;
    const raw = selectedRow.cells[selectedCol.id];
    return raw === null || raw === undefined ? '' : String(raw);
  };

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
      <div 
        title={selectedCol ? `Column ID: ${selectedCol.id}` : undefined}
        className="flex items-center justify-center h-full w-[100px] border-r border-gray-200 px-3 shrink-0"
      >
        <span className="text-xs font-mono font-semibold text-gray-600 tracking-wider">
          {cellLabel || '—'}
        </span>
      </div>

      {/* fx label */}
      <div className="flex items-center justify-center h-full w-10 border-r border-gray-200 shrink-0">
        <span className="text-xs italic text-gray-400 font-serif">fx</span>
      </div>

      {/* Formula input */}
      <input
        ref={inputRef}
        value={formula}
        disabled={!selection || !selectedCol?.editable}
        onMouseDown={() => {
          if (selectedRow && selectedCol?.editable) {
            onStartEdit(selectedRow.id, selectedCol.id);
          }
        }}
        onChange={(e) => {
          const value = e.target.value;
          setFormula(value);
          setIsEditing(true);
          if (selectedRow && selectedCol?.editable) {
            onLiveChange(selectedRow.id, selectedCol.id, value);
          }
        }}
        onFocus={() => {
          setIsEditing(true);
          if (selectedRow && selectedCol?.editable) {
            onStartEdit(selectedRow.id, selectedCol.id);
          }
        }}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); handleCommit(); }
          if (e.key === 'Escape') {
            e.preventDefault();
            setIsEditing(false);
            setFormula(getSelectedCellDisplayValue());
            inputRef.current?.blur();
          }
        }}
        placeholder={selection ? (selectedCol?.editable ? 'Enter value or formula (e.g. =Labor+[Material Cost] or =A1+B2)' : 'Read-only formula') : 'Select a cell'}
        className={`flex-1 h-full min-h-[26px] px-3 text-xs font-mono text-gray-800 outline-none bg-transparent transition-colors
          ${isEditing ? 'bg-blue-50' : ''}
          ${!selection ? 'text-gray-400' : ''}
          ${formula.startsWith('=') ? 'text-blue-700' : ''}
        `}
      />
    </div>
  );
};

export default FormulaBar;
