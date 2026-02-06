import { Task, Status, Priority, Impact, BudgetLineItem } from '../types';

export const MOCK_TASKS: Task[] = [
  {
    id: 100,
    name: 'Phase 1: Site Preparation & Earthwork',
    status: Status.InProgress,
    assignees: [{ id: 10, name: 'Civil Team', initials: 'CT', avatarColor: 'bg-orange-500' }],
    startDate: '01/11/2024',
    dueDate: '20/11/2024',
    isExpanded: true,
    priority: Priority.High,
    impact: Impact.High,
    progress: { percentage: 45, history: [0, 20, 45] },
    children: [
      {
        id: 101,
        name: 'Site Survey & Layout',
        status: Status.Completed,
        assignees: [{ id: 11, name: 'Surveyor John', initials: 'SJ', avatarColor: 'bg-blue-500' }],
        startDate: '01/11/2024',
        dueDate: '03/11/2024',
        priority: Priority.Medium,
        impact: Impact.Medium,
        progress: { percentage: 100, history: [0, 100] },
      },
      {
        id: 102,
        name: 'Clearing & Grubbing',
        status: Status.Completed,
        assignees: [{ id: 12, name: 'Operator Mike', initials: 'OM', avatarColor: 'bg-amber-500' }],
        startDate: '04/11/2024',
        dueDate: '08/11/2024',
        priority: Priority.High,
        impact: Impact.High,
        progress: { percentage: 100, history: [0, 50, 100] },
      },
      {
        id: 103,
        name: 'Bulk Excavation & Grading',
        status: Status.InProgress,
        assignees: [{ id: 12, name: 'Operator Mike', initials: 'OM', avatarColor: 'bg-amber-500' }],
        startDate: '09/11/2024',
        dueDate: '20/11/2024',
        priority: Priority.Urgent,
        impact: Impact.High,
        progress: { percentage: 30, history: [0, 15, 30] },
      },
    ],
  },
  {
    id: 200,
    name: 'Phase 2: Foundations & Substructure',
    status: Status.Planned,
    assignees: [{ id: 20, name: 'Concrete Sub', initials: 'CS', avatarColor: 'bg-emerald-500' }],
    startDate: '21/11/2024',
    dueDate: '15/12/2024',
    isExpanded: true,
    priority: Priority.High,
    impact: Impact.High,
    progress: { percentage: 0, history: [0] },
    children: [
      {
        id: 201,
        name: 'Rebar Fabrication & Delivery',
        status: Status.InProgress,
        assignees: [{ id: 21, name: 'Steel Fab', initials: 'SF', avatarColor: 'bg-zinc-500' }],
        startDate: '10/11/2024',
        dueDate: '25/11/2024',
        priority: Priority.Medium,
        impact: Impact.High,
        progress: { percentage: 60, history: [0, 30, 60] },
      },
      {
        id: 202,
        name: 'Footing Reinforcement',
        status: Status.Planned,
        assignees: [{ id: 20, name: 'Concrete Sub', initials: 'CS', avatarColor: 'bg-emerald-500' }],
        startDate: '21/11/2024',
        dueDate: '28/11/2024',
        priority: Priority.High,
        impact: Impact.High,
        progress: { percentage: 0, history: [0] },
      },
      {
        id: 203,
        name: 'Foundation Concrete Pour',
        status: Status.Planned,
        assignees: [{ id: 20, name: 'Concrete Sub', initials: 'CS', avatarColor: 'bg-emerald-500' }],
        startDate: '01/12/2024',
        dueDate: '05/12/2024',
        priority: Priority.Urgent,
        impact: Impact.High,
        progress: { percentage: 0, history: [0] },
      },
    ],
  },
  {
    id: 300,
    name: 'Phase 3: Superstructure framing',
    status: Status.Planned,
    assignees: [{ id: 30, name: 'Framing Team', initials: 'FT', avatarColor: 'bg-indigo-500' }],
    startDate: '16/12/2024',
    dueDate: '20/01/2025',
    isExpanded: false,
    priority: Priority.Medium,
    impact: Impact.High,
    progress: { percentage: 0, history: [0] },
    children: [
      {
        id: 301,
        name: 'Structural Steel Erection',
        status: Status.Planned,
        assignees: [{ id: 31, name: 'Crane Ops', initials: 'CO', avatarColor: 'bg-rose-500' }],
        startDate: '16/12/2024',
        dueDate: '30/12/2024',
        priority: Priority.High,
        impact: Impact.High,
        progress: { percentage: 0, history: [0] },
      },
    ]
  },
  {
    id: 1,
    name: 'RFI-001: Grade Beam Reinforcement Conflict',
    status: Status.InReview,
    assignees: [
      { id: 1, name: 'John Architect', initials: 'JA', avatarColor: 'bg-indigo-500' },
    ],
    startDate: '12/11/2024',
    dueDate: '19/11/2024',
    isExpanded: true,
    priority: Priority.High,
    impact: Impact.High,
    progress: { percentage: 60, history: [0, 20, 40, 60] },
    health: [
        { name: 'Technical Response', status: 'at_risk', details: 'Structural engineer review pending.'},
    ],
    children: [
      {
        id: 2,
        name: 'Structural Engineer Internal Review',
        status: Status.InProgress,
        assignees: [{ id: 2, name: 'Sarah Engineer', initials: 'SE', avatarColor: 'bg-emerald-500' }],
        startDate: '13/11/2024',
        dueDate: '15/11/2024',
        priority: Priority.Urgent,
        impact: Impact.High,
        progress: { percentage: 80, history: [10, 40, 80] },
      },
    ],
  },
];

export const MOCK_BUDGET_DATA: BudgetLineItem[] = [
  { 
    id: '1', sNo: 1, name: 'Selective Site Demolition', remainingContract: 5000, totalBudget: 425000, quantity: 1, unit: 'LS', effortHours: 120, labor: 4000, equipment: 2000, subcontractor: 4000, material: 1000, others: 500, profit: 500, overhead: 0, isExpanded: true,
    children: [
        { id: '1.1', sNo: 1, costCode: '02-411', name: 'Structure Demolition - East Wing', quantity: 1, unit: 'LS', effortHours: 80, totalBudget: 220000, labor: 3000, material: 500, equipment: 1500, subcontractor: 2500, others: 500, overhead: 0, profit: 0, remainingContract: null },
        { id: '1.2', sNo: 1, costCode: '02-412', name: 'Hazardous Material Abatement', quantity: 500, unit: 'SF', effortHours: 40, totalBudget: 205000, labor: 1000, material: 500, equipment: 500, subcontractor: 1500, others: 0, overhead: 0, profit: 500, remainingContract: null },
    ]
  },
  { 
    id: '2', sNo: 2, name: 'Rock Excavation and Disposal', remainingContract: 2500, totalBudget: 385000, quantity: 200, unit: 'CY', effortHours: 85, labor: 3000, equipment: 4000, subcontractor: 0, material: 0, others: 500, profit: 1000, overhead: 0, isExpanded: false,
    children: [
        { id: '2.1', sNo: 2, costCode: '31-231', name: 'Drilling & Blasting', quantity: 100, unit: 'CY', effortHours: 45, totalBudget: 200000, labor: 1500, material: 0, equipment: 2500, subcontractor: 0, others: 0, overhead: 0, profit: 1000, remainingContract: null },
        { id: '2.2', sNo: 2, costCode: '31-232', name: 'Off-site Disposal', quantity: 100, unit: 'CY', effortHours: 40, totalBudget: 185000, labor: 1500, material: 0, equipment: 1500, subcontractor: 0, others: 500, overhead: 0, profit: 0, remainingContract: null },
    ]
  },
  { 
    id: '3', sNo: 3, name: 'Bulk Earthwork and Fill', remainingContract: 0, totalBudget: 1216810.05, quantity: 1, unit: 'LS', effortHours: 0, labor: 0, equipment: 0, subcontractor: 0, material: 4444.00, others: 0, overhead: 1681.00, profit: 10685.05, isExpanded: true,
    children: [
        { id: '3.1', sNo: 3, costCode: '31-100', name: 'Site Clearing', quantity: 45, unit: 'HR', effortHours: 0, totalBudget: 500000, labor: 0, material: 0, equipment: 0, subcontractor: 0, others: 0, overhead: 500, profit: 4500, remainingContract: null },
        { id: '3.2', sNo: 3, costCode: '31-200', name: 'Earth Moving', quantity: 43, unit: 'SF', effortHours: 0, totalBudget: 400000, labor: 0, material: 0, equipment: 0, subcontractor: 0, others: 0, overhead: 500, profit: 4500, remainingContract: null },
        { id: '3.3', sNo: 3, costCode: '31-300', name: 'Compaction Services', quantity: 100, unit: 'LS', effortHours: 0, totalBudget: 316810.05, labor: 0, material: 4444.00, equipment: 0, subcontractor: 0, others: 0, overhead: 681, profit: 1685.05, remainingContract: null },
    ]
  },
  { 
    id: '4', sNo: 4, name: 'Subgrade Preparation', remainingContract: 1200, totalBudget: 345000, quantity: 1000, unit: 'SY', effortHours: 40, labor: 2000, equipment: 1500, subcontractor: 0, material: 500, others: 500, profit: 0, overhead: 0, isExpanded: false,
    children: [
        { id: '4.1', sNo: 4, costCode: '31-220', name: 'Fine Grading', quantity: 1000, unit: 'SY', effortHours: 40, totalBudget: 345000, labor: 2000, material: 500, equipment: 1500, subcontractor: 0, others: 500, overhead: 0, profit: 0, remainingContract: null },
    ]
  },
  { 
    id: '5', sNo: 5, name: 'Shallow Concrete Footings', remainingContract: 15000, totalBudget: 825000, quantity: 80, unit: 'CY', effortHours: 320, labor: 12000, equipment: 3000, subcontractor: 0, material: 8000, others: 1000, profit: 1000, overhead: 0, isExpanded: false,
    children: [
        { id: '5.1', sNo: 5, costCode: '03-311', name: 'Formwork Installation', quantity: 400, unit: 'SF', effortHours: 120, totalBudget: 280000, labor: 5000, material: 1000, equipment: 1000, subcontractor: 0, others: 500, overhead: 0, profit: 500, remainingContract: null },
        { id: '5.2', sNo: 5, costCode: '03-312', name: 'Rebar Placement', quantity: 2, unit: 'TON', effortHours: 80, totalBudget: 270000, labor: 3000, material: 3500, equipment: 500, subcontractor: 0, others: 0, overhead: 0, profit: 0, remainingContract: null },
        { id: '5.3', sNo: 5, costCode: '03-313', name: 'Concrete Pour & Finish', quantity: 80, unit: 'CY', effortHours: 120, totalBudget: 275000, labor: 4000, material: 3500, equipment: 1500, subcontractor: 0, others: 500, overhead: 0, profit: 500, remainingContract: null },
    ]
  },
  { 
    id: '6', sNo: 6, name: 'Formwork and Shoring', remainingContract: 3000, totalBudget: 850000, quantity: 5000, unit: 'SF', effortHours: 450, labor: 10000, equipment: 1000, subcontractor: 2000, material: 1000, others: 1000, profit: 0, overhead: 0, isExpanded: true,
    children: [
        { id: '6.1', sNo: 6, costCode: '03-100', name: 'Vertical Wall Formwork', quantity: 2000, unit: 'SF', effortHours: 200, totalBudget: 425000, labor: 5000, material: 500, equipment: 500, subcontractor: 1000, others: 500, overhead: 0, profit: 0, remainingContract: null },
        { id: '6.2', sNo: 6, costCode: '03-110', name: 'Horizontal Deck Shoring', quantity: 3000, unit: 'SF', effortHours: 250, totalBudget: 425000, labor: 5000, material: 500, equipment: 500, subcontractor: 1000, others: 500, overhead: 0, profit: 0, remainingContract: null },
    ]
  },
  { 
    id: '7', sNo: 7, name: 'Concrete Pumping Service', remainingContract: 500, totalBudget: 310500, quantity: 4, unit: 'DAY', effortHours: 32, labor: 1500, equipment: 2000, subcontractor: 0, material: 0, others: 0, profit: 0, overhead: 0, isExpanded: true,
    children: [
        { id: '7.1', sNo: 7, costCode: '03-301', name: 'Setup & Mobilization', quantity: 4, unit: 'DAY', effortHours: 16, totalBudget: 155000, labor: 1000, material: 0, equipment: 500, subcontractor: 0, others: 0, overhead: 0, profit: 0, remainingContract: null },
        { id: '7.2', sNo: 7, costCode: '03-302', name: 'Pumping Operations', quantity: 4, unit: 'DAY', effortHours: 16, totalBudget: 155500, labor: 500, material: 0, equipment: 1500, subcontractor: 0, others: 0, overhead: 0, profit: 0, remainingContract: null },
    ]
  },
];

