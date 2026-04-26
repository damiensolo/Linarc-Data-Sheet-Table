import { V3Sheet, V3Template } from './types';

// ─── Blank Template ────────────────────────────────────────────────────────────
const blankSheet = (): V3Sheet => ({
  id: 'sheet-1',
  name: 'Sheet 1',
  columns: Array.from({ length: 26 }, (_, i) => {
    const label = String.fromCharCode(65 + i);
    return {
      id: label.toLowerCase(),
      label,
      type: 'text' as const,
      width: i === 0 ? 200 : 150,
      editable: true,
      visible: true,
    };
  }),
  rows: Array.from({ length: 100 }, (_, i) => ({
    id: `row-${i + 1}`,
    cells: {},
  })),
});

// ─── Budget Template ───────────────────────────────────────────────────────────
const budgetSheet = (): V3Sheet => ({
  id: 'sheet-budget',
  name: 'Budget',
  columns: [
    { id: 'name',          label: 'Contract Line',     type: 'text',     width: 220, editable: true,  visible: true },
    { id: 'costCode',      label: 'Cost Code',         type: 'text',     width: 100, editable: true,  visible: true },
    { id: 'quantity',      label: 'Qty',               type: 'number',   width: 70,  align: 'right',  editable: true, visible: true },
    { id: 'unit',          label: 'UOM',               type: 'text',     width: 60,  editable: true,  visible: true },
    { id: 'effortHours',   label: 'Hours',             type: 'number',   width: 80,  align: 'right',  editable: true, visible: true, isTotal: true },
    { id: 'labor',         label: 'Labor',             type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
    { id: 'material',      label: 'Material',          type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
    { id: 'equipment',     label: 'Equipment',         type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
    { id: 'subcontractor', label: 'Sub',               type: 'currency', width: 110, align: 'right',  editable: true, visible: true, isTotal: true },
    { id: 'others',        label: 'Others',            type: 'currency', width: 100, align: 'right',  editable: true, visible: true, isTotal: true },
    { id: 'totalBudget',   label: 'Total Budget',      type: 'formula',  width: 130, align: 'right',  editable: false, visible: true, isTotal: true,
      formula: '=labor+material+equipment+subcontractor+others' },
  ],
  rows: [
    { id: 'r1', isGroup: true, isExpanded: true, cells: { name: 'Phase 1 – Site Preparation' }, children: [
      { id: 'r1-1', cells: { name: 'Site Survey & Layout',       costCode: '02-100', quantity: 1,   unit: 'LS',  effortHours: 40,  labor: 4000,  material: 500,   equipment: 1000, subcontractor: 0,    others: 200 } },
      { id: 'r1-2', cells: { name: 'Clearing & Grubbing',        costCode: '02-110', quantity: 5,   unit: 'AC',  effortHours: 80,  labor: 8000,  material: 0,     equipment: 5000, subcontractor: 0,    others: 500 } },
      { id: 'r1-3', cells: { name: 'Bulk Excavation',            costCode: '02-200', quantity: 200, unit: 'CY',  effortHours: 120, labor: 12000, material: 0,     equipment: 8000, subcontractor: 0,    others: 1000 } },
    ]},
    { id: 'r2', isGroup: true, isExpanded: true, cells: { name: 'Phase 2 – Foundations' }, children: [
      { id: 'r2-1', cells: { name: 'Formwork Installation',      costCode: '03-100', quantity: 400, unit: 'SF',  effortHours: 120, labor: 10000, material: 2000,  equipment: 1000, subcontractor: 0,    others: 500 } },
      { id: 'r2-2', cells: { name: 'Rebar Placement',            costCode: '03-200', quantity: 2,   unit: 'TON', effortHours: 80,  labor: 8000,  material: 5000,  equipment: 500,  subcontractor: 0,    others: 0 } },
      { id: 'r2-3', cells: { name: 'Concrete Pour & Finish',     costCode: '03-300', quantity: 80,  unit: 'CY',  effortHours: 120, labor: 10000, material: 12000, equipment: 2000, subcontractor: 0,    others: 500 } },
    ]},
    { id: 'r3', isGroup: true, isExpanded: false, cells: { name: 'Phase 3 – Superstructure' }, children: [
      { id: 'r3-1', cells: { name: 'Structural Steel Erection',  costCode: '05-100', quantity: 50,  unit: 'TON', effortHours: 200, labor: 20000, material: 60000, equipment: 15000, subcontractor: 5000, others: 1000 } },
      { id: 'r3-2', cells: { name: 'Metal Deck Installation',    costCode: '05-200', quantity: 5000,unit: 'SF',  effortHours: 160, labor: 16000, material: 20000, equipment: 5000,  subcontractor: 0,    others: 500 } },
    ]},
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `blank-${i}`,
      cells: {} as Record<string, import('./types').CellValue>,
    })),
  ],
});

