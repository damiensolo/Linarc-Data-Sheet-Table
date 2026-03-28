
import { useMemo, useState, useCallback, useEffect } from 'react';
import { Task, View } from '../types';

export const useProjectData = (tasks: Task[], activeView: View, searchTerm: string, expansionCycle: number = 0) => {
  const [localExpandedIds, setLocalExpandedIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
     if (expansionCycle === 0) {
         setLocalExpandedIds(new Set());
     }
  }, [expansionCycle]);

  const handleToggleLocal = useCallback((id: string | number) => {
      setLocalExpandedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  }, []);

  const filteredTasks = useMemo(() => {
    const filterNode = (task: Task): Task | null => {
        let children: Task[] = [];
        if (task.children) {
            children = task.children.map(filterNode).filter(Boolean) as Task[];
        }

        const matchSearch = !searchTerm || task.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchFilters = (activeView.filters || []).every(rule => {
            const value = (task as any)[rule.columnId];
            if (value === undefined || value === null) {
                return rule.operator === 'is_empty';
            }
            switch (rule.operator) {
                case 'contains':
                    return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
                case 'not_contains':
                    return !String(value).toLowerCase().includes(String(rule.value).toLowerCase());
                case 'is':
                    return String(value) === String(rule.value);
                case 'is_not':
                    return String(value) !== String(rule.value);
                case 'is_empty':
                    return value === undefined || value === null || String(value).trim() === '';
                case 'is_not_empty':
                    return value !== undefined && value !== null && String(value).trim() !== '';
                case 'is_any_of':
                    return Array.isArray(rule.value) && rule.value.includes(String(value));
                case 'is_none_of':
                    return Array.isArray(rule.value) && !rule.value.includes(String(value));
                default:
                    return true;
            }
        });

        if ((matchSearch && matchFilters) || children.length > 0) {
            return { ...task, children };
        }
        return null;
    };
    return tasks.map(filterNode).filter(Boolean) as Task[];
  }, [tasks, activeView.filters, searchTerm]);

  const sortedTasks = useMemo(() => {
    const { sort } = activeView;
    if (!sort) return filteredTasks;
    
    const sortRecursively = (taskArray: Task[]): Task[] => {
      const sorted = [...taskArray].sort((a, b) => {
        const valA = (a as any)[sort.columnId];
        const valB = (b as any)[sort.columnId];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
      
      return sorted.map(task => {
        if (task.children && task.children.length > 0) {
          return { ...task, children: sortRecursively(task.children) };
        }
        return task;
      });
    };
    
    return sortRecursively(filteredTasks);
  }, [filteredTasks, activeView.sort]);

  const groupedItems = useMemo(() => {
    const groupByCols = activeView.groupBy || [];
    if (groupByCols.length === 0) return sortedTasks;

    // Flatten all filtered/sorted tasks for re-grouping
    const allItems: Task[] = [];
    const extract = (items: Task[]) => {
        items.forEach(t => {
            const { children, ...rest } = t;
            allItems.push({ ...rest, children: [] } as any);
            if (children) extract(children);
        });
    };
    extract(sortedTasks);

    const groupRecursive = (items: Task[], groupIdx: number, path: string): Task[] => {
        if (groupIdx >= groupByCols.length) return items;
        const rule = groupByCols[groupIdx];
        const colId = rule.columnId;

        const groups = new Map<string, Task[]>();
        items.forEach(item => {
            let val = (item as any)[colId];
            if (val && typeof val === 'object' && 'name' in val) val = val.name; // For Assignee, etc.
            const colLabel = activeView.columns.find(c => c.id === colId)?.label || colId;
            if (val === null || val === undefined || val === '') val = `No ${colLabel}`;
            const strVal = String(val);
            if (!groups.has(strVal)) groups.set(strVal, []);
            groups.get(strVal)!.push(item);
        });

        const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
            const numA = parseFloat(a.replace(/[^0-9.-]+/g, ""));
            const numB = parseFloat(b.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(numA) && !isNaN(numB)) return rule.direction === 'asc' ? numA - numB : numB - numA;
            return rule.direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });

        return sortedKeys.map((key, idx) => {
            const itemsInGroup = groups.get(key)!;
            const groupId = `group-${path}-${colId}-${key}`;
            const colLabel = activeView.columns.find(c => c.id === colId)?.label || colId;

            return {
                id: groupId,
                name: `${colLabel}: ${key} (${itemsInGroup.length})`,
                status: 'New' as any,
                assignees: [],
                isGroup: true,
                children: groupRecursive(itemsInGroup, groupIdx + 1, path + (key as any))
            } as any as Task;
        });
    };

    return groupRecursive(allItems, 0, 'root');
  }, [sortedTasks, activeView.groupBy, activeView.columns]);

  const { visibleTaskIds, rowNumberMap } = useMemo(() => {
    const ids: (number | string)[] = [];
    const map = new Map<number | string, number>();
    
    let rowCounter = 1;
    const assignRowNumbers = (items: Task[]) => {
        items.forEach(task => {
            if (!(task as any).isGroup) {
               map.set(task.id, rowCounter++);
            }
            if (task.children) {
                assignRowNumbers(task.children);
            }
        });
    };
    assignRowNumbers(groupedItems);

    const determineVisible = (items: Task[]) => {
        items.forEach(task => {
            ids.push(task.id);
            
            let isExpanded = task.isGroup ? localExpandedIds.has(task.id) : (task.isExpanded ?? false);
            
            // Override with expansion cycle
            if (expansionCycle === 2) {
                isExpanded = true;
            } else if (expansionCycle === 1 && (task as any).isGroup && String(task.id).startsWith('group-root-')) {
                isExpanded = true;
            } else if (expansionCycle === 0) {
                isExpanded = false;
            }
            
            if (isExpanded && task.children && task.children.length > 0) {
                determineVisible(task.children);
            }
        });
    };
    determineVisible(groupedItems);

    return { visibleTaskIds: ids, rowNumberMap: map };
  }, [groupedItems, localExpandedIds, expansionCycle]);

  const rootIds = useMemo(() => new Set(groupedItems.map(t => t.id)), [groupedItems]);

  const isExpandedLocal = useCallback((id: string | number) => {
      // Cycle 2: Expand Everything
      if (expansionCycle === 2) return true;
      
      // Cycle 0: Collapse everything
      if (expansionCycle === 0) return false;

      // Cycle 1: Expand First Tier (Root groups or root tasks)
      if (expansionCycle === 1) {
          if (rootIds.has(id)) return true;
          // Also check for root groups specifically if IDs were somehow changed
          if (String(id).startsWith('group-root-')) return true;
      }
      
      // Check local state for specific toggles
      if (localExpandedIds.has(id)) return true;

      // Fallback for real tasks if they aren't in localExpandedIds
      const findTaskRecursive = (items: Task[]): Task | undefined => {
          for (const item of items) {
              if (item.id === id) return item;
              if (item.children) {
                  const found = findTaskRecursive(item.children);
                  if (found) return found;
              }
          }
      };
      
      const task = findTaskRecursive(groupedItems);
      return task?.isExpanded || false;
  }, [groupedItems, localExpandedIds, expansionCycle, rootIds]);

  return { 
      sortedTasks: groupedItems, 
      visibleTaskIds, 
      rowNumberMap, 
      handleToggleLocal, 
      isExpandedLocal 
  };
};
