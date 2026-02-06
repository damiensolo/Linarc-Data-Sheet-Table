import React from 'react';
import { Task, DisplayDensity } from '../../../types';
import GanttRow from './GanttRow';
import { parseDate, getDaysDiff, addDays } from '../../../lib/dateUtils';
import { useProject } from '../../../context/ProjectContext';
import { useProjectData } from '../../../hooks/useProjectData';
import ViewControls from '../../layout/ViewControls';
import FieldsMenu from '../../layout/FieldsMenu';
import { Popover } from '../../common/ui/Popover';
import { SettingsIcon } from '../../common/Icons';

const getRowHeight = (density: DisplayDensity): number => {
  switch (density) {
    case 'compact': return 32;
    case 'standard': return 40;
    case 'comfortable': return 48;
    default: return 40;
  }
};

// Header height is fixed so density only affects task rows
const GANTT_HEADER_MONTH_ROW_HEIGHT = 28;
const GANTT_HEADER_DAY_ROW_HEIGHT = 40; // day letter + date need room + padding
const GANTT_HEADER_HEIGHT = GANTT_HEADER_MONTH_ROW_HEIGHT + GANTT_HEADER_DAY_ROW_HEIGHT;

const GanttView: React.FC = () => {
    const { 
        tasks, activeView, searchTerm, handleToggle, handlePriorityChange
    } = useProject();
    const { displayDensity, fontSize } = activeView;
    const { sortedTasks } = useProjectData(tasks, activeView, searchTerm);
    const rowHeight = getRowHeight(displayDensity);

    const flatten = (tasks: Task[]): Task[] => tasks.reduce((acc, task) => {
        acc.push(task);
        if (task.children) acc.push(...flatten(task.children));
        return acc;
    }, [] as Task[]);
    
    const allTasks = flatten(sortedTasks);

    if (allTasks.length === 0) return (
        <div className="h-full flex flex-col p-4 gap-4">
            <ViewControls />
            <div className="p-4">No tasks to display.</div>
        </div>
    );

    const projectStartDate = allTasks.reduce((min, task) => {
        const d = parseDate(task.startDate);
        return d < min ? d : min;
    }, parseDate(allTasks[0].startDate));

    const projectEndDate = allTasks.reduce((max, task) => {
        const d = parseDate(task.dueDate);
        return d > max ? d : max;
    }, parseDate(allTasks[0].dueDate));

    const totalDays = getDaysDiff(projectStartDate, projectEndDate) + 1;
    const dayWidth = 40;
    const taskListWidth = 350;

    const timelineHeaders: { month: string; year: number; days: number }[] = [];
    let currentDate = new Date(projectStartDate);
    while (currentDate <= projectEndDate) {
        const month = currentDate.toLocaleString('default', { month: 'short' });
        const year = currentDate.getFullYear();
        
        let header = timelineHeaders.find(h => h.month === month && h.year === year);
        if (!header) {
            header = { month, year, days: 0 };
            timelineHeaders.push(header);
        }
        header.days += 1;
        currentDate = addDays(currentDate, 1);
    }

    return (
        <div className="h-full flex flex-col p-4 gap-4">
            <div className="flex items-center gap-2">
                <ViewControls />
                <div className="ml-auto flex items-center">
                    <Popover
                        trigger={
                            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" aria-label="View settings">
                                <SettingsIcon className="w-4 h-4" />
                            </button>
                        }
                        content={
                            <FieldsMenu onClose={() => {}} disableClickOutside className="right-0 mt-2" />
                        }
                        align="end"
                    />
                </div>
            </div>

            <div className="flex-grow bg-white border border-gray-200 rounded-lg shadow-sm overflow-auto relative" style={{ fontSize: `${fontSize}px` }}>
                <div className="relative" style={{ minWidth: `${totalDays * dayWidth + taskListWidth}px` }}>
                    <div className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                        <div className="flex" style={{ height: GANTT_HEADER_HEIGHT }}>
                            <div className="font-medium text-gray-600 flex items-center p-4 border-r border-gray-200" style={{ width: `${taskListWidth}px`}}>Task Name</div>
                            <div className="flex-1">
                                <div className="relative flex border-b border-gray-200" style={{ height: GANTT_HEADER_MONTH_ROW_HEIGHT }}>
                                    {timelineHeaders.map(({ month, year, days }) => (
                                        <div key={`${month}-${year}`} className="text-center font-medium text-gray-700 border-r border-gray-200 flex items-center justify-center pt-2 pb-1.5 px-0" style={{ width: `${days * dayWidth}px` }}>
                                            {month} '{String(year).slice(-2)}
                                        </div>
                                    ))}
                                </div>
                                 <div className="relative flex" style={{ height: GANTT_HEADER_DAY_ROW_HEIGHT }}>
                                    {Array.from({ length: totalDays }).map((_, i) => {
                                        const date = addDays(projectStartDate, i);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const dayOfWeek = date.toLocaleDateString('default', { weekday: 'short' })[0];
                                        return (
                                            <div key={i} className={`flex flex-col items-center justify-center border-r border-gray-200 pt-2 pb-2 px-0 gap-0.5 ${isWeekend ? 'bg-gray-100' : ''}`} style={{ width: `${dayWidth}px` }}>
                                                <span className="text-gray-400 leading-tight" style={{ fontSize: '0.75em' }}>{dayOfWeek}</span>
                                                <span className="leading-tight">{date.getDate()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute top-0 h-full grid" style={{ left: `${taskListWidth}px`, gridTemplateColumns: `repeat(${totalDays}, ${dayWidth}px)`, width: `${totalDays * dayWidth}px`}}>
                             {Array.from({ length: totalDays }).map((_, i) => {
                                const date = addDays(projectStartDate, i);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                 return <div key={i} className={`h-full border-r border-gray-200 ${isWeekend ? 'bg-gray-100/50' : ''}`}></div>
                             })}
                        </div>

                        <div>
                            {sortedTasks.map(task => (
                                <GanttRow
                                    key={task.id}
                                    task={task}
                                    level={0}
                                    onToggle={handleToggle}
                                    projectStartDate={projectStartDate}
                                    dayWidth={dayWidth}
                                    taskListWidth={taskListWidth}
                                    onPriorityChange={handlePriorityChange}
                                    rowHeight={rowHeight}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttView;