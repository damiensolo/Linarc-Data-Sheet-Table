import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColumnId, DisplayDensity, TaskStyle, Task } from '../../../types';
import TableRow from './TableRow';
import { ArrowDownIcon, ArrowUpIcon, SortIcon, ScissorsIcon, CopyIcon, TrashIcon, FillColorIcon, BorderColorIcon, TextColorIcon, ClipboardIcon, SettingsIcon } from '../../common/Icons';
import { useProject } from '../../../context/ProjectContext';
import { useProjectData } from '../../../hooks/useProjectData';
import ViewControls from '../../layout/ViewControls';
import FieldsMenu from '../../layout/FieldsMenu';
import { Popover } from '../../common/ui/Popover';
import ColorPicker from '../../common/ui/ColorPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../common/ui/Tooltip';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../constants/designTokens';
import { Resizer } from '../../common/ui/Resizer';

interface TableViewProps {
  isScrolled: boolean;
  density?: DisplayDensity;
}

const getHeaderHeight = (density: DisplayDensity) => {
  switch (density) {
    case 'compact': return 'h-9';
    case 'standard': return 'h-11';
    case 'comfortable': return 'h-14';
    default: return 'h-9';
  }
};

const TableView: React.FC<TableViewProps> = ({ isScrolled, density }) => {
  const { 
    tasks, 
    activeView, 
    searchTerm, 
    handleToggle, 
    selectedTaskIds,
    setSelectedTaskIds,
    editingCell,
    setEditingCell,
    handleUpdateTask,
    setDetailedTaskId,
    detailedTaskId,
    handleSort,
    updateView,
  } = useProject();
  const { sortedTasks, visibleTaskIds, rowNumberMap } = useProjectData(tasks, activeView, searchTerm);

  const { columns, displayDensity: contextDensity, showGridLines, sort: sortConfig } = activeView;
  const displayDensity = density || contextDensity;

  const toolbarCheckboxRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLTableRowElement>(null);
  const activeResizerId = useRef<ColumnId | null>(null);
  const [resizingColumnId, setResizingColumnId] = useState<ColumnId | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ id: ColumnId; position: 'left' | 'right' } | null>(null);

  const numVisible = visibleTaskIds.length;
  const numSelected = visibleTaskIds.filter(id => selectedTaskIds.has(id)).length;

  const isAllSelected = numVisible > 0 && numSelected === numVisible;
  const isSomeSelected = numSelected > 0 && numSelected < numVisible;

  useEffect(() => {
    if (toolbarCheckboxRef.current) {
      toolbarCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleToggleRow = (taskId: number) => {
    setSelectedTaskIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(taskId)) newSet.delete(taskId);
        else newSet.add(taskId);
        return newSet;
    });
  };

  const handleToggleAll = () => {
      if (isAllSelected) {
          setSelectedTaskIds(new Set());
      } else {
          setSelectedTaskIds(new Set(visibleTaskIds));
      }
  };

  const handleBulkStyleUpdate = (newStyle: Partial<TaskStyle>) => {
    const newStyles: Record<number, TaskStyle> = { ...(activeView.taskStyles || {}) };
    const selectedIds = Array.from(selectedTaskIds);

    for (const tId of selectedIds) {
        const taskId = tId as number;
        const currentStyle = newStyles[taskId] || {};
        const mergedStyle = { ...currentStyle, ...newStyle };
        
        if (newStyle.backgroundColor === undefined) delete mergedStyle.backgroundColor;
        if (newStyle.borderColor === undefined) delete mergedStyle.borderColor;
        if (newStyle.textColor === undefined) delete mergedStyle.textColor;

        if (Object.keys(mergedStyle).length > 0) {
            newStyles[taskId] = mergedStyle;
        } else {
            delete newStyles[taskId];
        }
    }
    updateView({ taskStyles: newStyles });
  };

  const handleResize = useCallback((columnId: ColumnId, newWidth: number) => {
    const updatedColumns = columns.map(c => c.id === columnId ? { ...c, width: `${newWidth}px` } : c);
    updateView({ columns: updatedColumns });
  }, [columns, updateView]);

  const onMouseDown = (columnId: ColumnId, minWidth: number | undefined) => (e: React.MouseEvent) => {
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
      if (newWidth > (minWidth ?? 60)) {
        handleResize(columnId, newWidth);
      }
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
  
  const handleDragStartHeader = (e: React.DragEvent, columnId: ColumnId) => {
    e.dataTransfer.setData('text/plain', columnId);
    e.dataTransfer.effectAllowed = 'move';

    const target = e.currentTarget as HTMLElement;
    const ghost = target.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.width = `${target.offsetWidth}px`;
    ghost.style.height = `${target.offsetHeight}px`;
    ghost.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    ghost.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  
  const handleDragOverHeader = (e: React.DragEvent, columnId: ColumnId) => {
      e.preventDefault();
      const sourceColumnId = e.dataTransfer.types.includes('text/plain') ? e.dataTransfer.getData('text/plain') : null;
      if (sourceColumnId === columnId) {
          setDropIndicator(null);
          return;
      }

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const isRightHalf = e.clientX > rect.left + rect.width / 2;
      setDropIndicator({ id: columnId, position: isRightHalf ? 'right' : 'left' });
  };
  
  const handleDropHeader = (e: React.DragEvent, targetColumnId: ColumnId) => {
      e.preventDefault();
      const sourceColumnId = e.dataTransfer.getData('text/plain') as ColumnId;
      setDropIndicator(null);

      if (sourceColumnId && sourceColumnId !== targetColumnId) {
           const newCols = [...columns];
           const sIndex = newCols.findIndex(c => c.id === sourceColumnId);
           let tIndex = newCols.findIndex(c => c.id === targetColumnId);
           
           if(dropIndicator?.position === 'right') {
               tIndex++;
           }
           if(sIndex < tIndex) {
               tIndex--;
           }
           const [moved] = newCols.splice(sIndex, 1);
           newCols.splice(tIndex, 0, moved);
           
           updateView({ columns: newCols });
      }
  };

  const handleShowDetails = (taskId: number) => {
    setDetailedTaskId(prev => prev === taskId ? null : taskId);
  };

  const visibleColumns = columns.filter(c => c.visible);
  const headerHeightClass = getHeaderHeight(displayDensity);
  const hasSelection = selectedTaskIds.size > 0;

  return (
    <div className="flex flex-col h-full p-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col flex-grow">
            
            <div className="flex items-center h-14 border-b border-gray-200 bg-white flex-shrink-0 transition-all z-50 relative pr-4">
                 <div className="w-[52px] min-w-[52px] max-w-[52px] flex items-center justify-center flex-shrink-0 border-r border-gray-200" style={{ width: '52px', minWidth: '52px', maxWidth: '52px' }}>
                     <input 
                        type="checkbox" 
                        checked={isAllSelected} 
                        onChange={handleToggleAll} 
                        ref={toolbarCheckboxRef}
                        aria-label="Select all visible rows"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     />
                 </div>

                 <div className="flex-1 pl-4 flex items-center">
                    <AnimatePresence mode="wait">
                    {hasSelection ? (
                        <motion.div 
                            key="actions"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-4 flex-1"
                        >
                            <TooltipProvider>
                                <div className="flex items-center gap-1 p-1.5 rounded-lg">
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <ScissorsIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Cut</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <CopyIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copy</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <ClipboardIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Paste</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all shadow-sm border border-transparent hover:border-red-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete</TooltipContent>
                                    </Tooltip>
                                    
                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                    
                                    <ColorPicker 
                                        icon={<FillColorIcon className="w-5 h-5" />} 
                                        label="Background" 
                                        onColorSelect={(color) => handleBulkStyleUpdate({ backgroundColor: color })} 
                                        presets={BACKGROUND_COLORS}
                                    />
                                    <ColorPicker 
                                        icon={<BorderColorIcon className="w-5 h-5" />} 
                                        label="Border" 
                                        onColorSelect={(color) => handleBulkStyleUpdate({ borderColor: color })} 
                                        presets={TEXT_BORDER_COLORS}
                                    />
                                    <ColorPicker 
                                        icon={<TextColorIcon className="w-5 h-5" />} 
                                        label="Text" 
                                        onColorSelect={(color) => handleBulkStyleUpdate({ textColor: color })} 
                                        presets={TEXT_BORDER_COLORS}
                                    />
                                </div>
                            </TooltipProvider>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                {selectedTaskIds.size} selected
                            </span>
                        </motion.div>
                    ) : (
                         <motion.div
                            key="controls"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                         >
                            <ViewControls />
                         </motion.div>
                    )}
                    </AnimatePresence>
                    
                    {!hasSelection && (
                        <div className="ml-auto pl-4 border-l border-gray-200 h-6 flex items-center">
                             <Popover
                                trigger={
                                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                        <SettingsIcon className="w-4 h-4" />
                                    </button>
                                }
                                content={
                                    <FieldsMenu onClose={() => {}} disableClickOutside className="right-0 mt-2" />
                                }
                                align="end"
                             />
                        </div>
                    )}
                 </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table 
                    className="w-full table-fixed text-left text-gray-500 whitespace-nowrap border-collapse"
                    style={{ fontSize: activeView.fontSize }}
                >
                    <colgroup>
                        <col style={{ width: '52px', minWidth: '52px', maxWidth: '52px' }} />
                        {visibleColumns.map(col => <col key={col.id} style={{ width: col.width }} />)}
                        <col style={{ width: '80px' }} />
                    </colgroup>
                <thead className={`uppercase bg-gray-50 sticky top-0 z-40 transition-shadow duration-200 ${isScrolled ? 'shadow-[0_4px_6px_-2px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)]' : ''}`}>
                    <tr ref={headerRef}>
                    <th scope="col" className={`sticky left-0 bg-gray-50 z-50 ${headerHeightClass} w-[52px] min-w-[52px] max-w-[52px] px-0 border-r border-gray-200 transition-all duration-200 box-border ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`} style={{ boxShadow: 'inset 0 -1px 0 #e5e7eb', width: '52px' }}>
                        <div className="flex items-center justify-center h-full font-semibold text-gray-500">
                            #
                        </div>
                    </th>
                    {visibleColumns.map((col, index) => {
                        const isLastVisibleColumn = index === visibleColumns.length - 1;
                        return (
                        <th 
                            key={col.id} 
                            scope="col" 
                            className={`${headerHeightClass} px-6 font-semibold relative group cursor-pointer align-middle text-gray-700 ${showGridLines && !isLastVisibleColumn ? 'border-r border-gray-200' : ''}`}
                            style={{ width: col.width, zIndex: 30, boxShadow: 'inset 0 -1px 0 #e5e7eb' }}
                            onClick={() => {
                                if (col.id === 'details') return;
                                handleSort(col.id);
                            }}
                            draggable
                            onDragStart={(e) => handleDragStartHeader(e, col.id)}
                            onDragOver={(e) => handleDragOverHeader(e, col.id)}
                            onDrop={(e) => handleDropHeader(e, col.id)}
                            onDragLeave={() => setDropIndicator(null)}
                        >
                            {dropIndicator?.id === col.id && (
                            <div className={`absolute top-0 h-full w-1 bg-blue-500 rounded-full ${dropIndicator.position === 'left' ? 'left-0' : 'right-0'}`} style={{ zIndex: 20 }} />
                            )}
                            <div className={`flex items-center gap-1 ${col.id === 'details' ? 'justify-center' : ''} overflow-hidden`}>
                            <span className="truncate">{col.label}</span>
                            {sortConfig?.columnId === col.id ? (
                                sortConfig.direction === 'asc' ? 
                                <ArrowUpIcon className="w-4 h-4 text-gray-600 flex-shrink-0" /> : 
                                <ArrowDownIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            ) : (
                                col.id !== 'details' && <SortIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            )}
                            </div>
                            <Resizer onMouseDown={onMouseDown(col.id, col.minWidth)} isActive={resizingColumnId === col.id} />
                        </th>
                        );
                    })}
                    <th scope="col" className={`sticky right-0 bg-gray-50 z-50 ${headerHeightClass} w-20 px-2 border-l border-gray-200 transition-all duration-200`} style={{ boxShadow: 'inset 0 -1px 0 #e5e7eb' }}>
                        <div className="flex items-center justify-center h-full font-semibold text-gray-700">
                            Actions
                        </div>
                    </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map((task) => (
                    <TableRow 
                        key={task.id} 
                        task={task} 
                        level={0} 
                        columns={visibleColumns}
                        onToggle={handleToggle} 
                        rowNumberMap={rowNumberMap}
                        selectedTaskIds={selectedTaskIds}
                        onToggleRow={handleToggleRow}
                        editingCell={editingCell}
                        onEditCell={setEditingCell}
                        onUpdateTask={handleUpdateTask}
                        isScrolled={isScrolled}
                        displayDensity={displayDensity}
                        showGridLines={showGridLines}
                        onShowDetails={handleShowDetails}
                        activeDetailedTaskId={detailedTaskId}
                        taskStyles={activeView.taskStyles}
                        filters={activeView.filters}
                    />
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default TableView;