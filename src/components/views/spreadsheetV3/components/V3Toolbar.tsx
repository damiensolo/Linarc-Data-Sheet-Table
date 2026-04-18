import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { V3CellStyle, V3Column } from '../types';
import { ScissorsIcon, CopyIcon, ClipboardIcon, TrashIcon, FillColorIcon, TextColorIcon, BorderColorIcon, XIcon, PlusIcon, DownloadIcon } from '../../../common/Icons';
import ColorPicker from '../../../common/ui/ColorPicker';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../../constants/designTokens';

interface V3ToolbarProps {
  selectedCount: number;
  hasClipboard: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onDeselectAll: () => void;
  onStyleUpdate: (style: Partial<V3CellStyle>) => void;
  onAddRow: () => void;
  fontSize: number;
  onFontSizeChange: (n: number) => void;
  density: 'compact' | 'standard' | 'comfortable';
  onDensityChange: (d: 'compact' | 'standard' | 'comfortable') => void;
}

const DENSITIES: { id: 'compact' | 'standard' | 'comfortable'; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'standard', label: 'Standard' },
  { id: 'comfortable', label: 'Comfortable' },
];

const V3Toolbar: React.FC<V3ToolbarProps> = ({
  selectedCount, hasClipboard, onCut, onCopy, onPaste, onDelete, onDeselectAll,
  onStyleUpdate, onAddRow, fontSize, onFontSizeChange, density, onDensityChange,
}) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center gap-2 h-10 px-1">
      <AnimatePresence mode="wait">
        {hasSelection ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 flex-1"
          >
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
              {selectedCount} selected
            </span>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            {[
              { icon: ScissorsIcon,  label: 'Cut',    action: onCut },
              { icon: CopyIcon,      label: 'Copy',   action: onCopy },
              { icon: ClipboardIcon, label: 'Paste',  action: onPaste, disabled: !hasClipboard },
              { icon: TrashIcon,     label: 'Delete', action: onDelete, danger: true },
            ].map(({ icon: Icon, label, action, disabled, danger }) => (
              <button
                key={label}
                onClick={action}
                disabled={disabled}
                title={label}
                className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                  ${danger ? 'text-red-500 hover:bg-red-50 hover:text-red-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ColorPicker icon={<FillColorIcon className="w-4 h-4" />} label="Fill" onColorSelect={(c) => onStyleUpdate({ backgroundColor: c })} presets={BACKGROUND_COLORS} />
            <ColorPicker icon={<TextColorIcon className="w-4 h-4" />} label="Text" onColorSelect={(c) => onStyleUpdate({ textColor: c })} presets={TEXT_BORDER_COLORS} />
            <ColorPicker icon={<BorderColorIcon className="w-4 h-4" />} label="Border" onColorSelect={(c) => onStyleUpdate({ borderColor: c })} presets={TEXT_BORDER_COLORS} />
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={onDeselectAll} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
              <XIcon className="w-3 h-3" /> Deselect
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3 flex-1"
          >
            {/* Density switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {DENSITIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => onDensityChange(d.id)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors
                    ${density === d.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Font size */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-0.5">
              <button onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))} className="text-gray-400 hover:text-gray-700 w-5 text-center leading-none text-lg">−</button>
              <span className="text-xs font-mono text-gray-700 w-5 text-center">{fontSize}</span>
              <button onClick={() => onFontSizeChange(Math.min(18, fontSize + 1))} className="text-gray-400 hover:text-gray-700 w-5 text-center leading-none text-lg">+</button>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={onAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default V3Toolbar;
