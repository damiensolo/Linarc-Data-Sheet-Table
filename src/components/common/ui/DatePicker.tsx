
import React, { useState, useEffect, useRef } from 'react';
import { format, isValid } from 'date-fns';
import { cn } from '../../../lib/utils';
import { Calendar } from './Calendar';
import { Popover } from './Popover';
import { ChevronDownIcon } from '../Icons';

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ date, setDate, className, open, onOpenChange }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = open !== undefined ? open : internalOpen;

    // Focus the calendar when it opens
    useEffect(() => {
        if (isOpen) {
            // Small timeout to ensure portal is rendered
            const timer = setTimeout(() => {
                const el = document.querySelector('[data-calendar-container="true"]') as HTMLElement;
                if (el) el.focus();
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <Popover
            open={isOpen}
            onOpenChange={onOpenChange || setInternalOpen}
            trigger={
                <button
                    type="button"
                    className={cn(
                        "flex w-full h-full items-center justify-between text-left bg-transparent p-0 group focus:outline-none transition-colors",
                        !date && "text-slate-500 italic",
                        isOpen && "bg-blue-50/50",
                        className
                    )}
                >
                    <span className="truncate flex-1 text-left px-2">{date && isValid(date) ? format(date, "M/d/yyyy") : "Pick a date"}</span>
                    <ChevronDownIcon className={cn(
                        "w-4 h-4 text-gray-400 transition-all duration-200 mr-2 flex-shrink-0",
                        isOpen ? "opacity-100 rotate-180" : "opacity-0 group-hover:opacity-100"
                    )} />
                </button>
            }
            content={
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        setDate(d);
                        if (onOpenChange) onOpenChange(false);
                        else setInternalOpen(false);
                    }}
                    className="rounded-md"
                />
            }
        />
    );
};
