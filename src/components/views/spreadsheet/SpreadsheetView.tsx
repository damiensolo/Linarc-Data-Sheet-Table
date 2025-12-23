import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BudgetLineItem, BudgetLineItemStyle, SpreadsheetColumn } from '../../../types';
import { useProject } from '../../../context/ProjectContext';
import SpreadsheetToolbar from './components/SpreadsheetToolbar';
import SpreadsheetHeader from './components/SpreadsheetHeader';
import SpreadsheetRow from './components/SpreadsheetRow';
import { ContextMenu, ContextMenuItem } from '../../common/ui/ContextMenu';
import { ScissorsIcon, CopyIcon, ClipboardIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon, FillColorIcon, BorderColorIcon } from '../../common/Icons';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../constants/designTokens';

// --- Constants ---

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const SpreadsheetView: React.FC = () => {
  const { activeView, updateView, searchTerm, handleSort } = useProject();
  
  const rawBudgetData = useMemo(() => activeView.spreadsheetData || [], [activeView.spreadsheetData]);
  
  // Implement search filtering
  const filteredData = useMemo(() => {
      if (!searchTerm.trim()) return rawBudgetData;
      const lowerTerm = searchTerm.toLowerCase();
      
      return rawBudgetData.filter(item => {
          // Search across all values in the row
          return Object.values(item).some(val => 
              val !== null && 
              val !== undefined && 
              String(val).toLowerCase().includes(lowerTerm)
          );
      });
  }, [rawBudgetData, searchTerm]);

  // Implement Sorting
  const budgetData = useMemo(() => {
      if (!activeView.sort) return filteredData;
      
      const { columnId, direction } = activeView.sort;
      const sorted = [...filteredData].sort((a, b) => {
          const valA = a[columnId as keyof BudgetLineItem];
          const valB = b[columnId as keyof BudgetLineItem];

          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (valA < valB) return direction === 'asc' ? -1 : 1;
          return direction === 'asc' ? 1 : -1;
      });
      return sorted;
  }, [filteredData, activeView.sort]);

  const columns = useMemo(() => activeView.spreadsheetColumns || [], [activeView.spreadsheetColumns]);
  const displayDensity = activeView.displayDensity;

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [scrollState, setScrollState] = useState({ isAtStart: true, isAtEnd: false });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toolbarCheckboxRef = useRef<HTMLInputElement>(null);
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const activeResizerId = useRef<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
      visible: boolean;
      position: { x: number; y: number };
      type: 'row' | 'column' | 'cell';
      targetId: string;
      secondaryId?: string; // For cell context (columnId)
  } | null>(null);

  const isAllSelected = budgetData.length > 0 && budgetData.every(item => selectedRowIds.has(item.id));
  const isSomeSelected = selectedRowIds.size > 0 && !isAllSelected;

  useEffect(() => {
    if (toolbarCheckboxRef.current) {
      toolbarCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
        if (container) {
            const isAtStart = container.scrollLeft <= 2;
            const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
            setScrollState({ isAtStart, isAtEnd });
        }
    };
    container?.addEventListener('scroll', handleScroll);
    // Initial check
    setTimeout(handleScroll, 100); 
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [budgetData, columns]);

  const handleToggleAll = () => {
    if (isAllSelected) {
        setSelectedRowIds(new Set());
    } else {
        const newSet = new Set(selectedRowIds);
        budgetData.forEach(item => newSet.add(item.id));
        setSelectedRowIds(newSet);
    }
  };

  const handleRowHeaderClick = (id: string, multiSelect: boolean) => {
    // Clear focused cell when selecting a row via header
    setFocusedCell(null);
    setSelectedRowIds(prev => {
      const newSet = multiSelect ? new Set(prev) : new Set<string>();
      if (prev.has(id) && multiSelect) {
        newSet.delete(id);
      } else if (!multiSelect) {
        if (prev.has(id) && prev.size === 1) {
            return new Set<string>();
        }
        newSet.add(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCellClick = (rowId: string, colId: string) => {
      setFocusedCell({ rowId, colId });
      // Clear row selection when focusing a cell
      setSelectedRowIds(new Set()); 
  };

  // Context Menu Handler
  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'row' | 'column' | 'cell', targetId: string, secondaryId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Auto-select/focus when context menu is opened
      if (type === 'row') {
          if (!selectedRowIds.has(targetId)) {
              handleRowHeaderClick(targetId, false);
          }
      } else if (type === 'cell' && secondaryId) {
          handleCellClick(targetId, secondaryId);
      }

      setContextMenu({
          visible: true,
          position: { x: e.clientX, y: e.clientY },
          type,
          targetId,
          secondaryId
      });
  }, [selectedRowIds]);

  const handleBulkStyleUpdate = (newStyle: Partial<BudgetLineItemStyle>, targetIds?: Set<string>) => {
    const idsToUpdate = targetIds || selectedRowIds;
    // We update the original data source (rawBudgetData) to ensure persistence even when filter changes
    const updatedData = rawBudgetData.map(item => {
        if (idsToUpdate.has(item.id)) {
            const currentStyle = item.style || {};
            const mergedStyle = { ...currentStyle, ...newStyle };
            
            // clean up undefined values to allow "unsetting"
            (Object.keys(newStyle) as (keyof BudgetLineItemStyle)[]).forEach(key => {
                if (newStyle[key] === undefined) {
                    delete mergedStyle[key];
                }
            });

            return { ...item, style: mergedStyle };
        }
        return item;
    });
    updateView({ spreadsheetData: updatedData });
  };

  // Actions Handlers (Mocked for functionality)
  const handleDeleteRow = () => {
      if (contextMenu?.type === 'row' || contextMenu?.type === 'cell') {
          const idsToDelete = contextMenu.type === 'row' && selectedRowIds.size > 0 ? selectedRowIds : new Set([contextMenu.targetId]);
          const newData = rawBudgetData.filter(row => !idsToDelete.has(row.id));
          updateView({ spreadsheetData: newData });
          setSelectedRowIds(new Set());
      }
  };

  const getContextMenuItems = (): ContextMenuItem[] => {
      if (!contextMenu) return [];

      const commonActions: ContextMenuItem[] = [
          { label: 'Cut', icon: <ScissorsIcon className="w-4 h-4"/>, shortcut: 'Ctrl+X', onClick: () => console.log('Cut') },
          { label: 'Copy', icon: <CopyIcon className="w-4 h-4"/>, shortcut: 'Ctrl+C', onClick: () => console.log('Copy') },
          { label: 'Paste', icon: <ClipboardIcon className="w-4 h-4"/>, shortcut: 'Ctrl+V', onClick: () => console.log('Paste') },
      ];

      if (contextMenu.type === 'row') {
          const targetRows = selectedRowIds.has(contextMenu.targetId) ? selectedRowIds : new Set([contextMenu.targetId]);
          
          // Generate submenu items for background colors
          const bgSubmenu: ContextMenuItem[] = [
              {
                  label: 'No Color',
                  icon: <div className="w-3 h-3 rounded-full border border-gray-300 relative overflow-hidden"><div className="absolute inset-0 bg-red-500 rotate-45 w-[1px] left-1/2 -translate-x-1/2" /></div>,
                  onClick: () => handleBulkStyleUpdate({ backgroundColor: undefined }, targetRows)
              },
              ...BACKGROUND_COLORS.map(color => ({
                  label: ' ',
                  icon: <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color }} />,
                  onClick: () => handleBulkStyleUpdate({ backgroundColor: color }, targetRows)
              }))
          ];

          // Generate submenu items for border colors
          const borderSubmenu: ContextMenuItem[] = [
              {
                  label: 'No Border',
                  icon: <div className="w-3 h-3 rounded-full border border-gray-300 relative overflow-hidden"><div className="absolute inset-0 bg-red-500 rotate-45 w-[1px] left-1/2 -translate-x-1/2" /></div>,
                  onClick: () => handleBulkStyleUpdate({ borderColor: undefined }, targetRows)
              },
              ...TEXT_BORDER_COLORS.map(color => ({
                  label: ' ',
                  icon: <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color }} />,
                  onClick: () => handleBulkStyleUpdate({ borderColor: color }, targetRows)
              }))
          ];

          return [
              ...commonActions,
              { separator: true } as any,
              { 
                  label: 'Background Color', 
                  icon: <FillColorIcon className="w-4 h-4 text-gray-600"/>, 
                  submenu: bgSubmenu 
              },
              { 
                  label: 'Border Color', 
                  icon: <BorderColorIcon className="w-4 h-4 text-gray-600"/>, 
                  submenu: borderSubmenu 
              },
              { separator: true } as any,
              { label: 'Insert 1 row above', icon: <ArrowUpIcon className="w-4 h-4"/>, onClick: () => console.log('Insert row above', contextMenu.targetId) },
              { label: 'Insert 1 row below', icon: <ArrowDownIcon className="w-4 h-4"/>, onClick: () => console.log('Insert row below', contextMenu.targetId) },
              { separator: true } as any,
              { label: 'Delete row', icon: <TrashIcon className="w-4 h-4"/>, danger: true, onClick: handleDeleteRow },
          ];
      }

      if (contextMenu.type === 'column') {
          return [
              ...commonActions,
              { separator: true } as any,
              { label: 'Insert 1 column left', icon: <ChevronLeftIcon className="w-4 h-4"/>, onClick: () => console.log('Insert col left', contextMenu.targetId) },
              { label: 'Insert 1 column right', icon: <ChevronRightIcon className="w-4 h-4"/>, onClick: () => console.log('Insert col right', contextMenu.targetId) },
              { separator: true } as any,
              { label: 'Delete column', icon: <TrashIcon className="w-4 h-4"/>, danger: true, onClick: () => console.log('Delete col', contextMenu.targetId) },
          ];
      }

      // Cell context
      return [
          ...commonActions,
          { separator: true } as any,
          { label: 'Delete row', icon: <TrashIcon className="w-4 h-4"/>, danger: true, onClick: handleDeleteRow },
      ];
  };


  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!focusedCell) return;

      // Map IDs to indices
      const rowIndex = budgetData.findIndex(item => item.id === focusedCell.rowId);
      const colIndex = columns.findIndex(col => col.id === focusedCell.colId);

      if (rowIndex === -1 || colIndex === -1) return;

      let nextRowIndex = rowIndex;
      let nextColIndex = colIndex;

      switch (e.key) {
          case 'ArrowUp':
              nextRowIndex = Math.max(0, rowIndex - 1);
              e.preventDefault();
              break;
          case 'ArrowDown':
              nextRowIndex = Math.min(budgetData.length - 1, rowIndex + 1);
              e.preventDefault();
              break;
          case 'ArrowLeft':
              nextColIndex = Math.max(0, colIndex - 1);
              e.preventDefault();
              break;
          case 'ArrowRight':
              nextColIndex = Math.min(columns.length - 1, colIndex + 1);
              e.preventDefault();
              break;
          default:
              return;
      }

      if (nextRowIndex !== rowIndex || nextColIndex !== colIndex) {
          setFocusedCell({
              rowId: budgetData[nextRowIndex].id,
              colId: columns[nextColIndex].id
          });
      }
  };

  const handleResize = useCallback((columnId: string, newWidth: number) => {
    const updatedColumns = columns.map(c => c.id === columnId ? { ...c, width: Math.max(newWidth, 60) } : c);
    updateView({ spreadsheetColumns: updatedColumns });
  }, [columns, updateView]);

  const onMouseDown = (columnId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    activeResizerId.current = columnId;
    setResizingColumnId(columnId);
    
    const thElement = (e.target as HTMLElement).parentElement;
    if (!thElement) return;

    const startPos = e.clientX;
    const startWidth = thElement.offsetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (activeResizerId.current !== columnId) return;
      const newWidth = startWidth + (moveEvent.clientX - startPos);
      handleResize(columnId, newWidth);
    };

    const onMouseUp = () => {
      activeResizerId.current = null;
      setResizingColumnId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('grabbing');
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.classList.add('grabbing');
  };

  const handleColumnMove = useCallback((fromId: string, toId: string, position: 'left' | 'right') => {
      const newCols = [...columns];
      const sIndex = newCols.findIndex(c => c.id === fromId);
      let tIndex = newCols.findIndex(c => c.id === toId);
      
      if (sIndex === -1 || tIndex === -1) return;

      if (position === 'right') {
          tIndex++;
      }
      
      if (sIndex < tIndex) {
          tIndex--;
      }
      
      const [moved] = newCols.splice(sIndex, 1);
      newCols.splice(tIndex, 0, moved);
      updateView({ spreadsheetColumns: newCols });
  }, [columns, updateView]);

  const totals = useMemo(() => {
    return budgetData.reduce((acc, item) => ({
      effortHours: acc.effortHours + (item.effortHours || 0),
      totalBudget: acc.totalBudget + (item.totalBudget || 0),
      labor: acc.labor + (item.labor || 0),
      equipment: acc.equipment + (item.equipment || 0),
      subcontractor: acc.subcontractor + (item.subcontractor || 0),
      material: acc.material + (item.material || 0),
      others: acc.others + (item.others || 0),
    }), { effortHours: 0, totalBudget: 0, labor: 0, equipment: 0, subcontractor: 0, material: 0, others: 0 });
  }, [budgetData]);

  return (
    <div className="flex flex-col h-full p-4 outline-none focus:outline-none" onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col flex-grow focus:outline-none">
            
            {/* Fix: Replace 'selectedCount' which was undefined with 'selectedRowIds.size' */}
            <SpreadsheetToolbar
                isAllSelected={isAllSelected}
                handleToggleAll={handleToggleAll}
                toolbarCheckboxRef={toolbarCheckboxRef}
                hasRowSelection={selectedRowIds.size > 0}
                selectedCount={selectedRowIds.size}
                onStyleUpdate={(style) => handleBulkStyleUpdate(style)}
            />
      
            <div className="flex-grow overflow-auto relative select-none" ref={scrollContainerRef}>
            <table 
                className="border-collapse min-w-max table-fixed"
                style={{ fontSize: activeView.fontSize }}
            >
                <SpreadsheetHeader
                    columns={columns}
                    focusedCell={focusedCell}
                    resizingColumnId={resizingColumnId}
                    isScrolled={!scrollState.isAtStart}
                    isAtEnd={scrollState.isAtEnd}
                    fontSize={activeView.fontSize}
                    displayDensity={displayDensity}
                    sort={activeView.sort}
                    onSort={handleSort}
                    onColumnMove={handleColumnMove}
                    onMouseDown={onMouseDown}
                    onContextMenu={(e, colId) => handleContextMenu(e, 'column', colId)}
                />
                
                <tbody>
                {budgetData.map((row) => (
                    <SpreadsheetRow
                        key={row.id}
                        row={row}
                        columns={columns}
                        isSelected={selectedRowIds.has(row.id)}
                        focusedCell={focusedCell}
                        isScrolled={!scrollState.isAtStart}
                        isAtEnd={scrollState.isAtEnd}
                        fontSize={activeView.fontSize}
                        displayDensity={displayDensity}
                        onRowHeaderClick={handleRowHeaderClick}
                        onCellClick={handleCellClick}
                        onContextMenu={handleContextMenu}
                    />
                ))}
                </tbody>
                
                {/* Summary Footer */}
                <tfoot className="bg-gray-100 text-gray-900 border-t-2 border-gray-300 sticky bottom-0 z-30 font-semibold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <tr className="h-8">
                        <td className={`sticky left-0 z-40 border-r border-gray-300 p-0 text-center bg-gray-100 ${!scrollState.isAtStart ? 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}>
                            <div className="flex items-center justify-center h-full" style={{ fontSize: activeView.fontSize }}>Total</div>
                        </td>
                        {columns.map((col) => {
                            let value: React.ReactNode = '';
                            if (col.isTotal) {
                                const key = col.id as keyof typeof totals;
                                const totalVal = totals[key];
                                value = col.id === 'effortHours' ? totalVal : formatCurrency(totalVal);
                            }

                            return (
                                <td 
                                    key={col.id} 
                                    className={`border-r border-gray-300 px-2 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                                >
                                    {value}
                                </td>
                            )
                        })}
                        {/* Empty sticky right cell for alignment */}
                        <td className={`sticky right-0 z-40 border-l border-gray-300 bg-gray-100 w-20 ${!scrollState.isAtEnd ? 'shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}`}></td>
                    </tr>
                </tfoot>
            </table>
            </div>
        </div>
        
        {/* Context Menu */}
        {contextMenu && contextMenu.visible && (
            <ContextMenu
                position={contextMenu.position}
                items={getContextMenuItems()}
                onClose={() => setContextMenu(null)}
            />
        )}
    </div>
  );
};

export default SpreadsheetView;