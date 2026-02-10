import React, { useState } from 'react';
import { BudgetLineItem, SpreadsheetColumn, DisplayDensity } from '../../../../types';
import { AlertTriangleIcon } from '../../../common/Icons';
import { RowActionsMenu } from '../../../shared/RowActionsMenu';
import { SPREADSHEET_INDEX_COLUMN_WIDTH } from '../../../../constants/spreadsheetLayout';

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
    isAtEnd?: boolean;
    fontSize: number;
    displayDensity: DisplayDensity;
    onRowHeaderClick: (id: string, multiSelect: boolean) => void;
    onCellClick: (rowId: string, colId: string) => void;
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

const SpreadsheetRow: React.FC<SpreadsheetRowProps> = ({
    row,
    columns,
    isSelected,
    focusedCell,
    isScrolled,
    isAtEnd,
    fontSize,
    displayDensity,
    onRowHeaderClick,
    onCellClick,
    onContextMenu
}) => {
    const isRowFocused = focusedCell?.rowId === row.id;
    const customStyle = row.style || {};
    const customBorder = customStyle.borderColor;
    const rowHeightClass = getRowHeightClass(displayDensity);
    
    // Local state for link toggle
    const [isLinked, setIsLinked] = useState(false);

    const rowStyle: React.CSSProperties = {};
    if (customStyle.backgroundColor) rowStyle.backgroundColor = customStyle.backgroundColor;
    if (customStyle.textColor) rowStyle.color = customStyle.textColor;

    // Sticky background logic - Header uses dark blue, Actions/Data uses light blue
    const getStickyLeftBg = () => {
        if (isSelected) return 'bg-blue-600';
        if (isRowFocused) return 'bg-blue-100';
        return 'bg-white';
    };

    const getStickyRightBg = () => {
        if (isSelected) return 'bg-blue-50';
        if (isRowFocused) return 'bg-blue-100';
        return 'bg-white';
    };

    return (
        <tr className={`group ${rowHeightClass} relative`} style={rowStyle}>
            {/* Sticky Row Number Cell - Left (Dark Blue selection) */}
            <td 
                onClick={(e) => onRowHeaderClick(row.id, e.metaKey || e.ctrlKey)}
                onContextMenu={(e) => onContextMenu(e, 'row', row.id)}
                className={`sticky left-0 z-30 border-r border-gray-200 text-center cursor-pointer transition-all p-0 relative
                    ${!customBorder ? 'border-b' : ''}
                    ${getStickyLeftBg()}
                    ${isSelected ? 'text-white' : isRowFocused ? 'text-blue-800 font-semibold' : 'text-gray-500 group-hover:bg-gray-50'}
                    ${isScrolled ? 'after:content-[""] after:absolute after:top-0 after:bottom-0 after:-right-[6px] after:w-[6px] after:bg-gradient-to-r after:from-black/[0.12] after:to-transparent after:pointer-events-none' : ''}
                `}
                style={{
                    width: SPREADSHEET_INDEX_COLUMN_WIDTH,
                    minWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                    maxWidth: SPREADSHEET_INDEX_COLUMN_WIDTH,
                    backgroundColor: (!isSelected && !isRowFocused) ? (customStyle.backgroundColor || '#ffffff') : undefined,
                }}
            >
                <div className="flex items-center justify-center h-full relative z-30" style={{ fontSize }}>
                    {row.sNo}
                </div>
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
                        className={`border-r border-gray-200 px-2 text-gray-600 relative cursor-default transition-colors
                            ${!customBorder ? 'border-b' : ''}
                            ${col.align === 'right' ? 'text-right' : 'text-left'}
                            ${col.id === 'name' || col.id === 'totalBudget' ? 'font-medium text-gray-900' : ''}
                            ${isSelected ? 'bg-blue-50' : ''}
                        `}
                    >
                        <div className="truncate w-full relative z-10" title={typeof content === 'string' ? content : undefined} style={{ color: customStyle.textColor }}>
                            {content}
                        </div>
                        {isCellFocused && (
                            <div className="absolute inset-0 border-2 border-blue-600 z-20 pointer-events-none"></div>
                        )}
                        {customBorder && (
                            <>
                                <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                                <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                            </>
                        )}
                    </td>
                );
            })}
            
            {/* Action Column Sticky Right - Fixed selection background and refined icon styling */}
            <td className={`sticky right-0 z-30 w-20 px-2 border-l border-gray-200 transition-all duration-200 relative
                ${!customBorder ? 'border-b' : ''}
                ${getStickyRightBg()}
                ${isSelected ? 'bg-blue-50 group-hover:bg-blue-100' : isRowFocused ? 'bg-blue-50' : 'bg-white group-hover:bg-gray-50'}
                ${!isAtEnd ? 'before:content-[""] before:absolute before:top-0 before:bottom-0 before:-left-[6px] before:w-[6px] before:bg-gradient-to-l before:from-black/[0.12] before:to-transparent before:pointer-events-none' : ''}
            `}
            style={{
                backgroundColor: (!isSelected && !isRowFocused) ? (customStyle.backgroundColor || '#ffffff') : undefined,
            }}
            >
                <div className="flex items-center justify-center h-full relative z-30">
                    <RowActionsMenu 
                        onView={() => console.log('View details', row.id)}
                        onLink={() => setIsLinked(!isLinked)}
                        onExport={() => console.log('Export row', row.id)}
                        onAttachments={() => console.log('Attachments for row', row.id)}
                        onDelete={() => console.log('Delete row', row.id)}
                        isLinked={isLinked}
                    />
                </div>
                {customBorder && (
                    <>
                        <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                        <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                    </>
                )}
            </td>
        </tr>
    );
};

export default SpreadsheetRow;