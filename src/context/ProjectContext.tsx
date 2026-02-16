import React, { createContext, useState, useMemo, useCallback, useContext, useRef, useEffect, SetStateAction, ReactNode } from 'react';
import { MOCK_TASKS, MOCK_BUDGET_DATA } from '../data';
import { Task, View, FilterRule, HighlightRule, Priority, ColumnId, Status, DisplayDensity, Column, ViewMode } from '../types';
import { getDefaultTableColumns, getDefaultSpreadsheetColumns } from '../constants';

type SortConfig = {
  columnId: ColumnId;
  direction: 'asc' | 'desc';
} | null;

const getDefaultViewConfig = (viewMode: ViewMode): Omit<View, 'id' | 'name'> => {
  const baseConfig = {
    filters: [],
    highlights: [],
    sort: null,
    displayDensity: 'comfortable' as DisplayDensity,
    showGridLines: false,
    showColoredRows: true,
    taskStyles: {},
    fontSize: 12,
  };

  switch (viewMode) {
    case 'dashboard':
      return { ...baseConfig, type: 'dashboard', columns: [] };
    case 'spreadsheet':
    case 'spreadsheetV2':
      return {
        ...baseConfig,
        type: viewMode,
        displayDensity: 'compact',
        columns: [],
        spreadsheetData: JSON.parse(JSON.stringify(MOCK_BUDGET_DATA)),
        spreadsheetColumns: getDefaultSpreadsheetColumns(),
      };
    case 'lookahead':
       return { ...baseConfig, displayDensity: 'standard', type: 'lookahead', columns: JSON.parse(JSON.stringify(getDefaultTableColumns())) };
    case 'gantt':
      return { ...baseConfig, displayDensity: 'compact', type: 'gantt', columns: [] };
    case 'board':
      return { ...baseConfig, type: viewMode, columns: [] };
    case 'table':
    default:
      return {
        ...baseConfig,
        type: 'table',
        columns: JSON.parse(JSON.stringify(getDefaultTableColumns())),
        spreadsheetData: [],
        spreadsheetColumns: [],
      };
  }
};


interface ProjectContextType {
  tasks: Task[];
  setTasks: React.Dispatch<SetStateAction<Task[]>>;
  views: View[];
  setViews: React.Dispatch<SetStateAction<View[]>>;
  activeViewId: string | null;
  handleSelectView: (viewId: string) => void;
  defaultViewId: string;
  setDefaultViewId: React.Dispatch<SetStateAction<string>>;
  activeViewMode: ViewMode;
  handleViewModeChange: (mode: ViewMode) => void;
  selectedTaskIds: Set<number>;
  setSelectedTaskIds: React.Dispatch<SetStateAction<Set<number>>>;
  editingCell: { taskId: number; column: string } | null;
  setEditingCell: React.Dispatch<SetStateAction<{ taskId: number; column: string } | null>>;
  detailedTaskId: number | null;
  setDetailedTaskId: React.Dispatch<SetStateAction<number | null>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<SetStateAction<string>>;
  modalState: { type: 'create' | 'rename'; view?: View } | null;
  setModalState: React.Dispatch<SetStateAction<{ type: 'create' | 'rename'; view?: View } | null>>;
  showFilterMenu: boolean;
  setShowFilterMenu: React.Dispatch<SetStateAction<boolean>>;
  showHighlightMenu: boolean;
  setShowHighlightMenu: React.Dispatch<SetStateAction<boolean>>;
  showFieldsMenu: boolean;
  setShowFieldsMenu: React.Dispatch<SetStateAction<boolean>>;
  activeView: View;
  /** Highlights used for cell rendering; updates immediately when user changes color */
  displayHighlights: HighlightRule[];
  updateView: (updatedView: Partial<Omit<View, 'id' | 'name'>>) => void;
  setFilters: (filters: FilterRule[]) => void;
  setHighlights: (highlights: HighlightRule[]) => void;
  setSort: (sort: SortConfig) => void;
  setColumns: (updater: SetStateAction<Column[]>) => void;
  setDisplayDensity: (density: DisplayDensity) => void;
  setShowGridLines: (show: boolean) => void;
  setShowColoredRows: (show: boolean) => void;
  setFontSize: (size: number) => void;
  handleSort: (columnId: ColumnId) => void;
  handleUpdateTask: (taskId: number, updatedValues: Partial<Omit<Task, 'id' | 'children'>>) => void;
  handlePriorityChange: (taskId: number, priority: Priority) => void;
  handleToggle: (taskId: number) => void;
  handleSaveView: (name: string) => void;
  handleDeleteView: (id: string) => void;
  detailedTask: Task | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [views, setViews] = useState<View[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [defaultViewId, setDefaultViewId] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('spreadsheetV2');
  const [transientView, setTransientView] = useState<View | null>(null);
  
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ taskId: number; column: string } | null>(null);
  const [detailedTaskId, setDetailedTaskId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalState, setModalState] = useState<{ type: 'create' | 'rename'; view?: View } | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showFieldsMenu, setShowFieldsMenu] = useState(false);
  const [displayHighlights, setDisplayHighlights] = useState<HighlightRule[]>([]);

  const activeView = useMemo<View>(() => {
    if (activeViewId === null) {
      if (transientView && transientView.type === activeViewMode) {
        return transientView;
      }
      return { id: `transient-${Date.now()}`, name: 'Default View', ...getDefaultViewConfig(activeViewMode) };
    }
    const foundView = views.find(v => v.id === activeViewId);
    if (!foundView) {
        return { id: `transient-fallback-${Date.now()}`, name: 'Default View', ...getDefaultViewConfig(activeViewMode) };
    }
    return foundView;
  }, [views, activeViewId, activeViewMode, transientView]);

  const activeViewRef = useRef<View>(activeView);
  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  // Sync displayHighlights only when switching views, so we don't overwrite
  // the value set by setHighlights when the user picks a color.
  useEffect(() => {
    setDisplayHighlights(activeView.highlights ?? []);
  }, [activeViewId, activeViewMode]);

  const handleSelectView = (viewId: string) => {
    const selectedView = views.find(v => v.id === viewId);
    if (selectedView) {
      setActiveViewId(selectedView.id);
      setActiveViewMode(selectedView.type);
      setTransientView(null);
    }
    setDetailedTaskId(null);
  };

  const updateView = useCallback((updatedProps: Partial<Omit<View, 'id' | 'name'>>) => {
    if (activeViewId === null) {
      setTransientView(prev => {
        const base = prev ?? activeViewRef.current;
        return { ...base, ...updatedProps };
      });
    } else {
      setViews(prev => prev.map(v => v.id === activeViewId ? { ...v, ...updatedProps } : v));
    }
  }, [activeViewId]);

  const setFilters = (filters: FilterRule[]) => updateView({ filters });
  const setHighlights = useCallback((highlights: HighlightRule[]) => {
    const next = highlights.length ? [...highlights] : [];
    setDisplayHighlights(next);
    updateView({ highlights: next });
  }, [updateView]);
  const setSort = (sort: SortConfig) => updateView({ sort });
  const setColumns = (updater: SetStateAction<View['columns']>) => {
    const newColumns =
      typeof updater === 'function'
        ? updater(activeView.columns)
        : updater;
    updateView({ columns: newColumns });
  };
  const setDisplayDensity = (density: View['displayDensity']) => updateView({ displayDensity: density });
  const setShowGridLines = (show: boolean) => updateView({ showGridLines: show });
  const setShowColoredRows = (show: boolean) => updateView({ showColoredRows: show });
  const setFontSize = (size: number) => updateView({ fontSize: size });

  const handleSort = (columnId: ColumnId) => {
    const newSort: SortConfig = {
        columnId,
        direction: activeView.sort?.columnId === columnId && activeView.sort.direction === 'asc' ? 'desc' : 'asc',
    };
    setSort(newSort);
  };
  
  const handleViewModeChange = (mode: ViewMode) => {
      setActiveViewMode(mode);
      setActiveViewId(null);
      setTransientView({ 
          id: `transient-${Date.now()}`, 
          name: 'Default View', 
          ...getDefaultViewConfig(mode) 
      });
      setDetailedTaskId(null);
  };

  const handleUpdateTask = useCallback((taskId: number, updatedValues: Partial<Omit<Task, 'id' | 'children'>>) => {
      const updateRecursively = (taskItems: Task[]): Task[] => {
          return taskItems.map(task => {
              if (task.id === taskId) {
                  return { ...task, ...updatedValues };
              }
              if (task.children) {
                  return { ...task, children: updateRecursively(task.children) };
              }
              return task;
          });
      };
      setTasks(prev => updateRecursively(prev));
  }, []);

  const handlePriorityChange = useCallback((taskId: number, priority: Priority) => {
    handleUpdateTask(taskId, { priority });
  }, [handleUpdateTask]);

  const handleToggle = useCallback((taskId: number) => {
      const toggleRecursively = (taskItems: Task[]): Task[] => {
          return taskItems.map(task => {
              if (task.id === taskId) {
                  return { ...task, isExpanded: !task.isExpanded };
              }
              if (task.children) {
                  return { ...task, children: toggleRecursively(task.children) };
              }
              return task;
          });
      };
      setTasks(prev => toggleRecursively(prev));
  }, []);

  const handleSaveView = (name: string) => {
    if (modalState?.type === 'rename' && modalState.view) {
        setViews(views.map(v => v.id === modalState.view!.id ? { ...v, name } : v));
    } else {
        const newView: View = {
             ...activeView,
             id: `view_${Date.now()}`,
             name,
        };
        const newViews = [...views, newView];
        setViews(newViews);
        setActiveViewId(newView.id);
        setTransientView(null);

        if (newViews.length === 1) {
            setDefaultViewId(newView.id);
        }
    }
    setModalState(null);
  };
  
  const handleDeleteView = (id: string) => {
    const viewToDelete = views.find(v => v.id === id);
    if (!viewToDelete) return;

    const newViews = views.filter(v => v.id !== id);
    setViews(newViews);

    if (defaultViewId === id) {
        setDefaultViewId(newViews.length > 0 ? newViews[0].id : '');
    }

    if (activeViewId === id) {
        const nextViewInMode = newViews.find(v => v.type === viewToDelete.type);
        if (nextViewInMode) {
            setActiveViewId(nextViewInMode.id);
        } else {
            setActiveViewId(null);
            setActiveViewMode(viewToDelete.type);
            setTransientView({ id: `transient-${Date.now()}`, name: `Default ${viewToDelete.type}`, ...getDefaultViewConfig(viewToDelete.type) });
        }
    }
  };

  const detailedTask = useMemo(() => {
    if (!detailedTaskId) return null;
    const findTask = (items: Task[]): Task | null => {
        for (const item of items) {
            if (item.id === detailedTaskId) return item;
            if (item.children) {
                const found = findTask(item.children);
                if (found) return found;
            }
        }
        return null;
    }
    return findTask(tasks);
  }, [tasks, detailedTaskId]);

  const value: ProjectContextType = {
    tasks, setTasks,
    views, setViews,
    activeViewId,
    handleSelectView,
    defaultViewId, setDefaultViewId,
    activeViewMode, handleViewModeChange,
    selectedTaskIds, setSelectedTaskIds,
    editingCell, setEditingCell,
    detailedTaskId, setDetailedTaskId,
    searchTerm, setSearchTerm,
    modalState, setModalState,
    showFilterMenu, setShowFilterMenu,
    showHighlightMenu, setShowHighlightMenu,
    showFieldsMenu, setShowFieldsMenu,
    activeView,
    displayHighlights,
    updateView,
    setFilters,
    setHighlights,
    setSort,
    setColumns,
    setDisplayDensity,
    setShowGridLines,
    setShowColoredRows,
    setFontSize,
    handleSort,
    handleUpdateTask,
    handlePriorityChange,
    handleToggle,
    handleSaveView,
    handleDeleteView,
    detailedTask,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};