import React, { Fragment, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { RowActionsMenu } from '../../shared/RowActionsMenu';
import { Task, Status, Column, ColumnId, DisplayDensity, TaskStyle } from '../../../types';
import { EyeIcon, ChevronRightIcon, ChevronDownIcon, DocumentIcon } from '../../common/Icons';
import { StatusDisplay, AssigneeAvatar, StatusSelector, ProgressDisplay } from '../../shared/TaskElements';
import { formatDateForInput, formatDateFromInput, parseDate } from '../../../lib/dateUtils';
import { DatePicker } from '../../common/ui/DatePicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../common/ui/Tooltip';
import { format } from 'date-fns';

interface TableRowProps {
  task: Task;
  level: number;
  onToggle: (taskId: number) => void;
  rowNumberMap: Map<number, number>;
  selectedTaskIds: Set<number>;
  onToggleRow: (taskId: number) => void;
  editingCell: { taskId: number; column: string } | null;
  onEditCell: (cell: { taskId: number; column: string } | null) => void;
  onUpdateTask: (taskId: number, updatedValues: Partial<Omit<Task, 'id' | 'children'>>) => void;
  columns: Column[];
  isScrolled: boolean;
  displayDensity: DisplayDensity;
  showGridLines: boolean;
  onShowDetails: (taskId: number) => void;
  activeDetailedTaskId: number | null;
  taskStyles?: { [taskId: number]: TaskStyle };
}

const getRowHeight = (density: DisplayDensity) => {
  switch (density) {
    case 'compact': return 'h-8';
    case 'standard': return 'h-10';
    case 'comfortable': return 'h-12';
    default: return 'h-8';
  }
};

const SelectionCell: React.FC<{ task: Task, isSelected: boolean, onToggleRow: (id: number) => void, rowNum?: number, isScrolled: boolean, rowHeightClass: string, customBg?: string, customBorder?: string }> = ({ task, isSelected, onToggleRow, rowNum, isScrolled, rowHeightClass, customBg, customBorder }) => {
  const taskNameId = `task-name-${task.id}`;
  const bgClass = isSelected ? 'bg-blue-600 text-white' : 'bg-white group-hover:bg-gray-50';
  
  const cellClasses = `sticky left-0 z-30 ${rowHeightClass} w-[52px] min-w-[52px] max-w-[52px] px-0 text-center border-r border-gray-200 transition-shadow duration-200 cursor-pointer relative box-border ${!customBorder ? 'border-b' : ''} ${bgClass} ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`;

  return (
    <td className={cellClasses} onClick={() => onToggleRow(task.id)} style={{ width: '52px' }}>
        <div className="flex items-center justify-center h-full relative z-20">
            <span className={isSelected ? 'hidden' : 'group-hover:hidden text-gray-500'}>{rowNum}</span>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleRow(task.id)}
              onClick={(e) => { e.stopPropagation(); }}
              aria-labelledby={taskNameId}
              className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mx-auto ${isSelected ? 'block' : 'hidden group-hover:block'}`}
            />
        </div>
        {customBorder && (
            <>
                <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
            </>
        )}
    </td>
  );
};

const NameCellContent: React.FC<{ task: Task, level: number, isEditing: boolean, onEdit: (cell: { taskId: number; column: string } | null) => void, onUpdateTask: TableRowProps['onUpdateTask'], onToggle: (id: number) => void, textColor?: string }> = ({ task, level, isEditing, onEdit, onUpdateTask, onToggle, textColor }) => {
    const hasChildren = task.children && task.children.length > 0;
    const nameInputRef = useRef<HTMLInputElement>(null);
    const taskNameId = `task-name-${task.id}`;

    useEffect(() => {
        if (isEditing) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditing]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => onUpdateTask(task.id, { name: e.target.value });
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') onEdit(null);
    };

    return (
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-1 w-full" style={{ paddingLeft: `${level * 24}px` }}>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                        className="text-gray-400 hover:text-gray-800"
                        aria-expanded={task.isExpanded}
                    >
                        {task.isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                ) : (
                    <DocumentIcon className="w-4 h-4 text-gray-400"/>
                )}
            </div>
            {isEditing ? (
                <input
                    ref={nameInputRef}
                    type="text"
                    value={task.name}
                    onChange={handleNameChange}
                    onBlur={() => onEdit(null)}
                    onKeyDown={handleNameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent border-0 p-0 focus:ring-0 focus:outline-none font-medium"
                    style={{ color: textColor || 'inherit' }}
                />
            ) : (
                <div className="min-w-0">
                  <p id={taskNameId} className="truncate font-medium" style={{ color: textColor || '#1f2937' }} title={task.name}>{task.name}</p>
                </div>
            )}
        </div>
    );
};

const StatusCellContent: React.FC<{ task: Task, isEditing: boolean, onEdit: (cell: { taskId: number; column: string } | null) => void, onUpdateTask: TableRowProps['onUpdateTask'] }> = ({ task, isEditing, onEdit, onUpdateTask }) => {
    const handleStatusChange = (newStatus: Status) => {
        onUpdateTask(task.id, { status: newStatus });
        onEdit(null);
    };

    return isEditing ? (
        <StatusSelector 
            currentStatus={task.status} 
            onChange={handleStatusChange} 
            onBlur={() => onEdit(null)}
            defaultOpen={true}
        />
    ) : (
        <StatusDisplay status={task.status} showChevron={true} />
    );
};

const AssigneeCellContent: React.FC<{ task: Task }> = ({ task }) => (
    <div className="flex items-center -space-x-2 overflow-hidden" title={task.assignees.map(a => a.name).join(', ')}>
        {task.assignees.map(a => <AssigneeAvatar key={a.id} assignee={a} />)}
    </div>
);

const DateCellContent: React.FC<{ task: Task, isEditing: boolean, onEdit: (cell: { taskId: number; column: string } | null) => void, onUpdateTask: TableRowProps['onUpdateTask'], textColor?: string }> = ({ task, isEditing, onEdit, onUpdateTask, textColor }) => {
    const handleDateChange = (date: Date | undefined) => {
        if (date) {
             const day = String(date.getDate()).padStart(2, '0');
             const month = String(date.getMonth() + 1).padStart(2, '0');
             const year = date.getFullYear();
             onUpdateTask(task.id, { startDate: `${day}/${month}/${year}` });
        }
    };

    const parsedDate = task.startDate ? parseDate(task.startDate) : undefined;

    return (
        <div onClick={e => e.stopPropagation()} className="w-full" style={{ color: textColor }}>
             <DatePicker 
                date={parsedDate} 
                setDate={handleDateChange}
                open={isEditing}
                onOpenChange={(isOpen) => {
                    if (isOpen) onEdit({ taskId: task.id, column: 'dates' });
                    else onEdit(null);
                }}
                className="font-medium"
             />
        </div>
    );
};


const TableRow: React.FC<TableRowProps> = ({ task, level, onToggle, rowNumberMap, selectedTaskIds, onToggleRow, editingCell, onEditCell, onUpdateTask, columns, isScrolled, displayDensity, showGridLines, onShowDetails, activeDetailedTaskId, taskStyles }) => {
  const isSelected = selectedTaskIds.has(task.id);
  const rowNum = rowNumberMap.get(task.id);
  const rowHeightClass = getRowHeight(displayDensity);
  const [isLinked, setIsLinked] = useState(false);

  const viewStyle = taskStyles ? taskStyles[task.id] : undefined;
  const customBg = viewStyle?.backgroundColor;
  const customBorder = viewStyle?.borderColor;
  const customText = viewStyle?.textColor;

  const rowStyle: React.CSSProperties = {};
  if (customBg) rowStyle.backgroundColor = customBg;
  if (customText) rowStyle.color = customText;
  
  let rowClasses = 'group';
  if (!customBg) {
     rowClasses += isSelected ? ' bg-blue-50 hover:bg-blue-100' : ' bg-white hover:bg-gray-50';
  }

  const getCellContent = (columnId: ColumnId) => {
      const isEditing = editingCell?.taskId === task.id && editingCell?.column === columnId;
      switch (columnId) {
          case 'name':
              return <NameCellContent task={task} level={level} isEditing={isEditing} onEdit={onEditCell} onUpdateTask={onUpdateTask} onToggle={onToggle} textColor={customText} />;
          case 'status':
              return <StatusCellContent task={task} isEditing={isEditing} onEdit={onEditCell} onUpdateTask={onUpdateTask} />;
          case 'assignee':
              return <AssigneeCellContent task={task} />;
          case 'dates':
              return <DateCellContent task={task} isEditing={isEditing} onEdit={onEditCell} onUpdateTask={onUpdateTask} textColor={customText} />;
          case 'progress':
              return task.progress ? <ProgressDisplay progress={task.progress} /> : null;
          case 'details':
              const isDetailActive = activeDetailedTaskId === task.id;
              return (
                <button 
                    onClick={(e) => { e.stopPropagation(); onShowDetails(task.id); }} 
                    className={`p-1 rounded-md transition-colors ${isDetailActive ? 'text-blue-600 bg-blue-50 ring-1 ring-blue-200' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    aria-label={isDetailActive ? "Close details" : `View details for ${task.name}`}
                >
                    <EyeIcon className="w-5 h-5" />
                </button>
              );
          default:
              return null;
      }
  };
  
  const isColumnEditable = (columnId: ColumnId) => ['name', 'status', 'dates'].includes(columnId);

  return (
    <Fragment>
      <tr className={rowClasses} style={rowStyle}>
        <SelectionCell 
            task={task} 
            isSelected={isSelected} 
            onToggleRow={onToggleRow}
            rowNum={rowNum}
            isScrolled={isScrolled}
            rowHeightClass={rowHeightClass}
            customBg={customBg}
            customBorder={customBorder}
        />
        {columns.map((col, index) => {
            const isLastColumn = index === columns.length - 1;
            const isEditing = editingCell?.taskId === task.id && editingCell?.column === col.id;
            const isEditable = isColumnEditable(col.id);
            
            let cellClasses = `${rowHeightClass} p-0 relative`; 
            if (isEditable) cellClasses += ' cursor-pointer';

            if (!customBorder) {
                cellClasses += ' border-b border-gray-200';
            }
            
            if (showGridLines && !isLastColumn) {
              cellClasses += ' border-r border-gray-200';
            }
            
            if (isEditable) {
                if (isEditing) {
                    cellClasses = cellClasses.replace('border-b border-gray-200', 'border-b-transparent');
                    cellClasses += ' outline-blue-600 outline outline-2 -outline-offset-2 bg-white';
                } else {
                    cellClasses += ' hover:outline-blue-400 hover:outline hover:outline-1 hover:-outline-offset-1';
                }
            }

            let wrapperClass = "flex items-center h-full w-full group relative z-20"; 
            if (col.id === 'details') {
                wrapperClass += " justify-center";
            } else {
                wrapperClass += " px-6";
            }
            
            return (
                 <td 
                    key={col.id}
                    className={cellClasses}
                    onClick={isEditable && !isEditing ? () => onEditCell({ taskId: task.id, column: col.id }) : undefined}
                >
                    <div className={wrapperClass}>
                      {getCellContent(col.id)}
                    </div>
                    {customBorder && (
                        <>
                            <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                            <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                        </>
                    )}
                </td>
            )
        })}
        <td className={`sticky right-0 z-30 w-20 px-2 flex-shrink-0 border-l border-gray-200 transition-shadow duration-200 ${!customBorder ? 'border-b' : ''} ${customBg || (isSelected ? 'bg-blue-50 group-hover:bg-blue-100' : 'bg-white group-hover:bg-gray-50')}`}>
            <div className="flex items-center justify-center h-full relative z-20">
                <RowActionsMenu 
                    onView={() => onShowDetails(task.id)}
                    onLink={() => setIsLinked(!isLinked)}
                    onExport={() => console.log('Export task', task.id)}
                    onAttachments={() => console.log('Attachments for task', task.id)}
                    onDelete={() => console.log('Delete task', task.id)}
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
      {task.children && task.isExpanded && task.children?.map(child => (
        <TableRow 
            key={child.id} 
            task={child} 
            level={level + 1} 
            onToggle={onToggle} 
            rowNumberMap={rowNumberMap}
            selectedTaskIds={selectedTaskIds}
            onToggleRow={onToggleRow}
            editingCell={editingCell}
            onEditCell={onEditCell}
            onUpdateTask={onUpdateTask}
            columns={columns}
            isScrolled={isScrolled}
            displayDensity={displayDensity}
            showGridLines={showGridLines}
            onShowDetails={onShowDetails}
            /* Fix: Use activeDetailedTaskId instead of detailedTaskId which was not in scope. */
            activeDetailedTaskId={activeDetailedTaskId}
            taskStyles={taskStyles}
        />
      ))}
    </Fragment>
  );
};

export default TableRow;