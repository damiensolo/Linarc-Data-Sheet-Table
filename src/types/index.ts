export enum Status {
  New = 'New',
  Planned = 'Planned',
  InProgress = 'In Progress',
  InReview = 'In Review',
  Completed = 'Completed',
}

export enum Priority {
  Urgent = 'Urgent',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  None = 'None',
}

export enum Impact {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
}

export interface Assignee {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
}

export interface Progress {
    percentage: number;
    history?: number[];
}

export interface HealthItem {
    name: string;
    status: 'complete' | 'at_risk' | 'blocked';
    details: string;
}

export interface TaskStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface Task {
  id: number;
  name: string;
  status: Status;
  assignees: Assignee[];
  startDate: string; // DD/MM/YYYY
  dueDate: string; // DD/MM/YYYY
  isExpanded?: boolean;
  children?: Task[];
  priority?: Priority;
  impact?: Impact;
  progress?: Progress;
  health?: HealthItem[];
  style?: TaskStyle;
}

export type ColumnId = string;

export interface Column {
  id: ColumnId;
  label: string;
  width?: string;
  visible: boolean;
  minWidth?: number;
}

export type DisplayDensity = 'compact' | 'standard' | 'comfortable';

export type FilterOperator = 'contains' | 'not_contains' | 'is' | 'is_not' | 'is_empty' | 'is_not_empty' | 'is_any_of' | 'is_none_of' | 'lt' | 'gt' | 'lte' | 'gte' | 'eq' | 'neq';

export interface HighlightRule {
    id: string;
    columnId: ColumnId;
    operator: FilterOperator;
    value?: string | string[];
    color: string;
}

export interface FilterRule {
    id: string;
    columnId: ColumnId;
    operator: FilterOperator;
    value?: string | string[];
}

// Spreadsheet Specific Types
export interface BudgetLineItemStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface BudgetLineItem {
  id: string;
  sNo: number;
  costCode?: string;
  name: string;
  divisionCode?: string;
  divisionName?: string;
  type?: 'Original Bid' | 'Upcoming CO';
  quantity: number | null;
  unit: string;
  effortHours: number | null;
  calcType?: string;
  totalBudget: number;
  labor: number | null;
  equipment: number | null;
  subcontractor: number | null;
  material: number | null;
  others: number | null;
  overhead?: number | null;
  profit?: number | null;
  remainingContract?: number | null;
  hasWarning?: boolean;
  style?: BudgetLineItemStyle;
  children?: BudgetLineItem[];
  isExpanded?: boolean;
}

export interface SpreadsheetColumn {
    id: string;
    label: string;
    width: number;
    align?: 'left' | 'right';
    isTotal?: boolean;
    editable?: boolean;
}

export type ViewMode = 'table' | 'spreadsheet' | 'spreadsheetV2' | 'board' | 'gantt' | 'lookahead' | 'dashboard';

export interface View {
  id: string;
  name: string;
  type: ViewMode;
  filters: FilterRule[];
  sort: { columnId: ColumnId; direction: 'asc' | 'desc' } | null;
  columns: Column[];
  displayDensity: DisplayDensity;
  showGridLines: boolean;
  spreadsheetData?: BudgetLineItem[];
  spreadsheetColumns?: SpreadsheetColumn[];
  taskStyles?: { [taskId: number]: TaskStyle };
  fontSize: number;
  highlights?: HighlightRule[];
}