// --- DASHBOARD DATA ---
export const DASHBOARD_TASK_STATUS_DATA = [
	{ group: 'Closed', value: 25 },
	{ group: 'Under Review', value: 18 },
	{ group: 'Responded', value: 8 },
	{ group: 'Submitted', value: 12 },
    { group: 'Draft', value: 5 },
];

export const DASHBOARD_PRODUCTIVITY_DATA = [
	{ group: 'Framing Sub', key: 'Planned', value: 200 },
	{ group: 'Framing Sub', key: 'Actual', value: 180 },
	{ group: 'Electrical Sub', key: 'Planned', value: 150 },
	{ group: 'Electrical Sub', key: 'Actual', value: 165 },
	{ group: 'Plumbing Sub', key: 'Planned', value: 120 },
	{ group: 'Plumbing Sub', key: 'Actual', value: 110 },
    { group: 'Drywall Sub', key: 'Planned', value: 250 },
	{ group: 'Drywall Sub', key: 'Actual', value: 260 },
];

export const DASHBOARD_WEEKLY_COMPLETION_DATA = [
	{ group: 'Tasks Completed', date: '2024-07-01T00:00:00.000Z', value: 5 },
	{ group: 'Tasks Completed', date: '2024-07-08T00:00:00.000Z', value: 7 },
	{ group: 'Tasks Completed', date: '2024-07-15T00:00:00.000Z', value: 6 },
	{ group: 'Tasks Completed', date: '2024-07-22T00:00:00.000Z', value: 9 },
    { group: 'Tasks Completed', date: '2024-07-29T00:00:00.000Z', value: 8 },
];

