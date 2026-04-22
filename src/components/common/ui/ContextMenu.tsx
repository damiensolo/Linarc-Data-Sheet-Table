import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  render?: (onClose: () => void) => React.ReactNode;
}

interface ContextMenuProps {
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState(position);
  const [isPositioned, setIsPositioned] = useState(false);

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let { x, y } = position;

      // Prevent overflow on right
      if (x + rect.width > window.innerWidth) {
        x = window.innerWidth - rect.width - 8;
      }
      
      // Prevent overflow on bottom
      if (y + rect.height > window.innerHeight) {
        y = window.innerHeight - rect.height - 8;
      }

      setCoords({ x, y });
      setIsPositioned(true);
    }
  }, [position, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { 
        const target = event.target as Node;
        // Do not close if click originates from inside a Popover
        if (target instanceof Element && target.closest('[data-popover-content="true"]')) {
            return;
        }
        
        if (menuRef.current && !menuRef.current.contains(target)) {
            onClose(); 
        }
    };
    const handleScroll = (event: Event) => {
        const target = event.target as Node;
        if (target instanceof Element && target.closest('[data-popover-content="true"]')) {
            return;
        }
        onClose(); 
    };
    const handleResize = () => { onClose(); };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] min-w-[260px] bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 transition-all duration-75 origin-top-left",
        isPositioned ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{ top: coords.y, left: coords.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="h-px bg-gray-200 my-1.5 mx-1" />;
        }

        if (item.render) {
          return <div key={index}>{item.render(onClose)}</div>;
        }

        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center px-3 py-2 text-xs text-left transition-colors relative",
              item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100",
              item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
            )}
          >
            <span className={cn("mr-2.5 w-4 h-4 flex items-center justify-center flex-shrink-0", item.danger ? "text-red-500" : "text-gray-500")}>
                {item.icon}
            </span>
            <span className="flex-grow">{item.label}</span>
            {item.shortcut && <span className="ml-4 text-xs text-gray-400 font-medium">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>,
    document.body
  );
};