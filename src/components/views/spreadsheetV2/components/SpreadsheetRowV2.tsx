import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BudgetLineItem, SpreadsheetColumn, DisplayDensity, FilterRule, HighlightRule } from '../../../../types';
import { ChevronRightIcon, ChevronDownIcon } from '../../../common/Icons';
import { RowActionsMenu } from '../../../shared/RowActionsMenu';
import { SpreadsheetRowType } from '../SpreadsheetViewV2';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../../constants/spreadsheetLayout';
import { checkFilterMatch } from '../../../../lib/utils';

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '';
  const prefix = amount < 0 ? '-' : '';
  return prefix + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface SpreadsheetRowV2Props {
    row: BudgetLineItem;
    level: number;
    columns: SpreadsheetColumn[];
    isSelected: boolean;
    isExpanded?: boolean;
    onToggleExpand: () => void;
    focusedCell: { rowId: string; colId: string; type: SpreadsheetRowType } | null;
    editingCell: { rowId: string; colId: string; initialValue?: string } | null;
    onStopEdit: () => void;
    isScrolled: boolean;
    isAtEnd?: boolean;
    fontSize: number;
    displayDensity: DisplayDensity;
    rowType: SpreadsheetRowType;
    onRowHeaderClick: (id: string, multiSelect: boolean) => void;
    onToggleRow: (id: string) => void;
    onCellClick: (rowId: string, colId: string) => void;
    onStartEdit: (rowId: string, colId: string) => void;
    onUpdateCell: (rowId: string, colId: string, value: any, direction?: 'up' | 'down' | 'left' | 'right') => void;
    onContextMenu: (e: React.MouseEvent, type: 'row' | 'cell', targetId: string, secondaryId?: string) => void;
    filters: FilterRule[];
    highlights?: HighlightRule[];
    showColoredRows: boolean;
}

const getRowHeightClass = (density: DisplayDensity) => {
  switch (density) {
    case 'compact': return 'h-7';
    case 'standard': return 'h-9';
    case 'comfortable': return 'h-11';
    default: return 'h-7';
  }
};

