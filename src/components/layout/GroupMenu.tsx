import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ColumnId, GroupByRule } from '../../types';
import { FILTERABLE_COLUMNS } from '../../constants';
import { PlusIcon, XIcon, GripVerticalIcon, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, ChevronUpIcon, ChevronsDownIcon } from '../common/Icons';
import { useProject } from '../../context/ProjectContext';

interface GroupMenuProps {
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const CustomSelect: React.FC<{ options: { id: string, label: string }[], value: string, onChange: (value: string) => void, placeholder: string }> = ({ options, value, onChange, placeholder }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
    </select>
);

const GroupMenu: React.FC<GroupMenuProps> = ({ onClose, triggerRef }) => {
    const { activeView, setGroupBy, expansionCycle, handleCycleExpansion } = useProject();
    const { groupBy = [] } = activeView;
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    
    // Local state for groups
    const [localGroups, setLocalGroups] = useState<GroupByRule[]>(groupBy || []);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    useLayoutEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8, // 8px gap
                left: Math.max(16, rect.left) // Avoid offscreen
            });
        }
    }, [triggerRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        
        const handleResizeOrScroll = () => {
             onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResizeOrScroll);
        window.addEventListener('scroll', handleResizeOrScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResizeOrScroll);
            window.removeEventListener('scroll', handleResizeOrScroll, true);
        };
    }, [onClose, triggerRef]);

    const handleApply = () => {
        const validGroups = localGroups.filter(g => !!g.columnId);
        setGroupBy(validGroups);
        onClose();
    };

    const handleClearAll = () => {
        setLocalGroups([]);
        setGroupBy([]);
        onClose();
    };

    const addNewGroup = () => {
        setLocalGroups([...localGroups, { columnId: '', direction: 'asc' }]);
    };
    
    const removeGroup = (index: number) => {
        const newGroups = [...localGroups];
        newGroups.splice(index, 1);
        setLocalGroups(newGroups);
    };

    const updateGroup = (index: number, updates: Partial<GroupByRule>) => {
        const newGroups = [...localGroups];
        newGroups[index] = { ...newGroups[index], ...updates };
        setLocalGroups(newGroups);
    };

    const addQuickGroup = (columnId: string) => {
        if (!localGroups.find(g => g.columnId === columnId)) {
            setLocalGroups([...localGroups.filter(g => !!g.columnId), { columnId, direction: 'asc' }]);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Set a transparent drag image to allow custom visual feedback if needed, 
        // but default is fine for now.
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newGroups = [...localGroups];
        const draggedItem = newGroups[draggedIndex];
        newGroups.splice(draggedIndex, 1);
        newGroups.splice(index, 0, draggedItem);
        setLocalGroups(newGroups);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return createPortal(
        <div 
            ref={menuRef} 
            className="fixed w-[440px] bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] flex flex-col p-4"
            style={{ top: position.top, left: position.left }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Group by</h3>
                {localGroups.length > 0 && (
                    <button 
                        onClick={handleClearAll} 
                        className="text-sm text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>
            
            <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick groups</h4>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => addQuickGroup('status')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">By Status</button>
                    <button onClick={() => addQuickGroup('assignee')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">By Assignee</button>
                    <button onClick={() => addQuickGroup('priority')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">By Priority</button>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">All groups</h4>
                {localGroups.length === 0 && <p className="text-sm text-gray-400 italic">No active groups</p>}
                <div className="space-y-2">
                    {localGroups.map((group, index) => (
                        <div 
                            key={index} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-md border border-gray-200 transition-all ${draggedIndex === index ? 'opacity-50 border-blue-400 ring-1 ring-blue-100' : ''}`}
                        >
                            <div 
                                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
                                tabIndex={0}
                                role="button"
                                aria-label="Rearrange group"
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' && index > 0) {
                                        const newGroups = [...localGroups];
                                        const [moved] = newGroups.splice(index, 1);
                                        newGroups.splice(index - 1, 0, moved);
                                        setLocalGroups(newGroups);
                                    } else if (e.key === 'ArrowDown' && index < localGroups.length - 1) {
                                        const newGroups = [...localGroups];
                                        const [moved] = newGroups.splice(index, 1);
                                        newGroups.splice(index + 1, 0, moved);
                                        setLocalGroups(newGroups);
                                    }
                                }}
                            >
                                <GripVerticalIcon className="w-4 h-4" />
                            </div>
                            
                            <span className="text-gray-500 w-16 text-[10px] uppercase tracking-wider font-bold shrink-0">{index === 0 ? 'Group by' : 'Then by'}</span>
                            
                            <div className="flex-1">
                                <CustomSelect 
                                    options={FILTERABLE_COLUMNS.map(c => {
                                        const isHidden = activeView.type === 'spreadsheetV2' 
                                            ? !(activeView.spreadsheetColumns?.find(col => col.id === c.id)?.visible ?? true)
                                            : !(activeView.columns?.find(col => col.id === c.id)?.visible ?? true);
                                        return { id: c.id, label: isHidden ? `${c.label} (Hidden)` : c.label };
                                    })}
                                    value={group.columnId}
                                    onChange={val => updateGroup(index, { columnId: val as ColumnId })}
                                    placeholder="Select field"
                                />
                            </div>

                            <button 
                                onClick={() => updateGroup(index, { direction: group.direction === 'asc' ? 'desc' : 'asc' })}
                                className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors min-w-[70px] justify-center"
                                title={group.direction === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                            >
                                {group.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3 text-blue-500" /> : <ArrowDownIcon className="w-3 h-3 text-blue-500" />}
                                <span className="text-[10px] font-bold uppercase">{group.direction}</span>
                            </button>

                            <button onClick={() => removeGroup(index)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                <button onClick={addNewGroup} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium px-2 py-1.5 hover:bg-gray-100 rounded-md transition-colors font-semibold">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add group</span>
                </button>

                {localGroups.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleCycleExpansion}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            {expansionCycle === 0 && <ChevronUpIcon className="w-3.5 h-3.5" />}
                            {expansionCycle === 1 && <ChevronDownIcon className="w-3.5 h-3.5" />}
                            {expansionCycle === 2 && <ChevronsDownIcon className="w-3.5 h-3.5" />}
                            <span>
                                {expansionCycle === 0 && "Expand First Tier"}
                                {expansionCycle === 1 && "Expand All"}
                                {expansionCycle === 2 && "Collapse All"}
                            </span>
                        </button>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleApply}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={localGroups.length > 0 && !localGroups.every(g => !!g.columnId)}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default GroupMenu;
