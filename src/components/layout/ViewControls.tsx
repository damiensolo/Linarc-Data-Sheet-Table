import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { View, ViewMode } from '../../types';
import { useProject } from '../../context/ProjectContext';
import FilterMenu from './FilterMenu';
import HighlightMenu from './HighlightMenu';
import { PlusIcon, MoreHorizontalIcon, TableIcon, BoardIcon, GanttIcon, LookaheadIcon, SearchIcon, FilterIcon, SpreadsheetIcon, DashboardIcon, ShareIcon, FillColorIcon } from '../common/Icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../common/ui/Tooltip';

const modes: { id: ViewMode; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'table', label: 'Table', icon: TableIcon },
  { id: 'spreadsheetV2', label: 'Spreadsheet', icon: SpreadsheetIcon },
  { id: 'board', label: 'Board', icon: BoardIcon },
  { id: 'gantt', label: 'Gantt', icon: GanttIcon },
  { id: 'lookahead', label: 'Lookahead', icon: LookaheadIcon },
];

const TabMenu: React.FC<{ view: View, isDefault: boolean, onRename: () => void, onDelete: () => void, onSetDefault: () => void, onShare: () => void, canDelete: boolean }> = 
({ view, isDefault, onRename, onDelete, onSetDefault, onShare, canDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const menuWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isOpen && menuWrapperRef.current) {
      const rect = menuWrapperRef.current.getBoundingClientRect();
      const MENU_WIDTH = 160; // w-40 matches the width below
      let left = rect.left;
      
      // Check right edge collision
      if (left + MENU_WIDTH > window.innerWidth) {
        left = rect.right - MENU_WIDTH;
      }

      setCoords({
        top: rect.bottom + 4, // Small gap
        left: left,
      });
    }
  }, [isOpen]);
    
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuWrapperRef.current && !menuWrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);


  return (
    <div ref={menuWrapperRef} className="relative">
      <button onClick={() => setIsOpen(prev => !prev)} className="p-1 rounded-md hover:bg-gray-200">
        <MoreHorizontalIcon className="w-4 h-4 text-gray-500" />
      </button>
      {isOpen && createPortal(
        <div 
            className="fixed w-40 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
            style={{ top: coords.top, left: coords.left }}
            onMouseDown={(e) => e.stopPropagation()}
        >
          <ul className="py-1">
            <li>
                <button 
                    onClick={() => { if(!isDefault) { onSetDefault(); setIsOpen(false); } }}
                    disabled={isDefault}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${isDefault ? 'text-gray-400 cursor-default' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    {isDefault ? 'Default view' : 'Set as default'}
                </button>
            </li>
            <li>
                <button 
                    onClick={() => { onShare(); setIsOpen(false); }} 
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    <ShareIcon className="w-3.5 h-3.5" />
                    Share
                </button>
            </li>
            <li>
                <button 
                    onClick={() => { onRename(); setIsOpen(false); }} 
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    Rename
                </button>
            </li>
            {canDelete && (
                <li>
                    <button 
                        onClick={() => { onDelete(); setIsOpen(false); }} 
                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        Delete
                    </button>
                </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
};

const ViewControls: React.FC = () => {
  const {
    views, activeViewId, defaultViewId, handleSelectView, setModalState, handleDeleteView, setDefaultViewId, setViews,
    activeViewMode, handleViewModeChange,
    searchTerm, setSearchTerm, showFilterMenu, setShowFilterMenu, showHighlightMenu, setShowHighlightMenu, activeView
  } = useProject();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const highlightButtonRef = useRef<HTMLButtonElement>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDropIndex(index);
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newViews = [...views];
    const [draggedItem] = newViews.splice(draggedIndex, 1);
    newViews.splice(index, 0, draggedItem);
    setViews(newViews);
    
    setDraggedIndex(null);
    setDropIndex(null);
  };

  const searchPlaceholder = activeViewMode === 'spreadsheet' || activeViewMode === 'spreadsheetV2' ? 'Search...' : 'Search tasks...';
  const showSearchAndFilter = activeViewMode !== 'dashboard';

  return (
        <div className="flex items-center gap-3 relative z-[90]">
            {showSearchAndFilter && (
                <>
                    {/* Search */}
                    <div className="relative">
                        <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-opacity duration-200 ${isSearchFocused ? 'opacity-0' : 'opacity-100'}`} />
                        <input 
                            type="text" 
                            placeholder={searchPlaceholder} 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className={`pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-48 shadow-sm transition-all duration-200 ${isSearchFocused ? 'pl-3' : 'pl-9'}`}
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <button ref={filterButtonRef} onClick={() => setShowFilterMenu(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm">
                            <FilterIcon className="w-4 h-4" />
                            <span>Filter</span>
                            {activeView.filters.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{activeView.filters.length}</span>}
                        </button>
                        {showFilterMenu && <FilterMenu onClose={() => setShowFilterMenu(false)} triggerRef={filterButtonRef} />}
                    </div>

                    {/* Highlight */}
                    <div className="relative">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <button ref={highlightButtonRef} onClick={() => setShowHighlightMenu(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm" aria-label="Highlight cells">
                                        <FillColorIcon className="w-4 h-4" />
                                        {(activeView.highlights?.length || 0) > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{activeView.highlights?.length}</span>}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Highlight</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {showHighlightMenu && <HighlightMenu onClose={() => setShowHighlightMenu(false)} triggerRef={highlightButtonRef} />}
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                </>
            )}

            {/* Standard Views Container */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 shadow-sm relative z-0">
                <div className="flex items-center">
                    <TooltipProvider>
                        {modes.map(({ id, label, icon: Icon }) => {
                        const isActive = activeViewMode === id;
                        return (
                            <Tooltip key={id}>
                                <TooltipTrigger>
                                    <button
                                        onClick={() => handleViewModeChange(id)}
                                        className={`p-2 text-sm font-medium rounded-md transition-colors ${
                                            isActive ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                        }`}
                                        aria-label={`Switch to ${label} view`}
                                        aria-pressed={isActive}
                                    >
                                    <Icon className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>{label}</TooltipContent>
                            </Tooltip>
                        );
                        })}
                    </TooltipProvider>
                </div>
            </div>

            {/* Custom Views Container */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 shadow-sm relative z-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <button onClick={() => setModalState({ type: 'create' })} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Create New View</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {views.length > 0 && <div className="h-6 w-px bg-gray-300 mx-2"></div>}

                <nav className="flex items-center gap-1" onDragLeave={() => setDropIndex(null)}>
                    {views.map((view, index) => {
                        const isActive = view.id === activeViewId;
                        const isDropTarget = dropIndex === index;
                        const isBeingDragged = draggedIndex === index;
                        const modeIcon = modes.find(m => m.id === view.type)?.icon;
                        const IconComponent = modeIcon || TableIcon;

                        return (
                            <div
                            key={view.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={() => { setDraggedIndex(null); setDropIndex(null); }}
                            className={`flex items-center rounded-md transition-all duration-150 ${ isBeingDragged ? 'opacity-50' : '' } ${ isDropTarget ? 'bg-gray-300' : '' } ${ isActive ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-200'}`}
                            >
                            <button
                                onClick={() => handleSelectView(view.id)}
                                className={`pl-2 pr-3 py-1.5 text-sm font-medium text-gray-800 rounded-l-md flex items-center gap-1.5`}
                            >
                                <IconComponent className="w-4 h-4 text-gray-500" />
                                {view.name}
                            </button>
                            <div className="pr-1">
                            <TabMenu 
                            view={view}
                            isDefault={view.id === defaultViewId}
                            onRename={() => setModalState({ type: 'rename', view })}
                            onDelete={() => handleDeleteView(view.id)}
                            onSetDefault={() => setDefaultViewId(view.id)}
                            onShare={() => console.log('Share view:', view.id)}
                            canDelete={true}
                            />
                            </div>
                            </div>
                        );
                    })}
                </nav>
            </div>
    </div>
  );
};

export default ViewControls;