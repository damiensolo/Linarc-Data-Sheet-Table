
import React, { useCallback, useEffect, useState } from 'react';
import { LookaheadTask } from '../types';
import { addDays, formatDateISO, getDaysDiff, parseLookaheadDate } from '../../../../lib/dateUtils';

interface DraggableTaskBarProps {
    task: LookaheadTask;
    projectStartDate: Date;
    dayWidth: number;
    onUpdateTask: (taskId: string | number, newStart: string, newFinish: string) => void;
    onDayClick: (task: LookaheadTask, date: Date) => void;
    offsetLeft?: number;
}

const DraggableTaskBar: React.FC<DraggableTaskBarProps> = ({ task, projectStartDate, dayWidth, onUpdateTask, onDayClick, offsetLeft = 0 }) => {
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize-left' | 'resize-right';
        startX: number;
        originalTask: LookaheadTask;
    } | null>(null);
    
    const isCritical = !!task.isCriticalPath;
    
    // Updated Color Logic: Neutral for standard, Red for critical path
    const styles = isCritical ? {
        bar: 'bg-red-50 border-red-200',
        progress: 'bg-red-600',
        wrapper: 'z-20' // Critical path slightly elevated
    } : {
        bar: 'bg-slate-100 border-slate-300',
        progress: 'bg-slate-400',
        wrapper: 'z-10'
    };

    const taskStart = parseLookaheadDate(task.startDate);
    const taskEnd = parseLookaheadDate(task.finishDate);
    const offsetDays = getDaysDiff(projectStartDate, taskStart);
    const durationDays = getDaysDiff(taskStart, taskEnd) + 1;
    const progressPercent = task.manHours.budget > 0 ? (task.manHours.actual / task.manHours.budget) * 100 : 0;
    const displayProgressPercent = Math.min(100, progressPercent);

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
        e.preventDefault();
        e.stopPropagation();
        document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
        document.body.style.userSelect = 'none';
        setDragState({
            type,
            startX: e.clientX,
            originalTask: task,
        });
    };
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState) return;

        const deltaX = e.clientX - dragState.startX;
        const dayDelta = Math.round(deltaX / dayWidth);

        const originalStart = parseLookaheadDate(dragState.originalTask.startDate);
        const originalFinish = parseLookaheadDate(dragState.originalTask.finishDate);

        let newStart = new Date(originalStart);
        let newFinish = new Date(originalFinish);

        if (dragState.type === 'move') {
            newStart = addDays(originalStart, dayDelta);
            newFinish = addDays(originalFinish, dayDelta);
        } else if (dragState.type === 'resize-left') {
            newStart = addDays(originalStart, dayDelta);
            if (newStart > originalFinish) { // prevent start date from passing finish date
                newStart = new Date(originalFinish);
            }
        } else if (dragState.type === 'resize-right') {
            newFinish = addDays(originalFinish, dayDelta);
            if (newFinish < originalStart) { // prevent finish date from being before start date
                newFinish = new Date(originalStart);
            }
        }
        
        onUpdateTask(task.id, formatDateISO(newStart), formatDateISO(newFinish));

    }, [dragState, dayWidth, onUpdateTask, task.id]);


    const handleMouseUp = useCallback(() => {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        setDragState(null);
    }, []);

    useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, handleMouseMove, handleMouseUp]);

    const barWidth = durationDays * dayWidth;

    return (
        <div 
            className={`absolute top-1/2 -translate-y-1/2 group rounded-md overflow-visible h-5
                ${styles.wrapper}
                ${dragState?.type === 'move' ? 'cursor-grabbing opacity-80 z-30' : 'cursor-grab'}`}
            style={{ 
                left: `${(offsetDays * dayWidth) + offsetLeft}px`, 
                width: `${barWidth}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            title={`${task.name}: ${task.startDate} to ${task.finishDate}`}
        >
            <div 
              className={`w-full h-full rounded-md border ${styles.bar} shadow-sm`}
            >
                <div 
                    className={`h-full rounded-md ${styles.progress}`}
                    style={{ 
                        width: `${displayProgressPercent}%`,
                    }}
                ></div>
            </div>

            <div className="absolute inset-0 flex">
                {Array.from({ length: durationDays }).map((_, i) => {
                    const dayDate = addDays(parseLookaheadDate(task.startDate), i);
                    return (
                        <div
                            key={i}
                            className="h-full border-r border-white/20 last:border-r-0 cursor-pointer hover:bg-black/5"
                            style={{ width: `${dayWidth}px` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDayClick(task, dayDate);
                            }}
                        />
                    );
                })}
            </div>
            
            {/* Resize Handles */}
            <div 
                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                style={{transform: 'translateX(-50%)'}}
                onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            />
            <div 
                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100" 
                style={{transform: 'translateX(50%)'}}
                onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            />
        </div>
    );
};

export default DraggableTaskBar;
