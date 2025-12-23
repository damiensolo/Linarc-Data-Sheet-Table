import React from 'react';
import { Task, Priority } from '../../../../types';
import { AssigneeAvatar, ImpactPill, PrioritySelector } from '../../../shared/TaskElements';

interface TaskCardProps {
    task: Task;
    onPriorityChange: (taskId: number, priority: Priority) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPriorityChange }) => {
    const progressColor = task.progress && task.progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500';
    
    return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-3 cursor-pointer hover:shadow-md transition-all hover:border-blue-400 group relative">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                 <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1 rounded border border-gray-100">ID-{task.id}</span>
                 <div className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 -ml-1">
                    <PrioritySelector taskId={task.id} currentPriority={task.priority} onPriorityChange={onPriorityChange} hideLabel={true} />
                 </div>
            </div>
            {task.impact && <div><ImpactPill impact={task.impact} /></div>}
        </div>
        
        <p className="font-semibold text-gray-900 text-sm mb-3 line-clamp-3 leading-snug">{task.name}</p>
        
        {task.progress && (
             <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                 <div className={`h-full ${progressColor}`} style={{ width: `${task.progress.percentage}%` }} />
             </div>
        )}

        <div className="flex justify-between items-center mt-2">
             <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                {task.dueDate}
             </div>
            <div className="flex items-center -space-x-2">
                {task.assignees.map(a => (
                    <AssigneeAvatar key={a.id} assignee={a} className="w-7 h-7 text-xs ring-2 ring-white" />
                ))}
            </div>
        </div>
    </div>
    );
};

export default TaskCard;
