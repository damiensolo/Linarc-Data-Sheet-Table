
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LookaheadTask, Constraint, ConstraintStatus, ConstraintType, WeatherForecast } from './types';
import { PLANNER_TASKS, MOCK_WEATHER } from './constants';
import { parseLookaheadDate, getDaysDiff, addDays, formatDateISO } from '../../../lib/dateUtils';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, SunIcon, CloudIcon, CloudRainIcon } from '../../common/Icons';
import ConstraintBadge from './components/ConstraintBadge';
import ManHoursBar from './components/ManHoursBar';
import DraggableTaskBar from './components/DraggableTaskBar';
import LookaheadDetailsPanel from './components/LookaheadDetailsPanel';
import DailyMetricsPanel from './components/DailyMetricsPanel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../common/ui/Tooltip';
import { useProject } from '../../../context/ProjectContext';
import { DisplayDensity } from '../../../types';
import ViewControls from '../../layout/ViewControls';
import FieldsMenu from '../../layout/FieldsMenu';
import { Popover } from '../../common/ui/Popover';
import { SettingsIcon } from '../../common/Icons';

const WeatherIcon: React.FC<{ icon: 'sun' | 'cloud' | 'rain' }> = ({ icon }) => {
    switch (icon) {
        case 'sun': return <SunIcon className="w-4 h-4 text-yellow-500" />;
        case 'cloud': return <CloudIcon className="w-4 h-4 text-gray-500" />;
        case 'rain': return <CloudRainIcon className="w-4 h-4 text-blue-500" />;
        default: return null;
    }
};

const DAY_WIDTH = 40;
const NUMBERS_CHECKBOX_COLUMN_WIDTH = 56; // # column + checkbox, same as table w-14

const getRowHeight = (density: DisplayDensity) => {
  switch (density) {
    case 'compact': return 32;
    case 'standard': return 38;
    case 'comfortable': return 48;
    default: return 38;
  }
};

// Mapping from Generic Column ID to Lookahead specific logic
type LookaheadColumnType = 'id' | 'name' | 'resource' | 'health' | 'manHours';

const COLUMN_MAPPING: Record<string, LookaheadColumnType> = {
    details: 'id',
    name: 'name',
    assignee: 'resource',
    status: 'health',
    progress: 'manHours',
};

