import { LookaheadTask, ConstraintType, ConstraintStatus, WeatherForecast } from './types';

export const PPC_DATA = [82, 85, 78, 88, 92, 90]; // Last 6 weeks

export const MOCK_WEATHER: WeatherForecast[] = [
    { date: '2024-11-17', icon: 'sun', temp: 65 },
    { date: '2024-11-18', icon: 'sun', temp: 68 },
    { date: '2024-11-19', icon: 'cloud', temp: 66 },
    { date: '2024-11-20', icon: 'cloud', temp: 64 },
    { date: '2024-11-21', icon: 'rain', temp: 60 },
    { date: '2024-11-22', icon: 'rain', temp: 58 },
    { date: '2024-11-23', icon: 'cloud', temp: 62 },
    { date: '2024-11-24', icon: 'sun', temp: 67 },
    { date: '2024-11-25', icon: 'sun', temp: 70 },
    { date: '2024-11-26', icon: 'sun', temp: 71 },
    { date: '2024-11-27', icon: 'cloud', temp: 69 },
    { date: '2024-11-28', icon: 'cloud', temp: 68 },
    { date: '2024-11-29', icon: 'rain', temp: 65 },
    { date: '2024-11-30', icon: 'sun', temp: 69 },
];


export const PLANNER_TASKS: LookaheadTask[] = [
  {
    id: 1,
    name: 'Exterior & Site Work',
    resource: 'GC',
    startDate: '2024-11-17',
    finishDate: '2024-12-05',
    isExpanded: true,
    ppcHistory: [82, 85, 78, 88, 92, 90],
    status: {
      [ConstraintType.Predecessor]: ConstraintStatus.Complete,
      [ConstraintType.RFI]: ConstraintStatus.Complete,
      [ConstraintType.Submittal]: ConstraintStatus.Complete,
      [ConstraintType.Material]: ConstraintStatus.OnSite,
    },
    constraints: [],
    manHours: { actual: 120, budget: 200 },
    children: [
        {
            id: 1.1,
            name: 'Install 2nd Floor Windows',
            resource: 'Window Sub',
            startDate: '2024-11-17',
            finishDate: '2024-11-20',
            isCriticalPath: true,
            status: {
              [ConstraintType.Predecessor]: ConstraintStatus.Complete,
              [ConstraintType.RFI]: ConstraintStatus.Overdue,
              [ConstraintType.Submittal]: ConstraintStatus.Pending,
              [ConstraintType.Material]: ConstraintStatus.OnSite,
            },
            constraints: [
              { type: ConstraintType.Predecessor, name: 'Exterior Sheathing', status: ConstraintStatus.Complete, severity: 'Warning' },
              { type: ConstraintType.RFI, name: 'RFI-045: "Header Detail"', status: ConstraintStatus.Overdue, link: '#', severity: 'Blocking' },
              { type: ConstraintType.Submittal, name: 'SUB-10A: "Window Spec"', status: ConstraintStatus.Pending, link: '#', severity: 'Warning' },
              { type: ConstraintType.Material, name: 'Windows', status: ConstraintStatus.OnSite, severity: 'Warning' },
            ],
            manHours: { actual: 30, budget: 80 },
            dailyMetrics: [
                {
                    date: '2024-11-17',
                    quantity: { plan: 10, actual: 8, unit: 'windows' }, // less
                    hours: { plan: 8, actual: 8 }, // same
                    crew: { plan: 2, actual: 2 }, // same
                },
                {
                    date: '2024-11-18',
                    quantity: { plan: 10, actual: 12, unit: 'windows' }, // more
                    hours: { plan: 8, actual: 9 }, // more
                    crew: { plan: 2, actual: 3 }, // more
                },
                {
                    date: '2024-11-19',
                    quantity: { plan: 10, actual: 10, unit: 'windows' }, // same
                    hours: { plan: 8, actual: 7 }, // less
                    crew: { plan: 2, actual: 2 }, // same
                },
            ]
        },
    ]
  },
  {
    id: 2,
    name: 'Interior Finishes - Area A',
    resource: 'GC',
    startDate: '2024-11-17',
    finishDate: '2024-11-23',
    isExpanded: true,
    ppcHistory: [82, 85, 78, 88, 92, 90],
    status: {
      [ConstraintType.Predecessor]: ConstraintStatus.Overdue,
      [ConstraintType.RFI]: ConstraintStatus.Complete,
      [ConstraintType.Submittal]: ConstraintStatus.Complete,
      [ConstraintType.Material]: ConstraintStatus.Pending,
    },
    constraints: [],
    manHours: { actual: 155, budget: 200 },
    children: [
        {
            id: 2.1,
            name: 'Interior Framing',
            resource: 'Framing Sub',
            startDate: '2024-11-17',
            finishDate: '2024-11-22',
            status: {
              [ConstraintType.Predecessor]: ConstraintStatus.Complete,
              [ConstraintType.RFI]: ConstraintStatus.Complete,
              [ConstraintType.Submittal]: ConstraintStatus.Complete,
              [ConstraintType.Material]: ConstraintStatus.Pending,
            },
            constraints: [
              { type: ConstraintType.Material, name: 'Steel Studs (Delivery ETA: 11/19)', status: ConstraintStatus.Pending, severity: 'Warning' },
            ],
            manHours: { actual: 65, budget: 120 },
          },
          {
            id: 2.2,
            name: 'Run Electrical',
            resource: 'Elec. Sub',
            startDate: '2024-11-18',
            finishDate: '2024-11-23',
            isCriticalPath: true,
            status: {
              [ConstraintType.Predecessor]: ConstraintStatus.Overdue,
              [ConstraintType.RFI]: ConstraintStatus.Complete,
              [ConstraintType.Submittal]: ConstraintStatus.Complete,
              [ConstraintType.Material]: ConstraintStatus.OnSite,
            },
            constraints: [
              { type: ConstraintType.Predecessor, name: 'Interior Framing - Area A', status: ConstraintStatus.Overdue, severity: 'Blocking' },
            ],
            manHours: { actual: 90, budget: 80 }, // Over budget
          },
    ]
  },
  {
    id: 3,
    name: 'Core & Shell',
    resource: 'GC',
    startDate: '2024-11-19',
    finishDate: '2024-11-25',
    isExpanded: false,
    ppcHistory: [82, 85, 78, 88, 92, 90],
    status: {
      [ConstraintType.Predecessor]: ConstraintStatus.Complete,
      [ConstraintType.RFI]: ConstraintStatus.Complete,
      [ConstraintType.Submittal]: ConstraintStatus.Complete,
      [ConstraintType.Material]: ConstraintStatus.OnSite,
    },
    constraints: [],
    manHours: { actual: 10, budget: 100 },
    children: [
        {
            id: 3.1,
            name: 'Core Bath Rough-in',
            resource: 'Plumbing Sub',
            startDate: '2024-11-19',
            finishDate: '2024-11-25',
            status: {
              [ConstraintType.Predecessor]: ConstraintStatus.Complete,
              [ConstraintType.RFI]: ConstraintStatus.Complete,
              [ConstraintType.Submittal]: ConstraintStatus.Complete,
              [ConstraintType.Material]: ConstraintStatus.OnSite,
            },
            constraints: [],
            manHours: { actual: 10, budget: 100 },
          },
    ]
  },
];