import React, { useState } from 'react';
import { V3Column, V3ColumnType } from '../types';
import { XIcon } from '../../../common/Icons';

interface AddColumnModalProps {
  onAdd: (col: Omit<V3Column, 'id'>) => void;
  onClose: () => void;
  mode?: 'add' | 'edit';
  initialValues?: Partial<Omit<V3Column, 'id'>>;
}

export const COLUMN_TYPES: { id: V3ColumnType; label: string; description: string; icon: string }[] = [
  { id: 'text',     label: 'Text',     description: 'Free text entry',             icon: 'Aa' },
  { id: 'number',   label: 'Number',   description: 'Numeric values',              icon: '#'  },
  { id: 'currency', label: 'Currency', description: 'Formatted as $0,000.00',      icon: '$'  },
  { id: 'date',     label: 'Date',     description: 'Date picker input',           icon: '📅' },
  { id: 'select',   label: 'Select',   description: 'Dropdown with options',       icon: '▾' },
  { id: 'checkbox', label: 'Checkbox', description: 'True/false toggle',           icon: '☑' },
  { id: 'formula',  label: 'Formula',  description: 'Auto-calculated, e.g. =a+b', icon: '='  },
];

const AddColumnModal: React.FC<AddColumnModalProps> = ({ onAdd, onClose, mode = 'add', initialValues }) => {
  const [label,   setLabel]   = useState(initialValues?.label   ?? '');
  const [type,    setType]    = useState<V3ColumnType>(initialValues?.type ?? 'text');
  const [formula, setFormula] = useState(initialValues?.formula ?? '');
  const [options, setOptions] = useState(initialValues?.options?.join(', ') ?? '');

  const isEdit = mode === 'edit';

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
      ...(type === 'select'  ? { options: options.split(',').map(s => s.trim()).filter(Boolean) } : {}),
    };
    onAdd(col);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Column' : 'Add Column'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Column Name</label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Labor Cost"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Column Type</label>
            <div className="grid grid-cols-4 gap-2">
              {COLUMN_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setType(ct.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all text-xs
                    ${type === ct.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                    }`}
                  title={ct.description}
                >
                  <span className="text-lg leading-none">{ct.icon}</span>
                  <span className="font-medium">{ct.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">{COLUMN_TYPES.find(t => t.id === type)?.description}</p>
          </div>

          {type === 'formula' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Formula</label>
              <input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="=labor+material+equipment"
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">Reference other column IDs. E.g. =labor+material</p>
            </div>
          )}

          {type === 'select' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Options (comma separated)</label>
              <input
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Option A, Option B, Option C"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isEdit ? 'Update Column' : 'Add Column'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddColumnModal;
