import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { HighlightRule, ColumnId, FilterOperator } from '../../types';
import { FILTERABLE_COLUMNS, TEXT_OPERATORS, ENUM_OPERATORS, NUMBER_OPERATORS, getEnumOptions } from '../../constants';
import { PlusIcon, XIcon, ChevronDownIcon, FillColorIcon } from '../common/Icons';
import { useProject } from '../../context/ProjectContext';
import ColorPicker from '../common/ui/ColorPicker';

interface HighlightMenuProps {
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

const ACCESSIBLE_PASTEL_COLORS = [
    '#BFDBFE', // Light Blue
    '#BBF7D0', // Light Green
    '#FEF08A', // Light Yellow
    '#FECACA', // Light Red
    '#E9D5FF', // Light Purple
    '#FED7AA', // Light Orange
    '#99F6E4', // Light Teal
    '#FBCFE8'  // Light Pink
];

const HighlightMenu: React.FC<HighlightMenuProps> = ({ onClose, triggerRef }) => {
    const { activeView, setHighlights } = useProject();
    const { highlights = [] } = activeView;
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    
    // Local state for filters including incomplete ones
    const [localHighlights, setLocalHighlights] = useState<HighlightRule[]>(highlights);

    useLayoutEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const MENU_WIDTH = 700;
            const SCREEN_PADDING = 16;
            
            let left = rect.left;
            
            // Check if menu overflows right side of viewport
            if (left + MENU_WIDTH > window.innerWidth - SCREEN_PADDING) {
                // Align to right side, but ensure it doesn't go off left screen
                left = Math.max(SCREEN_PADDING, window.innerWidth - MENU_WIDTH - SCREEN_PADDING);
            }

            setPosition({
                top: rect.bottom + 8, // 8px gap
                left: left
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

    // Sync highlights to global state. Send any rule that has columnId, operator, and color
    // so color changes are applied immediately. Rules without value won't match cells until value is set.
    useEffect(() => {
        const toSync = localHighlights.filter(rule => rule.columnId && rule.operator && rule.color);
        setHighlights(toSync);
    }, [localHighlights, setHighlights]);

    const addNewHighlight = () => {
        const defaultCol = FILTERABLE_COLUMNS[0];
        const defaultOp = defaultCol.type === 'text' ? TEXT_OPERATORS[0] : 
                          defaultCol.type === 'number' ? NUMBER_OPERATORS[0] :
                          ENUM_OPERATORS[0];
        
        const newRule: HighlightRule = {
            id: `highlight_${Date.now()}`,
            columnId: defaultCol.id,
            operator: defaultOp.id as FilterOperator,
            value: undefined,
            color: ACCESSIBLE_PASTEL_COLORS[0] // Default color
        };
        setLocalHighlights([...localHighlights, newRule]);
    };
    
    const removeHighlight = (id: string) => {
        setLocalHighlights(localHighlights.filter(f => f.id !== id));
    };

    const updateHighlight = (id: string, updates: Partial<HighlightRule>) => {
        setLocalHighlights(localHighlights.map(f => {
            if (f.id === id) {
                const updated = { ...f, ...updates };
                
                // If column changed, reset operator and value
                if (updates.columnId && updates.columnId !== f.columnId) {
                     const newCol = FILTERABLE_COLUMNS.find(c => c.id === updates.columnId);
                     const newOps = newCol?.type === 'text' ? TEXT_OPERATORS : 
                                    newCol?.type === 'number' ? NUMBER_OPERATORS :
                                    ENUM_OPERATORS;
                     updated.operator = newOps[0].id as FilterOperator;
                     updated.value = undefined;
                }
                return updated;
            }
            return f;
        }));
    };

    const addQuickHighlight = (type: string) => {
        let rule: HighlightRule | null = null;
        const timestamp = Date.now();
        switch (type) {
            case 'negative_remaining':
                rule = { 
                    id: `qh_${timestamp}`, 
                    columnId: 'remainingContract', 
                    operator: 'lt', 
                    value: '0', 
                    color: '#FECACA' // Light Red
                };
                break;
            case 'high_labor':
                rule = { 
                    id: `qh_${timestamp}`, 
                    columnId: 'labor', 
                    operator: 'gt', 
                    value: '3000', 
                    color: '#FEF08A' // Light Yellow
                };
                break;
            case 'unallocated_equipment':
                rule = { 
                    id: `qh_${timestamp}`, 
                    columnId: 'equipment', 
                    operator: 'lt', 
                    value: '1500', 
                    color: '#BFDBFE' // Light Blue
                };
                break;
        }
        if (rule) setLocalHighlights([...localHighlights, rule]);
    };

    return createPortal(
        <div 
            ref={menuRef} 
            className="fixed w-[700px] bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] flex flex-col p-4"
            style={{ top: position.top, left: position.left }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Cell Highlighting</h3>
                {localHighlights.length > 0 && (
                    <button 
                        onClick={() => setLocalHighlights([])} 
                        className="text-sm text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>
            
            <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick highlights</h4>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => addQuickHighlight('negative_remaining')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#FECACA] border border-gray-200"></span>
                        Negative Remaining
                    </button>
                    <button onClick={() => addQuickHighlight('high_labor')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#FEF08A] border border-gray-200"></span>
                        High Labor {'>'} $3k
                    </button>
                    <button onClick={() => addQuickHighlight('unallocated_equipment')} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#BFDBFE] border border-gray-200"></span>
                        Equipment {'<'} $1.5k
                    </button>
                </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
                Create rules to highlight specific cells based on their values. This does not filter rows.
            </p>

            <div className="space-y-3 mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rules</h4>
                {localHighlights.length === 0 && <p className="text-sm text-gray-400 italic">No highlight rules</p>}
                {localHighlights.map(rule => {
                    const selectedColumn = FILTERABLE_COLUMNS.find(c => c.id === rule.columnId);
                    const operators = selectedColumn?.type === 'text' ? TEXT_OPERATORS : 
                                      selectedColumn?.type === 'number' ? NUMBER_OPERATORS : 
                                      ENUM_OPERATORS;
                    const requiresValue = rule.operator && !['is_empty', 'is_not_empty'].includes(rule.operator);

                    return (
                        <div key={rule.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
                            <div className="w-1/4">
                                <CustomSelect 
                                    options={FILTERABLE_COLUMNS.map(c => ({ id: c.id, label: c.label }))}
                                    value={rule.columnId}
                                    onChange={val => updateHighlight(rule.id, { columnId: val as ColumnId })}
                                    placeholder="Select field"
                                />
                            </div>
                            <div className="w-1/4">
                                <CustomSelect
                                    options={operators}
                                    value={rule.operator}
                                    onChange={val => updateHighlight(rule.id, { operator: val as FilterOperator })}
                                    placeholder="Select operator"
                                />
                            </div>
                            <div className="flex-1">
                                {requiresValue && selectedColumn ? (
                                    selectedColumn.type === 'enum' ? (
                                        <EnumMultiSelect
                                            options={getEnumOptions(selectedColumn.id)}
                                            selected={rule.value as string[] || []}
                                            onChange={val => updateHighlight(rule.id, { value: val })}
                                        />
                                    ) : (
                                        <input
                                            type={selectedColumn.type === 'number' ? 'number' : 'text'}
                                            value={rule.value as string || ''}
                                            onChange={e => updateHighlight(rule.id, { value: e.target.value })}
                                            placeholder={selectedColumn.type === 'number' ? "0.00" : "Enter value..."}
                                            className="form-input w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    )
                                ) : <div className="h-8 bg-gray-100 rounded border border-gray-200 opacity-50"></div>}
                            </div>
                            <div className="w-auto">
                                <ColorPicker
                                    icon={<div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: rule.color }} />}
                                    label="Highlight Color"
                                    onColorSelect={(color) => color && updateHighlight(rule.id, { color })}
                                    presets={ACCESSIBLE_PASTEL_COLORS}
                                    value={rule.color}
                                />
                            </div>
                            <button onClick={() => removeHighlight(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <button onClick={addNewHighlight} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium p-2 hover:bg-gray-100 rounded-md transition-colors w-fit">
                <PlusIcon className="w-4 h-4" />
                <span>Add rule</span>
            </button>
        </div>,
        document.body
    );
};

export default HighlightMenu;
