import React, { useState, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  setMonth,
  setYear,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isValid,
  getMonth,
  getYear,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';
import { cn } from '../../../lib/utils';

interface CalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  /** Earliest year in the year dropdown. Defaults to current year - 10. */
  fromYear?: number;
  /** Latest year in the year dropdown. Defaults to current year + 10. */
  toYear?: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  className,
  fromYear,
  toYear,
}) => {
  const currentYear = getYear(new Date());
  const yearFrom = fromYear ?? currentYear - 10;
  const yearTo = toYear ?? currentYear + 10;
  const years = Array.from({ length: yearTo - yearFrom + 1 }, (_, i) => yearFrom + i);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (selected && isValid(selected)) return startOfMonth(selected);
    return startOfMonth(new Date());
  });

  const [focusedDate, setFocusedDate] = useState<Date>(() => {
    if (selected && isValid(selected)) return selected;
    return new Date();
  });

  // Sync when selected changes externally
  useEffect(() => {
    if (selected && isValid(selected)) {
      setFocusedDate(selected);
      setCurrentMonth(startOfMonth(selected));
    }
  }, [selected]);

  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart)),
  });

  // ── Keyboard navigation ────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let next: Date | null = null;
    switch (e.key) {
      case 'ArrowLeft':  next = subDays(focusedDate, 1); break;
      case 'ArrowRight': next = addDays(focusedDate, 1); break;
      case 'ArrowUp':    next = subDays(focusedDate, 7); break;
      case 'ArrowDown':  next = addDays(focusedDate, 7); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSelect) onSelect(focusedDate);
        return;
      case 'Escape':
        e.preventDefault();
        return;
    }
    if (next && isValid(next)) {
      e.preventDefault();
      setFocusedDate(next);
      if (!isSameMonth(next, currentMonth)) {
        setCurrentMonth(startOfMonth(next));
      }
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(setMonth(currentMonth, parseInt(e.target.value, 10)));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(setYear(currentMonth, parseInt(e.target.value, 10)));
  };

  return (
    <div
      className={cn(
        'p-3 bg-white rounded-md border border-slate-200 shadow-xl outline-none select-none w-[268px]',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-calendar-container="true"
    >
      {/* ── Caption / Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1 pb-3">
        {/* Prev month */}
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* Month + Year dropdowns */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          <select
            value={getMonth(currentMonth)}
            onChange={handleMonthChange}
            onClick={(e) => e.stopPropagation()}
            className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-800 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       hover:border-slate-300 transition-colors cursor-pointer appearance-none
                       pr-5 bg-no-repeat bg-right"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundPosition: 'right 4px center',
            }}
          >
            {MONTHS.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>

          <select
            value={getYear(currentMonth)}
            onChange={handleYearChange}
            onClick={(e) => e.stopPropagation()}
            className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-800 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       hover:border-slate-300 transition-colors cursor-pointer appearance-none
                       pr-5 bg-no-repeat bg-right"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundPosition: 'right 4px center',
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Next month */}
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ── Day-of-week headers ──────────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div
            key={d}
            className="h-8 flex items-center justify-center text-[11px] font-medium text-slate-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, idx) => {
          const sel = selected && isValid(selected) && isSameDay(day, selected);
          const focused = isSameDay(day, focusedDate);
          const current = isSameMonth(day, monthStart);
          const today = isToday(day);

          return (
            <button
              key={idx}
              type="button"
              tabIndex={-1}
              onClick={() => {
                setFocusedDate(day);
                if (onSelect) onSelect(day);
              }}
              className={cn(
                'h-8 w-8 mx-auto flex items-center justify-center rounded-md text-xs font-normal transition-all relative',
                // Outside current month
                !current && 'text-slate-300 hover:bg-slate-50',
                // Inside current month (default)
                current && !sel && !today && 'text-slate-700 hover:bg-slate-100',
                // Today highlight
                today && !sel && 'bg-slate-100 font-semibold text-slate-900',
                // Keyboard focus ring
                focused && !sel && 'ring-2 ring-blue-500 ring-offset-1',
                // Selected day
                sel && 'bg-slate-900 text-white font-medium hover:bg-slate-800 shadow-sm',
              )}
            >
              {format(day, 'd')}
              {/* Today dot */}
              {today && (
                <span
                  className={cn(
                    'absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    sel ? 'bg-white' : 'bg-blue-500'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};