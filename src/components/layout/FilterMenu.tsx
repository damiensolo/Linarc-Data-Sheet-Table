import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { FilterRule, ColumnId, FilterOperator } from '../../types';
import { FILTERABLE_COLUMNS, TEXT_OPERATORS, ENUM_OPERATORS, getEnumOptions } from '../../constants';
import { PlusIcon, XIcon, ChevronDownIcon } from '../common/Icons';
import { useProject } from '../../context/ProjectContext';

interface FilterMenuProps {
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

const EnumMultiSelect: React.FC<{ options: { id: string, label: string }[], selected: string[], onChange: (selected: string[]) => void }> = ({ options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleOption = (id: string) => {
        const newSelected = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
        onChange(newSelected);
    };
    
    const displayLabel = selected.length > 0 ? options.filter(o => selected.includes(o.id)).map(o => o.label).join(', ') : 'Select...';

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <button onClick={() => setIsOpen(p => !p)} className="w-full flex justify-between items-center px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <span className="truncate">{displayLabel}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-10 max-h-48 overflow-y-auto">
                    <ul>
                        {options.map(opt => (
                            <li key={opt.id} className="p-2 hover:bg-gray-100">
                                <label className="flex items-center text-sm">
                                    <input type="checkbox" checked={selected.includes(opt.id)} onChange={() => toggleOption(opt.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                                    {opt.label}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const FilterMenu: React.FC<FilterMenuProps> = ({ onClose, triggerRef }) => {
    const { activeView, setFilters } = useProject();
    const { filters } = activeView;
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    
    // Local state for filters including incomplete ones
    const [localFilters, setLocalFilters] = useState<FilterRule[]>(filters);

    useLayoutEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8, // 8px gap
                left: rect.left
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
             // Re-calculate or close on scroll/resize
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

    // Sync valid filters to global state
    useEffect(() => {
        const validFilters = localFilters.filter(rule => {
            if (!rule.columnId || !rule.operator) return false;
            const isValueRequired = !['is_empty', 'is_not_empty'].includes(rule.operator);
            if (isValueRequired && (rule.value === undefined || rule.value === '' || (Array.isArray(rule.value) && rule.value.length === 0))) return false;
            return true;
        });
        
        setFilters(validFilters);
    }, [localFilters, setFilters]);

    const addNewFilter = () => {
        const defaultCol = FILTERABLE_COLUMNS[0];
        const defaultOp = defaultCol.type === 'text' ? TEXT_OPERATORS[0] : ENUM_OPERATORS[0];
        
        const newRule: FilterRule = {
            id: `filter_${Date.now()}`,
            columnId: defaultCol.id,
            operator: defaultOp.id as FilterOperator,
            value: undefined
        };
        setLocalFilters([...localFilters, newRule]);
    };
    
    const removeFilter = (id: string) => {
        setLocalFilters(localFilters.filter(f => f.id !== id));
    };

    const updateFilter = (id: string, updates: Partial<FilterRule>) => {
        setLocalFilters(localFilters.map(f => {
            if (f.id === id) {
                const updated = { ...f, ...updates };
                
                // If column changed, reset operator and value
                if (updates.columnId && updates.columnId !== f.columnId) {
                     const newCol = FILTERABLE_COLUMNS.find(c => c.id === updates.columnId);
                     const newOps = newCol?.type === 'text' ? TEXT_OPERATORS : ENUM_OPERATORS;
                     updated.operator = newOps[0].id as FilterOperator;
                     updated.value = undefined;
                }
                return updated;
            }
            return f;
        }));
    };

    const addQuickFilter = (type: string) => {
        let rule: FilterRule | null = null;
        switch (type) {
            case 'incomplete':
                rule = { id: `qf_${Date.now()}`, columnId: 'status', operator: 'is_none_of', value: ['Completed'] };
                break;
            case 'completed':
                rule = { id: `qf_${Date.now()}`, columnId: 'status', operator: 'is_any_of', value: ['Completed'] };
                break;
            case 'my_tasks':
                rule = { id: `qf_${Date.now()}`, columnId: 'assignee', operator: 'contains', value: 'Me' };
                break;
            case 'due_this_week':
                rule = { id: `qf_${Date.now()}`, columnId: 'dates', operator: 'contains', value: 'This Week' };
                break;
            case 'due_next_week':
                rule = { id: `qf_${Date.now()}`, columnId: 'dates', operator: 'contains', value: 'Next Week' };
                break;
        }
        if (rule) setLocalFilters([...localFilters, rule]);
    };

    return createPortal(
        <div 
            ref={menuRef} 
            className="fixed w-[668px] bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] flex flex-col p-4"
            style={{ top: position.top, left: position.left }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Filters</h3>
                {localFilters.length > 0 && (
                    <button 
                        onClick={() => setLocalFilters([])} 
                        className="text-sm text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>
            
            <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick filters</h4>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => addQuickFilter('incomplete')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">Incomplete tasks</button>
                    <button onClick={() => addQuickFilter('completed')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">Completed tasks</button>
                    <button onClick={() => addQuickFilter('my_tasks')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">Just my tasks</button>
                    <button onClick={() => addQuickFilter('due_this_week')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">Due this week</button>
                    <button onClick={() => addQuickFilter('due_next_week')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">Due next week</button>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">All filters</h4>
                {localFilters.length === 0 && <p className="text-sm text-gray-400 italic">No active filters</p>}
                {localFilters.map(rule => {
                    const selectedColumn = FILTERABLE_COLUMNS.find(c => c.id === rule.columnId);
                    const operators = selectedColumn?.type === 'text' ? TEXT_OPERATORS : ENUM_OPERATORS;
                    const requiresValue = rule.operator && !['is_empty', 'is_not_empty'].includes(rule.operator);

                    return (
                        <div key={rule.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
                            <div className="w-1/4">
                                <CustomSelect 
                                    options={FILTERABLE_COLUMNS.map(c => ({ id: c.id, label: c.label }))}
                                    value={rule.columnId}
                                    onChange={val => updateFilter(rule.id, { columnId: val as ColumnId })}
                                    placeholder="Select field"
                                />
                            </div>
                            <div className="w-1/4">
                                <CustomSelect
                                    options={operators}
                                    value={rule.operator}
                                    onChange={val => updateFilter(rule.id, { operator: val as FilterOperator })}
                                    placeholder="Select operator"
                                />
                            </div>
                            <div className="flex-1">
                                {requiresValue && selectedColumn ? (
                                    selectedColumn.type === 'text' ? (
                                        <input
                                            type="text"
                                            value={rule.value as string || ''}
                                            onChange={e => updateFilter(rule.id, { value: e.target.value })}
                                            placeholder="Enter value..."
                                            className="form-input w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <EnumMultiSelect
                                            options={getEnumOptions(selectedColumn.id)}
                                            selected={rule.value as string[] || []}
                                            onChange={val => updateFilter(rule.id, { value: val })}
                                        />
                                    )
                                ) : <div className="h-8 bg-gray-100 rounded border border-gray-200 opacity-50"></div>}
                            </div>
                            <button onClick={() => removeFilter(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <button onClick={addNewFilter} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium p-2 hover:bg-gray-100 rounded-md transition-colors w-fit">
                <PlusIcon className="w-4 h-4" />
                <span>Add filter</span>
            </button>
        </div>,
        document.body
    );
};

export default FilterMenu;
