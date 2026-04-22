import React, { useState, useEffect } from 'react';
import { V3Column, V3ColumnType, V3SelectOption } from '../types';
import { XIcon, PlusIcon, TrashIcon, FillColorIcon } from '../../../common/Icons';
import ColorPicker from '../../../common/ui/ColorPicker';
import { 
  Type, 
  Hash, 
  DollarSign, 
  Calendar, 
  List, 
  CheckSquare, 
  FunctionSquare 
} from 'lucide-react';

interface AddColumnModalProps {
  onAdd: (col: Omit<V3Column, 'id'>) => void;
  onClose: () => void;
  mode?: 'add' | 'edit';
  initialValues?: Partial<Omit<V3Column, 'id'>>;
}

export const COLUMN_TYPES: { id: V3ColumnType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'text',     label: 'Text',     description: 'Free text entry',             icon: <Type className="w-4 h-4" /> },
  { id: 'number',   label: 'Number',   description: 'Numeric values',              icon: <Hash className="w-4 h-4" />  },
  { id: 'currency', label: 'Currency', description: 'Formatted as $0,000.00',      icon: <DollarSign className="w-4 h-4" />  },
  { id: 'date',     label: 'Date',     description: 'Date picker input',           icon: <Calendar className="w-4 h-4" /> },
  { id: 'select',   label: 'Select',   description: 'Dropdown with options',       icon: <List className="w-4 h-4" /> },
  { id: 'checkbox', label: 'Checkbox', description: 'True/false toggle',           icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'formula',  label: 'Formula',  description: 'Auto-calculated, e.g. =a+b', icon: <FunctionSquare className="w-4 h-4" />  },
];

const AddColumnModal: React.FC<AddColumnModalProps> = ({ onAdd, onClose, mode = 'add', initialValues }) => {
  const [label,   setLabel]   = useState(initialValues?.label   ?? '');
  const [type,    setType]    = useState<V3ColumnType>(initialValues?.type ?? 'text');
  const [formula, setFormula] = useState(initialValues?.formula ?? '');
  
  // Options state: normalize strings to objects
  const [options, setOptions] = useState<V3SelectOption[]>(() => {
    if (!initialValues?.options) return [];
    return initialValues.options.map(o => typeof o === 'string' ? { label: o } : o);
  });

  // If the type is changed from the parent (context menu), update local state
  useEffect(() => {
    if (initialValues?.type) {
      setType(initialValues.type);
    }
  }, [initialValues?.type]);

  const isEdit = mode === 'edit';

  const handleAddOption = () => {
    setOptions([...options, { label: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, updates: Partial<V3SelectOption>) => {
    const next = [...options];
    next[index] = { ...next[index], ...updates };
    setOptions(next);
  };

  const handleSubmit = () => {
    if (!label.trim()) return;
    const col: Omit<V3Column, 'id'> = {
      label: label.trim(),
      type,
      width:   initialValues?.width   ?? (type === 'text' ? 180 : type === 'date' ? 130 : 120),
      align:   (type === 'number' || type === 'currency' || type === 'formula') ? 'right' : 'left',
      editable: type !== 'formula',
      visible:  true,
      isTotal:  type === 'currency' || type === 'number',
      ...(type === 'formula' ? { formula: formula.startsWith('=') ? formula : `=${formula}` } : {}),
      ...(type === 'select'  ? { options: options.filter(o => o.label.trim() !== '') } : {}),
    };
    onAdd(col);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-lg shadow-2xl w-[520px] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Column' : 'Add Column'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-grow">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Column Name</label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Labor Cost"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Column Type</label>
            <div className="grid grid-cols-4 gap-2">
              {COLUMN_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setType(ct.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-md border text-center transition-all text-xs
                    ${type === ct.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                    }`}
                  title={ct.description}
                >
                  <span className={`${type === ct.id ? 'text-blue-600' : 'text-gray-400'}`}>{ct.icon}</span>
                  <span className="font-semibold">{ct.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">{COLUMN_TYPES.find(t => t.id === type)?.description}</p>
          </div>

          {type === 'formula' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Formula</label>
              <input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="=labor+material+equipment"
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">Reference other column names or cell IDs. E.g. =Labor+Material or =A1+B1</p>
            </div>
          )}

          {type === 'select' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Options & Colors</label>
                <button 
                  onClick={handleAddOption}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <PlusIcon className="w-3 h-3" />
                  ADD OPTION
                </button>
              </div>
              
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 group animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="flex-shrink-0">
                      <ColorPicker
                        value={opt.color}
                        onColorSelect={(color) => handleOptionChange(i, { color })}
                        label="Status Color"
                        icon={
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" 
                            style={{ backgroundColor: opt.color || '#e5e7eb' }} 
                          />
                        }
                      />
                    </div>
                    <input
                      value={opt.label}
                      onChange={(e) => handleOptionChange(i, { label: e.target.value })}
                      placeholder={`Option ${i + 1}`}
                      className="flex-grow px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={() => handleRemoveOption(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {options.length === 0 && (
                  <div className="py-8 border-2 border-dashed border-gray-100 rounded-lg text-center">
                    <p className="text-xs text-gray-400 mb-3">No options configured yet</p>
                    <button 
                      onClick={handleAddOption}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      Create first option
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium rounded-md hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isEdit ? 'Update Column' : 'Add Column'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddColumnModal;
