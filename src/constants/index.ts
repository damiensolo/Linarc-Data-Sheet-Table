import { Column, Status, Priority, ColumnId, FilterOperator, SpreadsheetColumn } from '../types';

export const getDefaultTableColumns = (): Column[] => [
  { id: 'details', label: '', width: '60px', visible: true, minWidth: 60 },
  { id: 'name', label: 'Subject', width: '350px', visible: true, minWidth: 200 },
  { id: 'status', label: 'Status', width: '160px', visible: true, minWidth: 120 },
  { id: 'assignee', label: 'Assigned To', width: '150px', visible: true, minWidth: 120 },
  { id: 'dates', label: 'Due Date', width: '140px', visible: true, minWidth: 100 },
  { id: 'progress', label: 'Progress', width: '200px', visible: true, minWidth: 150 },
];

export const FILTERABLE_COLUMNS: { id: ColumnId, label: string, type: 'text' | 'enum' | 'number' }[] = [
    { id: 'name', label: 'Subject', type: 'text' },
    { id: 'status', label: 'Status', type: 'enum' },
    { id: 'priority', label: 'Priority', type: 'enum' },
    { id: 'assignee', label: 'Assignee', type: 'text' },
    { id: 'dates', label: 'Due Date', type: 'text' },
    { id: 'totalBudget', label: 'Budget', type: 'number' },
    { id: 'remainingContract', label: 'Remaining', type: 'number' },
    { id: 'labor', label: 'Labor', type: 'number' },
    { id: 'material', label: 'Material', type: 'number' },
    { id: 'equipment', label: 'Equipment', type: 'number' },
    { id: 'subcontractor', label: 'Subcontractor', type: 'number' },
    { id: 'effortHours', label: 'Hours', type: 'number' },
];

export const TEXT_OPERATORS: { id: FilterOperator, label: string }[] = [
    { id: 'contains', label: 'contains' },
    { id: 'not_contains', label: 'does not contain' },
    { id: 'is', label: 'is' },
    { id: 'is_not', label: 'is not' },
    { id: 'is_empty', label: 'is empty' },
    { id: 'is_not_empty', label: 'is not empty' },
];

export const NUMBER_OPERATORS: { id: FilterOperator, label: string }[] = [
    { id: 'eq', label: '=' },
    { id: 'neq', label: '!=' },
    { id: 'gt', label: '>' },
    { id: 'lt', label: '<' },
    { id: 'gte', label: '>=' },
    { id: 'lte', label: '<=' },
    { id: 'is_empty', label: 'is empty' },
    { id: 'is_not_empty', label: 'is not empty' },
];

export const ENUM_OPERATORS: { id: FilterOperator, label: string }[] = [
    { id: 'is_any_of', label: 'is any of' },
    { id: 'is_none_of', label: 'is none of' },
    { id: 'is_empty', label: 'is empty' },
    { id: 'is_not_empty', label: 'is not empty' },
];

export const getEnumOptions = (columnId: ColumnId): { id: string, label: string }[] => {
    switch (columnId) {
        case 'status':
            return Object.values(Status).map(s => ({ id: s, label: s }));
        case 'priority':
            return Object.values(Priority).map(p => ({ id: p, label: p }));
        default:
            return [];
    }
};

export const getDefaultSpreadsheetColumns = (): SpreadsheetColumn[] => [
    { id: 'name', label: 'Contract Line', width: 220, editable: true },
    { id: 'remainingContract', label: 'Remaining Contract', width: 140, align: 'right', isTotal: true, editable: true },
    { id: 'costCode', label: 'Cost Code', width: 90, editable: true },
    { id: 'quantity', label: 'Qty', width: 60, align: 'right', editable: true },
    { id: 'unit', label: 'UOM', width: 50, editable: true },
    { id: 'effortHours', label: 'Hours', width: 60, align: 'right', isTotal: true, editable: true },
    { id: 'totalBudget', label: 'Budget', width: 110, align: 'right', isTotal: true, editable: true },
    { id: 'labor', label: 'Labor', width: 90, align: 'right', isTotal: true, editable: true },
    { id: 'material', label: 'Material', width: 90, align: 'right', isTotal: true, editable: true },
    { id: 'equipment', label: 'Equipment', width: 90, align: 'right', isTotal: true, editable: true },
    { id: 'subcontractor', label: 'Sub', width: 90, align: 'right', isTotal: true, editable: true },
    { id: 'others', label: 'Others', width: 80, align: 'right', isTotal: true, editable: true },
    { id: 'overhead', label: 'Overhead', width: 90, align: 'right', isTotal: true, editable: true },
    { id: 'profit', label: 'Profit', width: 90, align: 'right', isTotal: true, editable: true },
];