// ─── Schedule Template ─────────────────────────────────────────────────────────
const scheduleSheet = (): V3Sheet => ({
  id: 'sheet-schedule',
  name: 'Schedule',
  columns: [
    { id: 'name',       label: 'Task Name',     type: 'text',     width: 240, editable: true, visible: true },
    { id: 'wbs',        label: 'WBS',           type: 'text',     width: 80,  editable: true, visible: true },
    { id: 'status',     label: 'Status',        type: 'select',   width: 120, editable: true, visible: true,
      options: ['Not Started', 'In Progress', 'In Review', 'Completed', 'Blocked'] },
    { id: 'progress',   label: 'Progress %',   type: 'number',   width: 100, align: 'right', editable: true, visible: true },
    { id: 'startDate',  label: 'Start Date',    type: 'date',     width: 120, editable: true, visible: true },
    { id: 'endDate',    label: 'End Date',      type: 'date',     width: 120, editable: true, visible: true },
    { id: 'priority',   label: 'Priority',      type: 'select',   width: 100, editable: true, visible: true,
      options: ['Urgent', 'High', 'Medium', 'Low'] },
    { id: 'assignee',   label: 'Assignee',      type: 'text',     width: 140, editable: true, visible: true },
    { id: 'notes',      label: 'Notes',         type: 'text',     width: 200, editable: true, visible: true },
  ],
  rows: [
    { id: 'sr1', isGroup: true, isExpanded: true, cells: { wbs: '1', name: 'Phase 1 – Site Preparation' }, children: [
      { id: 'sr1-1', cells: { wbs: '1.1', name: 'Site Survey',          assignee: 'Surveyor John',  status: 'Completed',   startDate: '2024-11-01', endDate: '2024-11-03', duration: 3,  progress: 100, priority: 'High'   } },
      { id: 'sr1-2', cells: { wbs: '1.2', name: 'Clearing & Grubbing',  assignee: 'Operator Mike',  status: 'Completed',   startDate: '2024-11-04', endDate: '2024-11-08', duration: 5,  progress: 100, priority: 'High'   } },
      { id: 'sr1-3', cells: { wbs: '1.3', name: 'Bulk Excavation',      assignee: 'Operator Mike',  status: 'In Progress', startDate: '2024-11-09', endDate: '2024-11-20', duration: 12, progress: 30,  priority: 'Urgent' } },
    ]},
    { id: 'sr2', isGroup: true, isExpanded: true, cells: { wbs: '2', name: 'Phase 2 – Foundations' }, children: [
      { id: 'sr2-1', cells: { wbs: '2.1', name: 'Rebar Fabrication',    assignee: 'Steel Fab',      status: 'In Progress', startDate: '2024-11-10', endDate: '2024-11-25', duration: 16, progress: 60,  priority: 'Medium' } },
      { id: 'sr2-2', cells: { wbs: '2.2', name: 'Footing Reinforcement',assignee: 'Concrete Sub',   status: 'Not Started', startDate: '2024-11-21', endDate: '2024-11-28', duration: 8,  progress: 0,   priority: 'High'   } },
      { id: 'sr2-3', cells: { wbs: '2.3', name: 'Concrete Pour',        assignee: 'Concrete Sub',   status: 'Not Started', startDate: '2024-12-01', endDate: '2024-12-05', duration: 5,  progress: 0,   priority: 'Urgent' } },
    ]},
    { id: 'sr3', isGroup: true, isExpanded: false, cells: { wbs: '3', name: 'Phase 3 – Superstructure' }, children: [
      { id: 'sr3-1', cells: { wbs: '3.1', name: 'Steel Erection',       assignee: 'Crane Ops',      status: 'Not Started', startDate: '2024-12-16', endDate: '2024-12-30', duration: 15, progress: 0,   priority: 'High'   } },
    ]},
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `sblank-${i}`,
      cells: {} as Record<string, import('./types').CellValue>,
    })),
  ],
});

// ─── Public factory ────────────────────────────────────────────────────────────
export function createTemplateSheets(template: V3Template): V3Sheet[] {
  switch (template) {
    case 'budget':   return [budgetSheet()];
    case 'schedule': return [scheduleSheet()];
    case 'blank':
    default:
      return [blankSheet()];
  }
}
