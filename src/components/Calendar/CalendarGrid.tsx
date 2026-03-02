import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { Plus } from 'lucide-react';
import type { CalendarEvent } from '@/stores/calendarStore';

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onAddEvent: (date: Date) => void;
}

const TYPE_COLORS: Record<string, string> = {
  manual: '#6366f1',
  task: '#3b82f6',
  trigger: '#f59e0b',
  appointment: '#22c55e',
};

export function CalendarGrid({
  currentDate,
  events,
  selectedDate,
  onSelectDate,
  onAddEvent,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const today = new Date();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build array of weeks
  const weeks: Date[][] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const getEventsForDay = (d: Date): CalendarEvent[] => {
    return events.filter((event) => {
      try {
        return isSameDay(parseISO(event.start_at), d);
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#2a2a4a]">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center text-sm font-medium text-gray-500 py-3"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7">
          {week.map((d) => {
            const dayEvents = getEventsForDay(d);
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isToday = isSameDay(d, today);
            const isSelected = selectedDate && isSameDay(d, selectedDate);

            return (
              <div
                key={d.toISOString()}
                onClick={() => onSelectDate(d)}
                className={`min-h-28 p-2 border border-[#1a1a3a] cursor-pointer transition group relative ${
                  !isCurrentMonth
                    ? 'bg-[#0a0a1a]/50 text-gray-600'
                    : 'bg-[#12122a] hover:bg-[#1a1a3a]/50'
                } ${isToday ? 'bg-indigo-600/10 border-indigo-500/50' : ''} ${
                  isSelected ? 'ring-1 ring-indigo-500/70' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                        : isCurrentMonth
                        ? 'text-gray-300'
                        : 'text-gray-600'
                    }`}
                  >
                    {format(d, 'd')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEvent(d);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-indigo-500/20 rounded text-gray-500 hover:text-indigo-400 transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const eventColor = event.color || TYPE_COLORS[event.type] || '#6366f1';
                    return (
                      <div
                        key={event.id}
                        className="text-xs px-2 py-0.5 rounded truncate"
                        style={{
                          backgroundColor: eventColor + '25',
                          color: eventColor,
                        }}
                        title={event.title}
                      >
                        {!event.all_day && (
                          <span className="opacity-70 mr-1">
                            {format(parseISO(event.start_at), 'h:mma').toLowerCase()}
                          </span>
                        )}
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
