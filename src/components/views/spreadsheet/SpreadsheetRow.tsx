import React from 'react';
import { BudgetLineItem, SpreadsheetColumn } from '../../../../types';
import { AlertTriangleIcon } from '../../../common/Icons';

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface SpreadsheetRowProps {
    row: BudgetLineItem;
    columns: SpreadsheetColumn[];
    isSelected: boolean;
    focusedCell: { rowId: string; colId: string } | null;
    isScrolled: boolean;
    fontSize: number;
    onRowHeaderClick: (id: string, multiSelect: boolean) => void;
    onCellClick: (rowId: string, colId: string) => void;
    onContextMenu: (e: React.MouseEvent, type: 'row' | 'cell', targetId: string, secondaryId?: string) => void;
}

const SpreadsheetRow: React.FC<SpreadsheetRowProps> = ({
    row,
    columns,
    isSelected,
    focusedCell,
    isScrolled,
    fontSize,
    onRowHeaderClick,
    onCellClick,
    onContextMenu
}) => {
    const isRowFocused = focusedCell?.rowId === row.id;
    const customStyle = row.style || {};
    const customBorder = customStyle.borderColor;

    const rowStyle: React.CSSProperties = {};
    if (customStyle.backgroundColor) rowStyle.backgroundColor = customStyle.backgroundColor;
    if (customStyle.textColor) rowStyle.color = customStyle.textColor;

    let rowClasses = 'h-7 group bg-white';
    if (!customStyle.backgroundColor) {
        rowClasses += isSelected ? ' bg-blue-50' : ' hover:bg-gray-50';
    }

    return (
        <tr className={rowClasses} style={rowStyle}>
            {/* Row Number Cell */}
            <td 
                onClick={(e) => onRowHeaderClick(row.id, e.metaKey || e.ctrlKey)}
                onContextMenu={(e) => onContextMenu(e, 'row', row.id)}
                className={`sticky left-0 z-20 border-r border-gray-200 text-center cursor-pointer transition-colors p-0 relative bg-white
                    ${!customBorder ? 'border-b' : ''}
                    ${isSelected ? 'bg-blue-600 text-white' : isRowFocused ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-500 group-hover:bg-gray-50'}
                    ${isScrolled ? 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''}
                `}
                style={{
                    backgroundColor: isSelected ? undefined : isRowFocused ? undefined : customStyle.backgroundColor,
                    color: isSelected ? undefined : isRowFocused ? undefined : customStyle.textColor,
                }}
            >
                <div className="flex items-center justify-center h-full relative z-20" style={{ fontSize }}>
                    {row.sNo}
                </div>
                {/* Absolute Custom Borders for Row Header */}
                {customBorder && (
                    <>
                        <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                        <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                    </>
                )}
            </td>

            {/* Data Cells */}
            {columns.map(col => {
                const isCellFocused = focusedCell?.rowId === row.id && focusedCell?.colId === col.id;
                let content: React.ReactNode = (row as any)[col.id];
                
                // Formatting specific cells
                if (col.id === 'costCode' && row.hasWarning) {
                    content = <div className="flex items-center justify-center w-full h-full"><AlertTriangleIcon className="w-3 h-3 text-orange-500" /></div>;
                } else if (['totalBudget', 'labor', 'equipment', 'subcontractor', 'material', 'others'].includes(col.id)) {
                    content = formatCurrency(content as number);
                }

                return (
                    <td 
                        key={col.id}
                        onClick={() => onCellClick(row.id, col.id)}
                        onContextMenu={(e) => onContextMenu(e, 'cell', row.id, col.id)}
                        className={`border-r border-gray-200 px-2 text-gray-600 relative cursor-default 
                            ${!customBorder ? 'border-b' : ''}
                            ${col.align === 'right' ? 'text-right' : 'text-left'}
                            ${col.id === 'name' || col.id === 'totalBudget' ? 'font-medium text-gray-900' : ''}
                        `}
                    >
                        <div className="truncate w-full relative z-20" title={typeof content === 'string' ? content : undefined} style={{ color: customStyle.textColor }}>
                            {content}
                        </div>
                        {isCellFocused && (
                            <div className="absolute inset-0 border-2 border-blue-600 z-30 pointer-events-none"></div>
                        )}
                        {/* Absolute Custom Borders for Data Cells */}
                        {customBorder && (
                            <>
                                <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                                <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                            </>
                        )}
                    </td>
                );
            })}
        </tr>
    );
};

export default SpreadsheetRow;