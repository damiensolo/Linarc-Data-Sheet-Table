export enum ConstraintType {
  Predecessor = 'Predecessor',
  RFI = 'RFI',
  Submittal = 'Submittal',
  Material = 'Material',
}

export enum ConstraintStatus {
  Complete = 'Complete',
  Pending = 'Pending Review',
  Overdue = 'Overdue',
  OnSite = 'On Site',
}

export interface Constraint {
  type: ConstraintType;
  name: string;
  status: ConstraintStatus;
  severity: 'Blocking' | 'Warning';
  link?: string;
  flaggedBy?: string;
  timestamp?: string;
}

export interface ManHours {
  actual: number;
  budget: number;
}

export interface LookaheadStatus {
  [ConstraintType.Predecessor]: ConstraintStatus;
  [ConstraintType.RFI]: ConstraintStatus;
  [ConstraintType.Submittal]: ConstraintStatus;
  [ConstraintType.Material]: ConstraintStatus;
}

export interface WeatherForecast {
    date: string; // YYYY-MM-DD
    icon: 'sun' | 'cloud' | 'rain';
    temp: number;
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  quantity: { plan: number; actual: number; unit: string };
  hours: { plan: number; actual: number };
  crew: { plan: number; actual: number };
}

export interface LookaheadTask {
  id: string | number;
  name: string;
  resource: string;
  startDate: string; // YYYY-MM-DD
  finishDate: string; // YYYY-MM-DD
  status: LookaheadStatus;
  constraints: Constraint[];
  manHours: ManHours;
  children?: LookaheadTask[];
  isExpanded?: boolean;
  isCriticalPath?: boolean;
  ppcHistory?: number[];
  dailyMetrics?: DailyMetric[];
}