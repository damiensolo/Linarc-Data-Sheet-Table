import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontalIcon, EyeIcon, LinkIcon, DownloadIcon, PaperclipIcon, TrashIcon } from '../common/Icons';

interface RowActionsMenuProps {
    onView?: () => void;
    onLink?: () => void;
    onExport?: () => void;
    onAttachments?: () => void;
    onDelete?: () => void;
    isLinked?: boolean;
}

export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({ 
    onView, 
    onLink, 
    onExport, 
    onAttachments, 
    onDelete, 
    isLinked 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const MENU_WIDTH = 160;
            let left = rect.left;
            
            if (left + MENU_WIDTH > window.innerWidth) {
                left = rect.right - MENU_WIDTH;
            }
            if (left < 0) left = 0;

            setCoords({
                top: rect.bottom + 4,
                left: left
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
             if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                 setIsOpen(false);
             }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <>
            <button 
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`p-1 rounded-md transition-colors focus:outline-none ${isOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                <MoreHorizontalIcon className="w-5 h-5" />
            </button>
            {isOpen && createPortal(
                <div 
                    className="fixed w-40 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] py-1"
                    style={{ top: coords.top, left: coords.left }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {onView && (
                        <button onClick={(e) => { e.stopPropagation(); onView(); setIsOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <EyeIcon className="w-4 h-4 text-gray-500" /> View
                        </button>
                    )}
                    {onLink && (
                        <button onClick={(e) => { e.stopPropagation(); onLink(); setIsOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-500" /> {isLinked ? 'Unlink' : 'Link'}
                        </button>
                    )}
                    {onExport && (
                        <button onClick={(e) => { e.stopPropagation(); onExport(); setIsOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <DownloadIcon className="w-4 h-4 text-gray-500" /> Export
                        </button>
                    )}
                    {onAttachments && (
                        <button onClick={(e) => { e.stopPropagation(); onAttachments(); setIsOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <PaperclipIcon className="w-4 h-4 text-gray-500" /> Attachments
                        </button>
                    )}
                    {(onView || onLink || onExport || onAttachments) && onDelete && (
                        <div className="h-px bg-gray-200 my-1"></div>
                    )}
                    {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <TrashIcon className="w-4 h-4" /> Delete
                        </button>
                    )}
                </div>,
                document.body
            )}
        </>
    );
};
