import React, { useState, useRef, useEffect } from 'react';
import { V3Sheet } from '../types';
import { PlusIcon, MoreHorizontalIcon } from '../../../common/Icons';

interface SheetTabsProps {
  sheets: V3Sheet[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, name: string) => void;
  onDeleteSheet: (id: string) => void;
}

const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets, activeSheetId, onSelectSheet, onAddSheet, onRenameSheet, onDeleteSheet,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commitRename = (id: string) => {
    if (editValue.trim()) onRenameSheet(id, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="flex items-center h-9 border-t border-gray-200 bg-gray-50 px-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
      {sheets.map((sheet) => {
        const isActive = sheet.id === activeSheetId;
        return (
          <div
            key={sheet.id}
            className={`relative flex items-center h-7 rounded-t-md border-x border-t mr-1 cursor-pointer group shrink-0 transition-colors
              ${isActive
                ? 'bg-white border-gray-300 text-gray-900 shadow-sm z-10'
                : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            onClick={() => onSelectSheet(sheet.id)}
          >
            {editingId === sheet.id ? (
              <input
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitRename(sheet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(sheet.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="w-24 px-2 text-xs font-medium outline-none bg-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="px-3 text-xs font-medium whitespace-nowrap"
                onDoubleClick={(e) => { e.stopPropagation(); setEditingId(sheet.id); setEditValue(sheet.name); }}
              >
                {sheet.name}
              </span>
            )}

            {/* Menu trigger */}
            <button
              className={`mr-1 p-0.5 rounded transition-opacity ${isActive ? 'opacity-40 hover:opacity-100' : 'opacity-0 group-hover:opacity-40 hover:!opacity-100'}`}
              onClick={(e) => { e.stopPropagation(); setMenuId(menuId === sheet.id ? null : sheet.id); }}
            >
              <MoreHorizontalIcon className="w-3 h-3" />
            </button>

            {/* Dropdown */}
            {menuId === sheet.id && (
              <div ref={menuRef} className="absolute bottom-full left-0 mb-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                <button
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                  onClick={(e) => { e.stopPropagation(); setMenuId(null); setEditingId(sheet.id); setEditValue(sheet.name); }}
                >
                  Rename
                </button>
                {sheets.length > 1 && (
                  <button
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); setMenuId(null); onDeleteSheet(sheet.id); }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add sheet button */}
      <button
        onClick={onAddSheet}
        className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0 ml-1"
        title="Add sheet"
      >
        <PlusIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default SheetTabs;