export const DASHBOARD_CONSTRAINT_DATA = [
	{ group: 'Material Delivery', value: 8 },
	{ group: 'RFI Overdue', value: 5 },
	{ group: 'Submittal Approval', value: 3 },
	{ group: 'Predecessor Delay', value: 6 },
    { group: 'Site Access', value: 2 },
];

export const DASHBOARD_EVM_DATA = [
	{ group: 'Planned Value', date: '2024-01-01', value: 100000 },
	{ group: 'Planned Value', date: '2024-02-01', value: 250000 },
	{ group: 'Planned Value', date: '2024-03-01', value: 450000 },
	{ group: 'Planned Value', date: '2024-04-01', value: 600000 },
	{ group: 'Planned Value', date: '2024-05-01', value: 850000 },
    
    { group: 'Earned Value', date: '2024-01-01', value: 95000 },
	{ group: 'Earned Value', date: '2024-02-01', value: 230000 },
	{ group: 'Earned Value', date: '2024-03-01', value: 410000 },
	{ group: 'Earned Value', date: '2024-04-01', value: 550000 },
	{ group: 'Earned Value', date: '2024-05-01', value: 780000 },

    { group: 'Actual Cost', date: '2024-01-01', value: 98000 },
	{ group: 'Actual Cost', date: '2024-02-01', value: 245000 },
	{ group: 'Actual Cost', date: '2024-03-01', value: 460000 },
	{ group: 'Actual Cost', date: '2024-02-01', value: 620000 },
	{ group: 'Actual Cost', date: '2024-05-01', value: 890000 },
    
    { group: 'Monthly Spend', date: '2024-01-01', value: 98000 },
    { group: 'Monthly Spend', date: '2024-02-01', value: 147000 },
    { group: 'Monthly Spend', date: '2024-03-01', value: 215000 },
    { group: 'Monthly Spend', date: '2024-04-01', value: 160000 },
    { group: 'Monthly Spend', date: '2024-05-01', value: 270000 },
];

export const DASHBOARD_LABOR_EFFICIENCY_DATA = [
    { group: 'Concrete', hours: 450, complete: 85, cost: 50000 },
    { group: 'Steel', hours: 320, complete: 40, cost: 80000 },
    { group: 'Framing', hours: 800, complete: 60, cost: 60000 },
    { group: 'Electrical', hours: 200, complete: 20, cost: 25000 },
    { group: 'Plumbing', hours: 250, complete: 30, cost: 30000 },
    { group: 'HVAC', hours: 150, complete: 15, cost: 40000 },
    { group: 'Drywall', hours: 50, complete: 5, cost: 5000 },
];

export const DASHBOARD_SCHEDULE_VARIANCE_DATA = [
    { group: '> 2 Wks Early', value: 5 },
    { group: '1-2 Wks Early', value: 12 },
    { group: 'On Schedule', value: 45 },
    { group: '1-2 Wks Late', value: 18 },
    { group: '> 2 Wks Late', value: 8 },
];

export const DASHBOARD_CASH_FLOW_DATA = [
    { group: '03 Concrete', date: '2024-01-01', value: 50000 },
    { group: '03 Concrete', date: '2024-02-01', value: 80000 },
    { group: '03 Concrete', date: '2024-03-01', value: 90000 },
    
    { group: '05 Metals', date: '2024-01-01', value: 10000 },
    { group: '05 Metals', date: '2024-02-01', value: 40000 },
    { group: '05 Metals', date: '2024-03-01', value: 120000 },

    { group: '09 Finishes', date: '2024-01-01', value: 0 },
    { group: '09 Finishes', date: '2024-02-01', value: 15000 },
    { group: '09 Finishes', date: '2024-03-01', value: 45000 },
];

export const DASHBOARD_SAFETY_DATA = [
    { group: 'value', value: 0.8 }
];