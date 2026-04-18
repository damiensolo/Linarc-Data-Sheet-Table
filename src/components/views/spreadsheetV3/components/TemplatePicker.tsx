import React from 'react';
import { V3Template } from '../types';
import { SpreadsheetIcon, CalculatorIcon, GanttIcon } from '../../../common/Icons';

interface TemplatePickerModalProps {
  onSelect: (template: V3Template) => void;
}

const TEMPLATES: {
  id: V3Template;
  label: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  accent: string;
  preview: { cols: string[]; rows: string[][] };
}[] = [
  {
    id: 'blank',
    label: 'Blank',
    description: 'Start from scratch with an empty grid. Add any columns you need.',
    icon: SpreadsheetIcon,
    accent: 'from-slate-500 to-slate-700',
    preview: {
      cols: ['A', 'B', 'C', 'D'],
      rows: [['', '', '', ''], ['', '', '', ''], ['', '', '', '']],
    },
  },
  {
    id: 'budget',
    label: 'Budget',
    description: 'Pre-built with cost codes, quantities, labor, material, equipment and auto-calculated totals.',
    icon: CalculatorIcon,
    accent: 'from-blue-500 to-blue-700',
    preview: {
      cols: ['Contract Line', 'Cost Code', 'Labor', 'Material', 'Total'],
      rows: [
        ['Site Prep', '02-100', '4,000', '500', '=SUM'],
        ['Excavation', '02-200', '12,000', '—', '=SUM'],
        ['Foundations', '03-100', '10,000', '2,000', '=SUM'],
      ],
    },
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: 'Task tracking with start/end dates, assignees, status, priority and progress.',
    icon: GanttIcon,
    accent: 'from-emerald-500 to-emerald-700',
    preview: {
      cols: ['Task', 'Assignee', 'Status', 'Progress'],
      rows: [
        ['Site Survey', 'J. Smith', 'Done', '100%'],
        ['Excavation', 'M. Jones', 'Active', '30%'],
        ['Footings', 'Team A', 'Planned', '0%'],
      ],
    },
  },
];

const TemplatePicker: React.FC<TemplatePickerModalProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[860px] max-w-[95vw] overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">New Spreadsheet</h2>
          <p className="mt-1 text-sm text-gray-500">Choose a template to get started, or start from scratch.</p>
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-3 gap-5 p-8">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.id}
                onClick={() => onSelect(tpl.id)}
                className="group text-left rounded-xl border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {/* Mini preview grid */}
                <div className={`bg-gradient-to-br ${tpl.accent} p-4 relative overflow-hidden`}>
                  <div className="bg-white/10 rounded-lg overflow-hidden text-white">
                    {/* Col headers */}
                    <div className="flex border-b border-white/20">
                      {tpl.preview.cols.map((col, i) => (
                        <div key={i} className="flex-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider truncate border-r border-white/20 last:border-r-0">
                          {col}
                        </div>
                      ))}
                    </div>
                    {/* Rows */}
                    {tpl.preview.rows.map((row, ri) => (
                      <div key={ri} className="flex border-b border-white/10 last:border-b-0">
                        {row.map((cell, ci) => (
                          <div key={ci} className={`flex-1 px-2 py-1.5 text-[9px] truncate border-r border-white/10 last:border-r-0 ${cell.startsWith('=') ? 'text-yellow-300 font-semibold' : 'text-white/90'}`}>
                            {cell || <span className="text-white/20">—</span>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* Decorative icon */}
                  <div className="absolute -bottom-3 -right-3 opacity-20">
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 bg-white group-hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900 text-sm">{tpl.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tpl.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-400">You can add, remove or rename columns at any time after creating the spreadsheet.</p>
        </div>
      </div>
    </div>
  );
};

export default TemplatePicker;
