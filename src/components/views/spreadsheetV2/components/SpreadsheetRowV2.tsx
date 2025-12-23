import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BudgetLineItem, SpreadsheetColumn, DisplayDensity } from '../../../../types';
import { LinkIcon, ChevronRightIcon, ChevronDownIcon } from '../../../common/Icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../common/ui/Tooltip';
import { SpreadsheetRowType } from '../SpreadsheetViewV2';

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
    onContextMenu
}) => {
    const isRowFocused = focusedCell?.rowId === row.id && focusedCell?.type === rowType;
    const customStyle = row.style || {};
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

    // Allocation status logic - using solid colors to fix transparency defect
    const remaining = row.remainingContract ?? 0;
    const statusColors = useMemo(() => {
        if (rowType !== 'parent') return '';
        if (remaining < 0) return 'bg-[#fef2f2] border-red-200'; // red-50
        if (remaining === 0) return 'bg-[#f0fdf4] border-green-100'; // green-50
        return 'bg-[#fffbeb] border-amber-100'; // amber-50
    }, [remaining, rowType]);

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

    const rowStyle: React.CSSProperties = {};
    if (customStyle.backgroundColor) rowStyle.backgroundColor = customStyle.backgroundColor;
    if (customStyle.textColor) rowStyle.color = customStyle.textColor;

    const rowClasses = `group ${rowHeightClass} relative transition-colors ${
        isSelected ? 'bg-blue-100' : 
        rowType === 'parent' ? `${statusColors} font-semibold border-t border-b` : 
        rowType === 'summary' ? 'bg-gray-100 text-gray-900 font-bold border-t border-gray-300' : 
        'bg-white'
    }`;

    // Get background for sticky columns to ensure zero transparency
    const getStickyBg = () => {
        if (rowType === 'summary') return 'bg-gray-100';
        if (isSelected) return 'bg-[#dbeafe]'; // blue-100
        if (isRowFocused) return 'bg-[#eff6ff]'; // blue-50
        if (rowType === 'parent') {
            if (remaining < 0) return 'bg-[#fef2f2]';
            if (remaining === 0) return 'bg-[#f0fdf4]';
            return 'bg-[#fffbeb]';
        }
        return 'bg-white';
    };

    const stickyBgClass = getStickyBg();

    return (
        <tr className={rowClasses} style={rowStyle}>
            {/* Locked Column 1: Match header dimensions strictly */}
            <td 
                onClick={() => rowType !== 'summary' && onToggleRow(row.id)}
                onContextMenu={(e) => rowType !== 'summary' && onContextMenu(e, 'row', row.id)}
                className={`sticky left-0 z-30 border-r border-gray-200 text-center p-0 relative transition-colors
                    ${(isSelected && rowType !== 'summary') ? 'bg-blue-600 text-white' : stickyBgClass}
                    ${rowType === 'parent' ? 'cursor-pointer' : rowType === 'summary' ? '' : 'cursor-pointer'}
                    ${isScrolled ? 'after:content-[""] after:absolute after:top-0 after:bottom-0 after:-right-[6px] after:w-[6px] after:bg-gradient-to-r after:from-black/[0.12] after:to-transparent after:pointer-events-none' : ''}
                `}
                style={{ width: '56px', minWidth: '56px', maxWidth: '56px' }}
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
                    // Strictly only show name and remaining contract for parents
                    if (col.id === 'name') {
                        content = row.name;
                    } else if (col.id === 'remainingContract') {
                        content = formatCurrency(row.remainingContract);
                        if (remaining < 0) cellColorClass = 'text-red-600 font-bold';
                        else if (remaining === 0) cellColorClass = 'text-green-600 font-bold';
                    } else {
                        content = ''; // Empty for all other columns in parent rows
                    }
                } else if (rowType === 'child') {
                    if (col.id === 'remainingContract') {
                        content = ''; // Empty for child rows in remaining contract column
                    } else {
                        content = (row as any)[col.id];
                        if (['totalBudget', 'labor', 'material', 'equipment', 'subcontractor', 'others', 'overhead', 'profit'].includes(col.id)) {
                            content = formatCurrency(content as number);
                        } else if (col.id === 'quantity' && content !== null && content !== undefined) {
                            content = (content as number).toLocaleString();
                        }
                    }
                }

                // Check if this specific cell is editable based on row type
                const isEditable = col.editable && (
                    (rowType === 'child' && col.id !== 'remainingContract') || 
                    (rowType === 'parent' && (col.id === 'name' || col.id === 'remainingContract'))
                );

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
                        style={{ width: `${col.width}px`, minWidth: `${col.width}px`, maxWidth: `${col.width}px` }}
                    >
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
                    </td>
                );
            })}
            
            <td className={`sticky right-0 z-30 w-20 px-2 border-l border-gray-200 transition-all duration-200 relative
                ${stickyBgClass}
                ${!isAtEnd ? 'before:content-[""] before:absolute before:top-0 before:bottom-0 before:-left-[6px] before:w-[6px] before:bg-gradient-to-l before:from-black/[0.12] before:to-transparent before:pointer-events-none' : ''}
            `}
            style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
            >
                <div className="flex items-center justify-center h-full relative z-30">
                    {rowType !== 'summary' && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsLinked(!isLinked); }}
                                        className={`transition-all duration-200 focus:outline-none ${isLinked ? 'text-blue-600' : 'text-gray-400 opacity-60 hover:opacity-100 hover:text-gray-700'}`}
                                    >
                                        <LinkIcon className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="left">{isLinked ? 'Linked to System' : 'System Link'}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default SpreadsheetRowV2;