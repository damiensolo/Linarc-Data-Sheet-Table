
import React from 'react';
import { 
    DonutChart, 
    GroupedBarChart, 
    LineChart, 
    SimpleBarChart,
    ComboChart, 
    BubbleChart, 
    StackedAreaChart, 
    GaugeChart 
} from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts/interfaces';
import {
    DASHBOARD_TASK_STATUS_DATA,
    DASHBOARD_PRODUCTIVITY_DATA,
    DASHBOARD_WEEKLY_COMPLETION_DATA,
    DASHBOARD_CONSTRAINT_DATA,
    DASHBOARD_EVM_DATA,
    DASHBOARD_LABOR_EFFICIENCY_DATA,
    DASHBOARD_SCHEDULE_VARIANCE_DATA,
    DASHBOARD_CASH_FLOW_DATA,
    DASHBOARD_SAFETY_DATA
} from '../../../data';
import ViewControls from '../../layout/ViewControls';
import { Card, CardContent } from '../../common/ui/Card';

// --- Theme & Palette Constants (Carbon Design System & Custom) ---
const THEME = 'white';

// Categorical Palette (Distinct)
const PALETTE_CATEGORICAL = [
    '#6929c4', // Purple
    '#1192e8', // Cyan
    '#005d5d', // Teal
    '#9f1853', // Magenta
    '#fa4d56', // Red
    '#570408', // Dark Red
    '#198038', // Green
];

// Divergent Palette (Schedule Variance)
const PALETTE_DIVERGENT = [
    '#24a148', // Green (Early)
    '#42be65', // Light Green
    '#e0e0e0', // Gray (On Time)
    '#f1c21b', // Yellow (Minor Delay)
    '#da1e28', // Red (Late)
];

// Sequential Palette (Cash Flow - Cool Tones)
const PALETTE_SEQUENTIAL = [
    '#a6c8ff', 
    '#4589ff', 
    '#0f62fe', 
    '#0043ce', 
    '#002d9c'
];

const commonOptions = {
    resizable: true,
    toolbar: { enabled: true },
    legend: { alignment: 'center' },
    theme: THEME,
};

// --- Basic Charts (Row 1) ---
const TaskStatusChart = () => {
    const options = {
        ...commonOptions,
        title: 'Task Status',
        donut: { 
            center: { 
                label: 'Tasks' 
            },
            alignment: 'center'
        },
        height: '300px',
        legend: {
            position: 'bottom',
            alignment: 'center',
            clickable: true
        },
        color: {
            scale: {
                'Completed': '#6929c4', // Purple
                'In Progress': '#1192e8', // Blue
                'Planned': '#005d5d', // Teal
                'In Review': '#9f1853', // Magenta
                'New': '#570408'  // Dark Red
            }
        }
    };
    return <DonutChart data={DASHBOARD_TASK_STATUS_DATA} options={options} />;
};

const ProductivityChart = () => {
    const options = {
        ...commonOptions,
        title: 'Productivity (Man-Hours)',
        axes: {
            left: { title: 'Hours', mapsTo: 'value' },
            bottom: { title: 'Subcontractor', mapsTo: 'group', scaleType: ScaleTypes.LABELS },
        },
        height: '300px',
    };
    return <GroupedBarChart data={DASHBOARD_PRODUCTIVITY_DATA} options={options} />;
};

const WeeklyCompletionChart = () => {
    const options = {
        ...commonOptions,
        title: 'Weekly Task Completion',
        axes: {
            left: { title: 'Count', mapsTo: 'value' },
            bottom: { title: 'Week', mapsTo: 'date', scaleType: ScaleTypes.TIME },
        },
        curve: 'curveMonotoneX',
        height: '300px',
    };
    return <LineChart data={DASHBOARD_WEEKLY_COMPLETION_DATA} options={options} />;
};

const ConstraintChart = () => {
    const options = {
        ...commonOptions,
        title: 'Constraint Analysis',
        axes: {
            left: { title: 'Count', mapsTo: 'value' },
            bottom: { title: 'Type', mapsTo: 'group', scaleType: ScaleTypes.LABELS },
        },
        height: '300px',
        color: { scale: { 'Material Delivery': '#fa4d56', 'RFI Overdue': '#ff832b', 'Submittal Approval': '#f1c21b' } }
    };
    return <SimpleBarChart data={DASHBOARD_CONSTRAINT_DATA} options={options} />;
};

// --- Advanced Charts (Rows 2+) ---

// 1. Earned Value Management (Combo Chart)
const EVMChart = () => {
    const options = {
        ...commonOptions,
        title: 'Earned Value Analysis',
        axes: {
            left: { mapsTo: 'value', title: 'Currency ($)', scaleType: ScaleTypes.LINEAR },
            bottom: { mapsTo: 'date', scaleType: ScaleTypes.TIME },
        },
        comboChartTypes: [
            { type: 'line', correspondingDatasets: ['Planned Value', 'Earned Value', 'Actual Cost'] },
            { type: 'simple-bar', correspondingDatasets: ['Monthly Spend'] }
        ],
        color: {
            scale: {
                'Planned Value': '#0f62fe', // Blue
                'Earned Value': '#24a148',  // Green (Good)
                'Actual Cost': '#da1e28',   // Red (Costly)
                'Monthly Spend': '#e0e0e0'  // Gray bars background
            }
        },
        height: '350px',
        curve: 'curveMonotoneX',
    };
    return <ComboChart data={DASHBOARD_EVM_DATA} options={options} />;
};