const LookaheadView: React.FC = () => {
    const { 
        activeView, setColumns
    } = useProject();
    const { columns, displayDensity, fontSize } = activeView;

    const [plannerTasks, setPlannerTasks] = useState<LookaheadTask[]>(PLANNER_TASKS);
    const [selectedTask, setSelectedTask] = useState<LookaheadTask | null>(null);
    const [selectedDay, setSelectedDay] = useState<{ task: LookaheadTask; date: Date } | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string | number>>(new Set());
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const container = scrollContainerRef.current;
        const handleScroll = () => {
            if (container) {
                setIsScrolled(container.scrollLeft > 0);
            }
        };
        container?.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    const visiblePanelColumns = useMemo(() => {
        return columns
            .filter(col => col.visible && COLUMN_MAPPING[col.id])
            .map(col => ({
                ...col,
                lookaheadType: COLUMN_MAPPING[col.id]!,
                widthPx: parseInt(col.width || '100', 10) || 100
            }));
    }, [columns]);

    const totalLeftPanelWidth = useMemo(() => visiblePanelColumns.reduce((sum, col) => sum + col.widthPx, 0), [visiblePanelColumns]);
    const totalLeftWidth = NUMBERS_CHECKBOX_COLUMN_WIDTH + totalLeftPanelWidth;
    const rowHeight = getRowHeight(displayDensity);

    // Row numbers for visible rows (respecting expansion, same order as renderTaskRows)
    const rowNumberMap = useMemo(() => {
        const map = new Map<string | number, number>();
        let n = 0;
        const visit = (tasks: LookaheadTask[]) => {
            tasks.forEach(t => {
                n += 1;
                map.set(t.id, n);
                if (t.isExpanded && t.children?.length) visit(t.children);
            });
        };
        visit(plannerTasks);
        return map;
    }, [plannerTasks]);

    const handleToggleRow = useCallback((taskId: string | number) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string, currentWidth: number) => {
        e.preventDefault();

        const startX = e.clientX;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const moveHandler = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(currentWidth + deltaX, 40);
             setColumns(prev => prev.map(c => c.id === columnId ? { ...c, width: `${newWidth}px` } : c));
        };

        const upHandler = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }, [setColumns]);


    const { projectStartDate, projectEndDate, totalDays } = useMemo(() => {
        const allTasks: LookaheadTask[] = [];
        const flatten = (tasks: LookaheadTask[]) => {
            tasks.forEach(t => {
                allTasks.push(t);
                if (t.children) flatten(t.children);
            });
        };
        flatten(plannerTasks);
        if (allTasks.length === 0) return { projectStartDate: new Date(), projectEndDate: new Date(), totalDays: 0 };

        const start = allTasks.reduce((min, t) => parseLookaheadDate(t.startDate) < min ? parseLookaheadDate(t.startDate) : min, parseLookaheadDate(allTasks[0].startDate));
        const end = allTasks.reduce((max, t) => parseLookaheadDate(t.finishDate) > max ? parseLookaheadDate(t.finishDate) : max, parseLookaheadDate(allTasks[0].finishDate));
        
        return {
            projectStartDate: start,
            projectEndDate: end,
            totalDays: getDaysDiff(start, end) + 1,
        };
    }, [plannerTasks]);

    const weatherByDate = useMemo(() => new Map<string, WeatherForecast>(MOCK_WEATHER.map(w => [w.date, w])), []);

    const handleToggle = (taskId: string | number) => {
        const toggleRecursively = (tasks: LookaheadTask[]): LookaheadTask[] => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, isExpanded: !task.isExpanded };
                }
                if (task.children) {
                    return { ...task, children: toggleRecursively(task.children) };
                }
                return task;
            });
        };
        setPlannerTasks(prev => toggleRecursively(prev));
    };

    const handleAddConstraint = (taskId: string | number, newConstraint: Constraint) => {
        const addConstraintRecursively = (tasks: LookaheadTask[]): LookaheadTask[] => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    const updatedConstraints = [...task.constraints, newConstraint];
                    const newStatus = { ...task.status };
                    if (newConstraint.severity === 'Blocking') {
                        newStatus[newConstraint.type] = ConstraintStatus.Overdue;
                    } else if (newConstraint.severity === 'Warning' && newStatus[newConstraint.type] === ConstraintStatus.Complete) {
                        newStatus[newConstraint.type] = ConstraintStatus.Pending;
                    }
                    
                    const updatedTask = {
                        ...task,
                        constraints: updatedConstraints,
                        status: newStatus,
                    };
    
                    if (selectedTask && selectedTask.id === taskId) {
                        setSelectedTask(updatedTask);
                    }
                    return updatedTask;
                }
                if (task.children) {
                    return { ...task, children: addConstraintRecursively(task.children) };
                }
                return task;
            });
        };
        setPlannerTasks(prev => addConstraintRecursively(prev));
    };

    const handleUpdateTaskDates = useCallback((taskId: string | number, newStart: string, newFinish: string) => {
        const updateRecursively = (tasks: LookaheadTask[]): LookaheadTask[] => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    return {
                        ...task,
                        startDate: newStart,
                        finishDate: newFinish,
                    };
                }
                if (task.children) {
                    return { ...task, children: updateRecursively(task.children) };
                }
                return task;
            });
        };
        setPlannerTasks(prev => updateRecursively(prev));
    }, []);
    
    const handleDayClick = useCallback((task: LookaheadTask, date: Date) => {
        setSelectedTask(null);
        setSelectedDay({ task, date });
    }, []);
    
    const handleConstraintBadgeClick = useCallback((task: LookaheadTask) => {
        setSelectedDay(null);
        setSelectedTask(task);
    }, []);


    const weekHeaders: { label: string; days: number }[] = [];
    let currentDate = new Date(projectStartDate);
    while (currentDate <= projectEndDate) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = addDays(weekStart, 6);
        const label = `${weekStart.toLocaleString('default', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.toLocaleString('default', { month: 'short' })} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        
        let daysInWeek = 0;
        for (let i = 0; i < 7 && addDays(currentDate, i) <= projectEndDate; i++) {
            daysInWeek++;
        }

        weekHeaders.push({ label, days: daysInWeek });
        currentDate = addDays(currentDate, daysInWeek);
    }

    const renderCell = (type: LookaheadColumnType, task: LookaheadTask, level: number) => {
        switch (type) {
            case 'id':
                 return (
                    <>
                    {task.isCriticalPath && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600" />}
                    {task.isCriticalPath ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="w-full h-full flex items-center justify-center cursor-help">
                                        <span className="font-medium text-red-900">{task.id}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right"><p className="font-semibold">Critical Task</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : <span className="text-gray-500">{task.id}</span>}
                    </>
                 );
            case 'name':
                return (
                    <div className="flex items-center w-full overflow-hidden" style={{ paddingLeft: `${8 + (level * 24)}px`}}>
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mr-1">
                            {task.children ? (
                                <button onClick={() => handleToggle(task.id)} className="text-gray-400 hover:text-gray-800">
                                    {task.isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                </button>
                            ) : <DocumentIcon className="w-4 h-4 text-gray-400"/>}
                        </div>
                        <span className="truncate font-medium text-gray-800" style={{ fontSize: '1em' }} title={task.name}>{task.name}</span>
                    </div>
                );
            case 'resource':
                return <span className="truncate" title={task.resource}>{task.resource}</span>;
            case 'health':
                return <ConstraintBadge status={task.status} onClick={() => handleConstraintBadgeClick(task)} />;
            case 'manHours':
                return <ManHoursBar manHours={task.manHours} />;
            default:
                return null;
        }
    };
    
    const renderTaskRows = (tasks: LookaheadTask[], level: number): React.ReactNode[] => {
        return tasks.flatMap(task => {
            const isSelected = selectedTaskIds.has(task.id);
            const rowNum = rowNumberMap.get(task.id);
            const row = (
                <div key={task.id} className="flex border-b border-gray-200 first:border-t group" style={{ height: `${rowHeight}px`}}>
                    {/* Left Panel: #/checkbox column + data columns */}
                    <div className={`sticky left-0 z-30 flex border-r-2 border-gray-200 transition-shadow ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`} style={{ width: `${totalLeftWidth}px` }}>
                        {/* Numbers + Checkbox column */}
                        <div
                            className={`flex-shrink-0 w-14 flex items-center justify-center border-r border-gray-200 cursor-pointer ${isSelected ? 'bg-blue-600 text-white' : 'bg-white group-hover:bg-gray-50'}`}
                            onClick={() => handleToggleRow(task.id)}
                        >
                            <span className={isSelected ? 'hidden' : 'group-hover:hidden text-gray-500'} style={{ fontSize: '1em' }}>{rowNum}</span>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRow(task.id)}
                                onClick={(e) => e.stopPropagation()}
                                className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${isSelected ? 'block' : 'hidden group-hover:block'}`}
                                aria-label={`Select task ${task.name}`}
                            />
                        </div>
                        {visiblePanelColumns.map((col, index) => (
                             <div 
                                key={col.id} 
                                className={`flex-shrink-0 flex items-center px-2 overflow-hidden relative ${index > 0 ? 'border-l border-gray-200' : ''} ${col.lookaheadType === 'id' && task.isCriticalPath ? 'bg-red-50' : ''} ${col.lookaheadType === 'id' ? 'justify-center' : ''} bg-white`}
                                style={{ fontSize: '1em', width: `${col.widthPx}px` }}
                            >
                                {renderCell(col.lookaheadType, task, level)}
                             </div>
                        ))}
                    </div>
                    {/* Right Panel (Timeline) */}
                    <div className="relative flex-grow flex">
                        <DraggableTaskBar
                            task={task}
                            projectStartDate={projectStartDate}
                            dayWidth={DAY_WIDTH}
                            onUpdateTask={handleUpdateTaskDates}
                            onDayClick={handleDayClick}
                            offsetLeft={DAY_WIDTH} // Add offset for the padding column
                        />
                    </div>
                </div>
            );
            return [row, task.isExpanded && task.children ? renderTaskRows(task.children, level + 1) : []];
        });
    };

    const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
        <div onMouseDown={onMouseDown} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300 z-20" />
    );

    return (
        <div className="flex h-full flex-col p-4 gap-4">
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
            
            <div className="flex-grow flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative" style={{ fontSize: `${fontSize}px` }}>
                {/* Main Planner */}
                <div className="flex-grow overflow-hidden relative flex">
                    <div ref={scrollContainerRef} className="flex-grow overflow-auto min-w-0">
                        <div className="relative" style={{ minWidth: `${totalLeftWidth + (totalDays * DAY_WIDTH) + DAY_WIDTH}px`}}>
                            {/* Unified Background Grid */}
                            <div
                                className="absolute top-0 left-0 w-full h-full pt-[80px] flex"
                                style={{ zIndex: 0 }}
                                aria-hidden="true"
                            >
                                <div style={{ width: `${totalLeftWidth}px` }} className="flex-shrink-0 sticky left-0 bg-white z-10"></div>
                                <div
                                    className="flex-grow grid"
                                    style={{ gridTemplateColumns: `${DAY_WIDTH}px repeat(${totalDays}, ${DAY_WIDTH}px)` }}
                                >
                                    {/* Padding Block */}
                                    <div className="h-full border-r border-gray-200 bg-gray-50/50"></div>
                                    {Array.from({ length: totalDays }).map((_, i) => {
                                        const date = addDays(projectStartDate, i);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        return (
                                            <div key={i} className={`h-full border-r border-gray-100 ${isWeekend ? 'bg-gray-50' : ''}`}></div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Header */}
                            <div className="sticky top-0 bg-gray-50 z-40 font-semibold text-gray-600 uppercase border-b border-t border-gray-200" style={{ fontSize: '0.875em' }}>
                                <div className="flex border-b border-gray-200" style={{ height: '30px' }}>
                                    <div className={`sticky left-0 bg-gray-50 flex border-r-2 border-gray-200 transition-shadow ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`} style={{ width: `${totalLeftWidth}px` }} />
                                    <div className="flex-grow flex">
                                        {/* Padding Block */}
                                        <div className="flex-shrink-0 border-r border-gray-200 bg-gray-50/50" style={{ width: `${DAY_WIDTH}px` }}></div>
                                        {weekHeaders.map((week, i) => (
                                            <div key={i} className="flex items-center justify-center border-r border-gray-200" style={{ width: `${week.days * DAY_WIDTH}px`}}>{week.label}</div>
                                        ))}
                                    </div>
                                </div>
                                 <div className="flex" style={{ height: '50px' }}>
                                     <div className={`sticky left-0 bg-gray-50 flex border-r-2 border-gray-200 transition-shadow ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`} style={{ width: `${totalLeftWidth}px` }}>
                                        <div className="flex-shrink-0 w-14 flex items-end justify-center pb-1 border-r border-gray-200">
                                            #
                                        </div>
                                        {visiblePanelColumns.map((col, index) => (
                                            <div 
                                                key={col.id} 
                                                className={`relative flex-shrink-0 px-2 flex items-end pb-1 ${index > 0 ? 'border-l border-gray-200' : ''} ${col.lookaheadType === 'id' ? 'justify-center' : ''}`}
                                                style={{ width: `${col.widthPx}px` }}
                                            >
                                                {col.lookaheadType === 'id' ? 'ID' : col.label}
                                                <Resizer onMouseDown={(e) => handleMouseDown(e, col.id, col.widthPx)} />
                                            </div>
                                        ))}
                                     </div>
                                     <div
                                        className="flex-grow grid"
                                        style={{ gridTemplateColumns: `${DAY_WIDTH}px repeat(${totalDays}, ${DAY_WIDTH}px)` }}
                                    >
                                        {/* Padding Block */}
                                        <div className="border-r border-gray-200 bg-gray-50/50"></div>
                                        {Array.from({length: totalDays}).map((_, i) => {
                                            const date = addDays(projectStartDate, i);
                                            const dateString = formatDateISO(date);
                                            const forecast = weatherByDate.get(dateString);
                                            return (
                                                <div key={i} className="flex flex-col items-center justify-between py-1 border-r border-gray-200">
                                                    <div className="flex items-center">
                                                        <span className="text-gray-400 mr-0.5" style={{ fontSize: '0.75em' }}>{date.toLocaleString('default', { weekday: 'short' })[0]}</span>
                                                        <span className="font-normal">{date.getDate()}</span>
                                                    </div>
                                                    <div className="h-7 flex flex-col items-center justify-center">
                                                        {forecast ? (
                                                            <div className="flex flex-col items-center" title={`${forecast.temp}°F`}>
                                                                <WeatherIcon icon={forecast.icon} />
                                                                <span className="font-medium text-gray-600" style={{ fontSize: '0.75em' }}>{forecast.temp}°</span>
                                                            </div>
                                                        ) : <div style={{height: '28px'}}></div>}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                     </div>
                                 </div>
                            </div>

                            {/* Body */}
                            <div className="relative z-10">
                                {renderTaskRows(plannerTasks, 0)}
                            </div>
                        </div>
                    </div>
                    <LookaheadDetailsPanel task={selectedTask} onClose={() => setSelectedTask(null)} onAddConstraint={handleAddConstraint} />
                    <DailyMetricsPanel data={selectedDay} onClose={() => setSelectedDay(null)} />
                </div>
            </div>
        </div>
    );
};

export default LookaheadView;
