import React, { Fragment } from 'react';
import { Task, Status, Priority } from '../../../types';
import { ChevronRightIcon, ChevronDownIcon, DocumentIcon } from '../../common/Icons';
import { AssigneeAvatar, PrioritySelector } from '../../shared/TaskElements';
import { parseDate, getDaysDiff } from '../../../lib/dateUtils';

interface GanttRowProps {
  task: Task;
  level: number;
  onToggle: (taskId: number) => void;
  projectStartDate: Date;
  dayWidth: number;
  taskListWidth: number;
  onPriorityChange: (taskId: number, priority: Priority) => void;
  rowHeight?: number;
}

const GanttRow: React.FC<GanttRowProps> = ({ task, level, onToggle, projectStartDate, dayWidth, taskListWidth, onPriorityChange, rowHeight = 40 }) => {
  const hasChildren = task.children && task.children.length > 0;
  
  const taskStartDate = parseDate(task.startDate);
  const taskEndDate = parseDate(task.dueDate);
  
  const offsetDays = getDaysDiff(projectStartDate, taskStartDate);
  const durationDays = getDaysDiff(taskStartDate, taskEndDate) + 1;
  
  const offset = offsetDays * dayWidth;
  const width = durationDays * dayWidth - 4; // Subtract a little for padding

  const getTaskColor = (status: Status) => {
      switch(status) {
          case Status.Completed: return 'bg-green-500 border-green-700';
          case Status.InProgress: return 'bg-cyan-500 border-cyan-700';
          case Status.Planned: return 'bg-blue-500 border-blue-700';
          case Status.InReview: return 'bg-yellow-500 border-yellow-700';
          default: return 'bg-sky-400 border-sky-600';
      }
  }

  return (
    <Fragment>
      <div className="flex items-center border-b border-gray-200 hover:bg-gray-50/50 relative" style={{ height: rowHeight }}>
        <div className="flex-shrink-0 flex items-center px-2 border-r border-gray-200 h-full" style={{ width: `${taskListWidth}px`}}>
           <div className="flex items-center w-full" style={{ paddingLeft: `${level * 24}px` }}>
            <button
              onClick={() => hasChildren && onToggle(task.id)}
              className={`mr-1 p-0.5 rounded shrink-0 transition-colors flex items-center justify-center ${hasChildren ? 'hover:bg-blue-100 text-blue-500 hover:text-blue-700' : 'cursor-default text-transparent'}`}
            >
              {hasChildren ? (
                task.isExpanded ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />
              ) : <span className="w-3.5 h-3.5"></span>}
            </button>
            <DocumentIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"/>
            <span className="text-gray-800 truncate mr-auto" style={{ fontSize: '1em' }}>{task.name}</span>
            <div className="ml-2 flex-shrink-0 w-32">
              <PrioritySelector taskId={task.id} currentPriority={task.priority} onPriorityChange={onPriorityChange} />
            </div>
          </div>
        </div>
        <div className="flex-1 h-full absolute" style={{left: `${taskListWidth}px`, right: 0}}>
            <div 
                className={`absolute rounded-md ${getTaskColor(task.status)} flex items-center justify-between px-2 shadow-sm border`}
                style={{ left: `${offset}px`, width: `${width}px`, top: 4, height: rowHeight - 8 }}
                title={`${task.name}: ${task.startDate} - ${task.dueDate}`}
            >
              <div className="flex items-center -space-x-2">
                {task.assignees.slice(0, 2).map(a => <AssigneeAvatar key={a.id} assignee={a} />)}
              </div>
            </div>
        </div>
      </div>
      {hasChildren && task.isExpanded && task.children?.map(child => (
        <GanttRow 
            key={child.id} 
            task={child} 
            level={level + 1} 
            onToggle={onToggle}
            projectStartDate={projectStartDate}
            dayWidth={dayWidth}
            taskListWidth={taskListWidth}
            onPriorityChange={onPriorityChange}
            rowHeight={rowHeight}
        />
      ))}
    </Fragment>
  );
};

export default GanttRow;