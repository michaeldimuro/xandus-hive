import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CalendarEvent, CalendarEventInput } from '@/stores/calendarStore';

const EVENT_TYPES: { value: CalendarEvent['type']; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'task', label: 'Task' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'appointment', label: 'Appointment' },
];

const PRESET_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22d3ee', label: 'Cyan' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
];

const ENTITY_TYPES = [
  { value: '', label: 'None' },
  { value: 'task', label: 'Task' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'lead', label: 'Lead' },
  { value: 'property', label: 'Property' },
  { value: 'note', label: 'Note' },
];

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CalendarEventInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
}

function toLocalDatetimeString(dateStr: string): string {
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toLocalDateString(dateStr: string): string {
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export function EventFormDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate,
}: EventFormDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [type, setType] = useState<CalendarEvent['type']>('manual');
  const [color, setColor] = useState('#6366f1');
  const [linkedEntityType, setLinkedEntityType] = useState('');
  const [linkedEntityId, setLinkedEntityId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setAllDay(event.all_day);
      setType(event.type);
      setColor(event.color || '#6366f1');
      setLinkedEntityType(event.linked_entity_type || '');
      setLinkedEntityId(event.linked_entity_id || '');

      if (event.all_day) {
        setStartAt(toLocalDateString(event.start_at));
        setEndAt(event.end_at ? toLocalDateString(event.end_at) : '');
      } else {
        setStartAt(toLocalDatetimeString(event.start_at));
        setEndAt(event.end_at ? toLocalDatetimeString(event.end_at) : '');
      }
    } else {
      setTitle('');
      setDescription('');
      setAllDay(false);
      setType('manual');
      setColor('#6366f1');
      setLinkedEntityType('');
      setLinkedEntityId('');
      setEndAt('');

      if (defaultDate) {
        const offset = defaultDate.getTimezoneOffset();
        const local = new Date(defaultDate.getTime() - offset * 60000);
        setStartAt(local.toISOString().slice(0, 16));
      } else {
        setStartAt('');
      }
    }
  }, [event, defaultDate, isOpen]);

  if (!isOpen) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startAt) {return;}

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        all_day: allDay,
        type,
        color,
        linked_entity_type: linkedEntityType || null,
        linked_entity_id: linkedEntityId || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {return;}
    if (!confirm('Delete this event?')) {return;}
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#2a2a4a] flex items-center justify-between sticky top-0 bg-[#12122a] z-10">
          <h2 className="text-lg font-semibold text-white">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Event title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Optional description"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded border-[#2a2a4a] bg-[#1a1a3a] text-indigo-500"
            />
            <label htmlFor="allDay" className="text-sm text-gray-300">
              All day event
            </label>
          </div>

          {/* Date/Time fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start *</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CalendarEvent['type'])}
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    color === c.value
                      ? 'border-white scale-110'
                      : 'border-transparent hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Linked entity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Linked Entity</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={linkedEntityType}
                onChange={(e) => setLinkedEntityType(e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {linkedEntityType && (
                <input
                  type="text"
                  value={linkedEntityId}
                  onChange={(e) => setLinkedEntityId(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Entity ID"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:bg-[#1a1a3a] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim() || !startAt}
                className="px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : event ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
