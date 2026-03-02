import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Tag } from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarEvent, CalendarEventInput } from '@/stores/calendarStore';
import { CalendarGrid } from '@/components/Calendar/CalendarGrid';
import { EventFormDialog } from '@/components/Calendar/EventFormDialog';

const TYPE_COLORS: Record<string, string> = {
  manual: '#6366f1',
  task: '#3b82f6',
  trigger: '#f59e0b',
  appointment: '#22c55e',
};

const TYPE_LABELS: Record<string, string> = {
  manual: 'Manual',
  task: 'Task',
  trigger: 'Trigger',
  appointment: 'Appointment',
};

export function CalendarPage() {
  const { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent } =
    useCalendarStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [addForDate, setAddForDate] = useState<Date | null>(null);

  // Fetch events for the visible range (current month expanded to full weeks)
  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const rangeStart = startOfWeek(monthStart).toISOString();
    const rangeEnd = endOfWeek(monthEnd).toISOString();
    fetchEvents(rangeStart, rangeEnd);
  }, [currentDate]);

  // Events for the selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) {return [];}
    return events.filter((e) => {
      try {
        return isSameDay(parseISO(e.start_at), selectedDate);
      } catch {
        return false;
      }
    });
  }, [events, selectedDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = (date: Date) => {
    setEditingEvent(null);
    setAddForDate(date);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setAddForDate(null);
    setIsFormOpen(true);
  };

  const handleSaveEvent = async (data: CalendarEventInput) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await createEvent(data);
    }
  };

  const handleDeleteEvent = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent.id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
    setAddForDate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-gray-400 mt-1">{format(currentDate, 'MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-[#1a1a3a] rounded-lg transition text-gray-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium hover:bg-[#1a1a3a] rounded-lg transition text-gray-400 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-[#1a1a3a] rounded-lg transition text-gray-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => handleAddEvent(selectedDate || new Date())}
            className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </div>

      {/* Main content: grid + side panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onAddEvent={handleAddEvent}
            />
          )}
        </div>

        {/* Selected day side panel */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="glass rounded-xl p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a day'}
              </h2>
              {selectedDate && (
                <button
                  onClick={() => handleAddEvent(selectedDate)}
                  className="p-1 hover:bg-indigo-500/20 rounded text-gray-400 hover:text-indigo-400 transition"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No events</p>
                {selectedDate && (
                  <button
                    onClick={() => handleAddEvent(selectedDate)}
                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Add one
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => {
                  const eventColor = event.color || TYPE_COLORS[event.type] || '#6366f1';
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEditEvent(event)}
                      className="p-3 rounded-lg border border-[#2a2a4a] hover:border-indigo-500/50 cursor-pointer transition"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor: eventColor,
                      }}
                    >
                      <h3 className="text-sm font-medium text-white mb-1">
                        {event.title}
                      </h3>

                      {/* Time */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                        <Clock size={12} />
                        {event.all_day ? (
                          <span>All day</span>
                        ) : (
                          <span>
                            {format(parseISO(event.start_at), 'h:mm a')}
                            {event.end_at && ` - ${format(parseISO(event.end_at), 'h:mm a')}`}
                          </span>
                        )}
                      </div>

                      {/* Type badge */}
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <Tag size={12} className="text-gray-500" />
                        <span
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: eventColor + '20',
                            color: eventColor,
                          }}
                        >
                          {TYPE_LABELS[event.type] || event.type}
                        </span>
                      </div>

                      {/* Description preview */}
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Linked entity */}
                      {event.linked_entity_type && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin size={12} />
                          <span>
                            {event.linked_entity_type}
                            {event.linked_entity_id && `: ${event.linked_entity_id.slice(0, 8)}...`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event form dialog */}
      <EventFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveEvent}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
        event={editingEvent}
        defaultDate={addForDate}
      />
    </div>
  );
}