const SpreadsheetRowV2: React.FC<SpreadsheetRowV2Props> = ({
    row,
    level,
    columns,
    isSelected,
    isExpanded,
    onToggleExpand,
    focusedCell,
    editingCell,
    onStopEdit,
    isScrolled,
    isAtEnd,
    fontSize,
    displayDensity,
    rowType,
    onToggleRow,
    onCellClick,
    onStartEdit,
    onUpdateCell,
    onContextMenu,
    filters,
    highlights,
    showColoredRows
}) => {
    const isRowFocused = focusedCell?.rowId === row.id && focusedCell?.type === rowType;
    const customStyle = row.style || {};
    const customBorder = customStyle.borderColor;
    const rowHeightClass = getRowHeightClass(displayDensity);
    
    const [isLinked, setIsLinked] = useState(false);
    const [editValue, setEditValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const hasChildren = !!row.children && row.children.length > 0;

    // Summary calculation
    const summaryTotals = useMemo(() => {
        if (rowType !== 'summary' || !row.children) return null;
        return row.children.reduce((acc, child) => ({
            remainingContract: acc.remainingContract + (child.remainingContract || 0),
            effortHours: acc.effortHours + (child.effortHours || 0),
            totalBudget: acc.totalBudget + (child.totalBudget || 0),
            labor: acc.labor + (child.labor || 0),
            material: acc.material + (child.material || 0),
            equipment: acc.equipment + (child.equipment || 0),
            subcontractor: acc.subcontractor + (child.subcontractor || 0),
            others: acc.others + (child.others || 0),
            overhead: acc.overhead + (child.overhead || 0),
            profit: acc.profit + (child.profit || 0),
        }), { remainingContract: 0, effortHours: 0, totalBudget: 0, labor: 0, material: 0, equipment: 0, subcontractor: 0, others: 0, overhead: 0, profit: 0 });
    }, [row, rowType]);

    // Allocation status logic
    const remaining = row.remainingContract ?? 0;
    const statusColors = useMemo(() => {
        if (!showColoredRows) return '';
        if (rowType !== 'parent') return '';
        if (remaining < 0) return 'bg-[#fef2f2] border-red-200'; // red-50
        if (remaining === 0) return 'bg-[#f0fdf4] border-green-100'; // green-50
        return 'bg-[#fffbeb] border-amber-100'; // amber-50
    }, [remaining, rowType, showColoredRows]);

    // Initialize edit value
    useEffect(() => {
        if (editingCell?.rowId === row.id) {
            const col = columns.find(c => c.id === editingCell.colId);
            if (col) {
                setEditValue(editingCell.initialValue !== undefined ? editingCell.initialValue : String((row as any)[col.id] ?? ''));
            }
        }
    }, [editingCell, row, columns]);

    useEffect(() => {
        if (editingCell?.rowId === row.id && inputRef.current) {
            inputRef.current.focus();
            if (editingCell.initialValue === undefined) inputRef.current.select();
        }
    }, [editingCell, row.id]);

    const handleSave = (colId: string, direction?: 'up' | 'down' | 'left' | 'right') => {
        const col = columns.find(c => c.id === colId);
        const val = col?.align === 'right' ? parseFloat(editValue.replace(/,/g, '')) : editValue;
        onUpdateCell(row.id, colId, isNaN(val as any) && col?.align === 'right' ? null : val, direction);
        onStopEdit();
    };

    const handleKeyDown = (e: React.KeyboardEvent, colId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave(colId, e.shiftKey ? 'up' : 'down');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            handleSave(colId, e.shiftKey ? 'left' : 'right');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleSave(colId, 'up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleSave(colId, 'down');
        } else if (e.key === 'ArrowLeft') {
            if (inputRef.current?.selectionStart === 0) {
                e.preventDefault();
                handleSave(colId, 'left');
            }
        } else if (e.key === 'ArrowRight') {
            if (inputRef.current?.selectionStart === editValue.length) {
                e.preventDefault();
                handleSave(colId, 'right');
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onStopEdit();
        }
    };

    const highlightFilter = useMemo(() => {
        // Kept for backward compatibility if needed, or if we decide to keep row highlighting via standard filters
        if (rowType === 'summary') return null;
        return filters.find(f => (f as any).color && f.columnId && checkFilterMatch((row as any)[f.columnId], f.operator, f.value));
    }, [filters, row, rowType]);

    const rowStyle: React.CSSProperties = {};
    if (highlightFilter && (highlightFilter as any).color) {
        rowStyle.backgroundColor = (highlightFilter as any).color;
    } else if (customStyle.backgroundColor) {
        rowStyle.backgroundColor = customStyle.backgroundColor;
    }
    if (customStyle.textColor) rowStyle.color = customStyle.textColor;

    const rowClasses = `group ${rowHeightClass} relative transition-colors ${
        isSelected ? 'bg-blue-100' : 
        rowType === 'parent' ? `${statusColors} font-semibold border-t border-b` : 
        rowType === 'summary' ? 'bg-gray-100 text-gray-900 font-bold border-t border-gray-300' : 
        (rowStyle.backgroundColor ? '' : 'bg-white')
    }`;

    // Get background for sticky columns to ensure zero transparency
    const getStickyBg = () => {
        if (rowType === 'summary') return 'bg-gray-100';
        if (isSelected) return 'bg-[#dbeafe]'; // blue-100
        if (isRowFocused) return 'bg-[#eff6ff]'; // blue-50
        if (rowType === 'parent' && showColoredRows) {
            if (remaining < 0) return 'bg-[#fef2f2]';
            if (remaining === 0) return 'bg-[#f0fdf4]';
            return 'bg-[#fffbeb]';
        }
        return rowStyle.backgroundColor ? '' : 'bg-white';
    };

    const stickyBgClass = getStickyBg();

    return (
        <tr className={rowClasses} style={rowStyle}>
            {/* Locked Column 1 */}
            <td 
                onClick={() => rowType !== 'summary' && onToggleRow(row.id)}
                onContextMenu={(e) => rowType !== 'summary' && onContextMenu(e, 'row', row.id)}
                className={`sticky left-0 z-30 border-r border-gray-200 text-center p-0 relative transition-colors
                    ${(isSelected && rowType !== 'summary') ? 'bg-blue-600 text-white' : stickyBgClass}
                    ${rowType === 'parent' ? 'cursor-pointer' : rowType === 'summary' ? '' : 'cursor-pointer'}
                    ${isScrolled ? 'after:content-[""] after:absolute after:top-0 after:bottom-0 after:-right-[6px] after:w-[6px] after:bg-gradient-to-r after:from-black/[0.12] after:to-transparent after:pointer-events-none' : ''}
                `}
                style={{ 
                    width: SPREADSHEET_INDEX_COLUMN_WIDTH, 
                    minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH, 
                    maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                    backgroundColor: (!isSelected && rowType !== 'summary' && rowStyle.backgroundColor) ? rowStyle.backgroundColor : undefined
                }}
            >
                <div className="flex items-center justify-center h-full relative z-30">
                    {rowType !== 'summary' && (
                        <>
                            <span className={`transition-opacity duration-100 ${isSelected ? 'hidden' : 'group-hover:hidden font-medium'}`} style={{ fontSize }}>
                                {rowType === 'parent' ? row.sNo : ''}
                            </span>
                            <input
                                type="checkbox" checked={isSelected} onChange={() => onToggleRow(row.id)} onClick={(e) => e.stopPropagation()}
                                className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${isSelected ? 'block' : 'hidden group-hover:block'}`}
                            />
                        </>
                    )}
                </div>
                {customBorder && rowType !== 'summary' && (
                    <>
                        <div className="absolute top-0 left-0 right-0 h-px z-40 pointer-events-none" style={{ backgroundColor: customBorder }} />
                        <div className="absolute bottom-0 left-0 right-0 h-px z-40 pointer-events-none" style={{ backgroundColor: customBorder }} />
                    </>
                )}
            </td>

            {columns.map((col) => {
                const isCellFocused = focusedCell?.rowId === row.id && focusedCell?.colId === col.id && focusedCell?.type === rowType;
                const isCurrentCellEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                
                let content: React.ReactNode = '';
                let cellColorClass = '';

                if (rowType === 'summary') {
                    if (col.id === 'name') content = 'Total';
                    else if (col.isTotal && summaryTotals) {
                        const val = (summaryTotals as any)[col.id];
                        content = col.id === 'effortHours' ? val : formatCurrency(val);
                    }
                } else if (rowType === 'parent') {
                    if (col.id === 'name') {
                        content = row.name;
                    } else if (col.id === 'remainingContract') {
                        content = formatCurrency(row.remainingContract);
                        if (remaining < 0) cellColorClass = 'text-red-600 font-bold';
                        else if (remaining === 0) cellColorClass = 'text-green-600 font-bold';
                    } else {
                        content = ''; 
                    }
                } else if (rowType === 'child') {
                    if (col.id === 'remainingContract') {
                        content = ''; 
                    } else {
                        content = (row as any)[col.id];
                        if (['totalBudget', 'labor', 'material', 'equipment', 'subcontractor', 'others', 'overhead', 'profit'].includes(col.id)) {
                            content = formatCurrency(content as number);
                        } else if (col.id === 'quantity' && content !== null && content !== undefined) {
                            content = (content as number).toLocaleString();
                        }
                    }
                }

                const isEditable = col.editable && (
                    (rowType === 'child' && col.id !== 'remainingContract') || 
                    (rowType === 'parent' && (col.id === 'name' || col.id === 'remainingContract'))
                );

                // Check for cell highlighting based on Visual Filters (Highlights)
                let highlightStyle: React.CSSProperties = {};
                
                // Only highlight if:
                // 1. Not a summary row
                // 2. Not a parent row that is currently expanded (header cells shouldn't highlight when open)
                const shouldHighlight = rowType !== 'summary' && !(rowType === 'parent' && isExpanded) && highlights;

                if (shouldHighlight) {
                    const matchingHighlight = highlights.find(h => {
                        if (h.columnId !== col.id) return false;
                        const cellValue = (row as any)[col.id];
                        
                        // Don't highlight empty cells
                        if (cellValue === null || cellValue === undefined || cellValue === '') return false;
                        
                        return checkFilterMatch(cellValue, h.operator, h.value);
                    });
                    
                    if (matchingHighlight) {
                        highlightStyle.backgroundColor = matchingHighlight.color;
                    }
                }

                return (
                    <td 
                        key={col.id}
                        onClick={() => {
                            if (rowType === 'summary') return;
                            onCellClick(row.id, col.id);
                            if (col.id === 'name' && rowType === 'parent' && hasChildren) {
                                onToggleExpand();
                            }
                        }}
                        onDoubleClick={() => rowType !== 'summary' && isEditable && onStartEdit(row.id, col.id)}
                        onContextMenu={(e) => rowType !== 'summary' && onContextMenu(e, 'cell', row.id, col.id)}
                        className={`border-r border-gray-200 px-2 relative transition-colors
                            ${col.id === 'name' && rowType === 'parent' && hasChildren ? 'cursor-pointer hover:bg-black/5' : 'cursor-default'}
                            ${col.align === 'right' ? 'text-right' : 'text-left'}
                            ${rowType === 'summary' ? 'border-gray-300 bg-gray-100' : ''}
                            ${isSelected && rowType !== 'summary' ? 'bg-blue-50' : ''}
                            ${cellColorClass}
                        `}
                        style={{ 
                            width: `${col.width}px`, 
                            minWidth: `${col.width}px`, 
                            maxWidth: `${col.width}px`
                        }}
                    >
                        {highlightStyle.backgroundColor ? (
                            <div
                                key={highlightStyle.backgroundColor}
                                className="absolute inset-0 z-0 pointer-events-none"
                                style={{ backgroundColor: highlightStyle.backgroundColor }}
                                aria-hidden
                            />
                        ) : null}
                        {isCurrentCellEditing ? (
                            <input
                                ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSave(col.id)} onKeyDown={(e) => handleKeyDown(e, col.id)}
                                className="absolute inset-0 w-full h-full px-2 bg-white text-gray-900 border-2 border-blue-600 outline-none z-50 shadow-sm"
                                style={{ fontSize }}
                            />
                        ) : (
                            <div 
                                className={`flex items-center h-full w-full relative z-10 ${col.align === 'right' ? 'justify-end' : 'justify-start'}`}
                                style={{ paddingLeft: col.id === 'name' ? `${level * 16}px` : undefined }}
                            >
                                {col.id === 'name' && rowType === 'parent' && hasChildren && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                                        className="mr-1 p-0.5 rounded hover:bg-blue-100 text-blue-500 hover:text-blue-700 shrink-0 transition-colors"
                                    >
                                        {isExpanded ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                                <span className="truncate" title={typeof content === 'string' ? content : undefined}>
                                    {content}
                                </span>
                            </div>
                        )}
                        {isCellFocused && !isCurrentCellEditing && (
                            <div className="absolute inset-0 border-2 border-blue-600 z-20 pointer-events-none shadow-[inset_0_0_0_1px_rgba(37,99,235,0.3)]"></div>
                        )}
                        {customBorder && rowType !== 'summary' && (
                            <>
                                <div className="absolute top-0 left-0 right-0 h-px z-20 pointer-events-none" style={{ backgroundColor: customBorder }} />
                                <div className="absolute bottom-0 left-0 right-0 h-px z-20 pointer-events-none" style={{ backgroundColor: customBorder }} />
                            </>
                        )}
                    </td>
                );
            })}
            
            {/* Sticky Right Column */}
            <td className={`sticky right-0 z-30 w-20 px-2 border-l border-gray-200 transition-all duration-200 relative
                ${stickyBgClass}
                ${!isAtEnd ? 'before:content-[""] before:absolute before:top-0 before:bottom-0 before:-left-[6px] before:w-[6px] before:bg-gradient-to-l before:from-black/[0.12] before:to-transparent before:pointer-events-none' : ''}
            `}
            style={{ 
                width: '80px', minWidth: '80px', maxWidth: '80px',
                backgroundColor: (!isSelected && rowType !== 'summary' && rowStyle.backgroundColor) ? rowStyle.backgroundColor : undefined 
            }}
            >
                <div className="flex items-center justify-center h-full relative z-30">
                    {rowType !== 'summary' && (
                        <RowActionsMenu 
                            onView={() => console.log('View details', row.id)}
                            onLink={() => setIsLinked(!isLinked)}
                            onExport={() => console.log('Export row', row.id)}
                            onAttachments={() => console.log('Attachments for row', row.id)}
                            onDelete={() => console.log('Delete row', row.id)}
                            isLinked={isLinked}
                        />
                    )}
                </div>
                {customBorder && rowType !== 'summary' && (
                    <>
                        <div className="absolute top-0 left-0 right-0 h-px z-40 pointer-events-none" style={{ backgroundColor: customBorder }} />
                        <div className="absolute bottom-0 left-0 right-0 h-px z-40 pointer-events-none" style={{ backgroundColor: customBorder }} />
                    </>
                )}
            </td>
        </tr>
    );
};

export default SpreadsheetRowV2;