// 2. Labor Efficiency (Bubble Chart)
const LaborChart = () => {
    const options = {
        ...commonOptions,
        title: 'Labor Efficiency Matrix',
        axes: {
            bottom: { title: 'Hours Worked', mapsTo: 'hours', includeZero: false },
            left: { title: '% Complete', mapsTo: 'complete', includeZero: true, max: 100 },
        },
        bubble: {
            radiusMapsTo: 'cost',
            radiusLabel: 'Cost Impact',
        },
        color: {
            scale: Object.fromEntries(DASHBOARD_LABOR_EFFICIENCY_DATA.map((d, i) => [d.group, PALETTE_CATEGORICAL[i % PALETTE_CATEGORICAL.length]]))
        },
        height: '350px',
    };
    return <BubbleChart data={DASHBOARD_LABOR_EFFICIENCY_DATA} options={options} />;
};

// 3. Schedule Variance (Histogram style Grouped Bar)
const ScheduleVarianceChart = () => {
    const options = {
        ...commonOptions,
        title: 'Schedule Variance Distribution',
        axes: {
            left: { mapsTo: 'value', title: 'Task Count' },
            bottom: { mapsTo: 'group', scaleType: ScaleTypes.LABELS, title: 'Variance Category' },
        },
        color: {
            scale: {
                '> 2 Wks Early': '#24a148',
                '1-2 Wks Early': '#42be65',
                'On Schedule': '#c6c6c6',
                '1-2 Wks Late': '#f1c21b',
                '> 2 Wks Late': '#da1e28',
            }
        },
        height: '300px',
    };
    return <GroupedBarChart data={DASHBOARD_SCHEDULE_VARIANCE_DATA} options={options} />;
};

// 4. Cash Flow (Stacked Area)
const CashFlowChart = () => {
    const options = {
        ...commonOptions,
        title: 'Cumulative Cash Flow by Division',
        axes: {
            left: { mapsTo: 'value', title: 'Cumulative Spend ($)', stacked: true },
            bottom: { mapsTo: 'date', scaleType: ScaleTypes.TIME },
        },
        color: {
            scale: {
                '03 Concrete': PALETTE_SEQUENTIAL[1],
                '05 Metals': PALETTE_SEQUENTIAL[2],
                '09 Finishes': PALETTE_SEQUENTIAL[3],
            }
        },
        height: '300px',
        curve: 'curveMonotoneX',
    };
    return <StackedAreaChart data={DASHBOARD_CASH_FLOW_DATA} options={options} />;
};

// 5. Safety Gauge
const SafetyChart = () => {
    const options = {
        ...commonOptions,
        title: 'Site Safety (TRIR)',
        gauge: {
            type: 'semi',
            status: 'danger', // This would ideally be dynamic based on value
            alignment: 'center'
        },
        color: {
            scale: {
                'value': '#da1e28' // Color of the needle/fill
            }
        },
        height: '300px',
    };
    return <GaugeChart data={DASHBOARD_SAFETY_DATA} options={options} />;
};


const DashboardView: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 flex-shrink-0">
                <ViewControls />
            </div>
            
            <div className="flex-grow overflow-y-auto px-4 pb-8">
                {/* Section 1: Standard Overview - 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Task Status - Reverted to standard Card styles */}
                    <Card className="shadow-sm border-gray-200 h-full">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8">
                            <TaskStatusChart />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200 h-full">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8"><ProductivityChart /></CardContent>
                    </Card>
                    <Card className="shadow-sm border-gray-200 h-full">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8"><WeeklyCompletionChart /></CardContent>
                    </Card>
                    <Card className="shadow-sm border-gray-200 h-full">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8"><ConstraintChart /></CardContent>
                    </Card>
                </div>

                {/* Section 2: Advanced Analytics */}
                <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1 flex items-center gap-2">
                    Advanced Analytics 
                    <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Executive View</span>
                </h2>
                
                {/* Row 2: Executive Summary (Financials & Safety) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-200">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8">
                            <EVMChart />
                            <p className="mt-2 text-sm text-gray-500">Project performance against budget (Cost) and schedule (Time). AC vs EV vs PV.</p>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 shadow-sm border-gray-200">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8">
                            <SafetyChart />
                            <div className="mt-2 text-center">
                                <p className="text-sm text-gray-500">Industry Avg: 3.0</p>
                                <p className="text-xs text-gray-400">Total Recordable Incident Rate (Lower is better)</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Row 3: Schedule & Cash Flow */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8">
                            <ScheduleVarianceChart />
                            <p className="mt-2 text-sm text-gray-500">Distribution of task variance. Skewness right indicates delay risk.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8">
                            <CashFlowChart />
                            <p className="mt-2 text-sm text-gray-500">Cumulative spend stack by CSI Division.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Row 4: Labor/Resource Analytics */}
                <div className="grid grid-cols-1 gap-6">
                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="pl-8 pr-6 pt-6 pb-8">
                            <LaborChart />
                            <div className="mt-2 text-sm text-gray-500">
                                <strong>X-Axis:</strong> Hours Burned | <strong>Y-Axis:</strong> % Complete | <strong>Size:</strong> Cost Impact. 
                                <span className="ml-2 text-gray-400 italic">Target: Top-Left quadrant (High completion, Low hours).</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
