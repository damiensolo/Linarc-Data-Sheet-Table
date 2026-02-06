import React from 'react';
import { Task, Status, Priority } from '../../../types';
import { useProject } from '../../../context/ProjectContext';
import { useProjectData } from '../../../hooks/useProjectData';
import ViewControls from '../../layout/ViewControls';
import TaskCard from './components/TaskCard';

const flattenTasks = (tasks: Task[]): Task[] => {
  let allTasks: Task[] = [];
  const recurse = (taskItems: Task[]) => {
    taskItems.forEach(task => {
      allTasks.push(task);
      if (task.children) {
        recurse(task.children);
      }
    });
  };
  recurse(tasks);
  return allTasks;
};

const getStatusLabel = (status: Status) => {
    switch (status) {
        case Status.New: return 'Draft';
        case Status.Planned: return 'Submitted';
        case Status.InProgress: return 'Under Review';
        case Status.InReview: return 'Responded';
        case Status.Completed: return 'Closed';
        default: return status;
    }
};

const BoardView: React.FC = () => {
    const { 
        tasks, activeView, searchTerm, handlePriorityChange
    } = useProject();
    const { sortedTasks } = useProjectData(tasks, activeView, searchTerm);
    const allTasks = flattenTasks(sortedTasks);

    // Represent the full RFI lifecycle on the board
    const statusColumns: Status[] = [Status.New, Status.Planned, Status.InProgress, Status.InReview, Status.Completed];

    const tasksByStatus = statusColumns.reduce((acc, status) => {
        acc[status] = allTasks.filter(task => task.status === status);
        return acc;
    }, {} as Record<Status, Task[]>);

    const statusColors: Record<Status, string> = {
      [Status.New]: 'bg-gray-400',
      [Status.Planned]: 'bg-blue-500',
      [Status.InProgress]: 'bg-amber-500',
      [Status.InReview]: 'bg-cyan-500',
      [Status.Completed]: 'bg-green-500',
    };

    return (
        <div className="flex flex-col h-full p-4 gap-4 min-w-min bg-gray-50">
            <ViewControls />
            <div className="flex gap-6 flex-grow overflow-auto pb-2">
                {statusColumns.map(status => (
                    <div key={status} className="w-80 bg-gray-100 rounded-lg flex-shrink-0 flex flex-col max-h-full border border-gray-200/60">
                        <div className="flex items-center justify-between p-3 sticky top-0 bg-gray-100 z-10 rounded-t-lg border-b border-gray-200/50">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`}></span>
                                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-tight">
                                    {getStatusLabel(status)}
                                </h3>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-2.5 py-0.5 shadow-sm">
                                {tasksByStatus[status].length}
                            </span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow custom-scrollbar">
                            {tasksByStatus[status].map(task => (
                                <TaskCard key={task.id} task={task} onPriorityChange={handlePriorityChange} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BoardView;