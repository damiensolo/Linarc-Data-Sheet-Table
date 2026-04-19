import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { V3Sheet } from '../types';
import { PlusIcon, MoreHorizontalIcon } from '../../../common/Icons';

interface SheetTabsProps {
  sheets: V3Sheet[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, name: string) => void;
  onDuplicateSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
}

interface MenuState {
  sheetId: string;
  x: number;
  y: number;
}

const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets, activeSheetId, onSelectSheet, onAddSheet, onRenameSheet, onDuplicateSheet, onDeleteSheet,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menu, setMenu] = useState<MenuState | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!menu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-sheet-menu]')) setMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu]);

  const commitRename = (id: string) => {
    if (editValue.trim()) onRenameSheet(id, editValue.trim());
    setEditingId(null);
  };

  const openMenu = useCallback((e: React.MouseEvent, sheetId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu(prev => prev?.sheetId === sheetId ? null : { sheetId, x: rect.left, y: rect.top });
  }, []);

  return (
    <div className="flex items-center h-9 border-t border-gray-200 bg-gray-50 px-2 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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
                  e.stopPropagation();
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

            <button
              className={`mr-1 p-0.5 rounded transition-opacity ${isActive ? 'opacity-40 hover:opacity-100' : 'opacity-0 group-hover:opacity-40 hover:!opacity-100'}`}
              onClick={(e) => openMenu(e, sheet.id)}
            >
              <MoreHorizontalIcon className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      <button
        onClick={onAddSheet}
        className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0 ml-1"
        title="Add sheet"
      >
        <PlusIcon className="w-3.5 h-3.5" />
      </button>

      {/* Portal dropdown — renders outside overflow container so it's never clipped */}
      {menu && createPortal(
        <div
          data-sheet-menu
          className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1"
          style={{ left: menu.x, bottom: window.innerHeight - menu.y + 4 }}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            onClick={() => {
              const sheet = sheets.find(s => s.id === menu.sheetId);
              if (sheet) { setEditingId(sheet.id); setEditValue(sheet.name); }
              setMenu(null);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            onClick={() => { onDuplicateSheet(menu.sheetId); setMenu(null); }}
          >
            Duplicate
          </button>
          {sheets.length > 1 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                onClick={() => { onDeleteSheet(menu.sheetId); setMenu(null); }}
              >
                Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SheetTabs;
