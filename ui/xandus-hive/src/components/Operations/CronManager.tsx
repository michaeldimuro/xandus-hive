/**
 * CronManager — View, create, edit, and manage scheduled tasks (crons).
 */

import {
  Plus,
  Pause,
  Play,
  Trash2,
  Pencil,
  X,
  Clock,
  CalendarClock,
  Timer,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as ws from "@/lib/openclaw-ws";
import { useOperationsStore, type ScheduledTaskInfo } from "@/stores/operationsStore";

type ScheduleType = "cron" | "interval" | "once";

interface TaskFormData {
  prompt: string;
  scheduleType: ScheduleType;
  scheduleValue: string;
  groupFolder: string;
  chatJid: string;
  contextMode: "group" | "isolated";
}

const EMPTY_FORM: TaskFormData = {
  prompt: "",
  scheduleType: "cron",
  scheduleValue: "",
  groupFolder: "main",
  chatJid: "",
  contextMode: "isolated",
};

const SCHEDULE_PRESETS: Record<string, { label: string; value: string }[]> = {
  cron: [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Daily 9 AM", value: "0 9 * * *" },
    { label: "Daily 6 PM", value: "0 18 * * *" },
    { label: "Weekdays 9 AM", value: "0 9 * * 1-5" },
    { label: "Weekly Monday 9 AM", value: "0 9 * * 1" },
  ],
  interval: [
    { label: "5 minutes", value: "300000" },
    { label: "15 minutes", value: "900000" },
    { label: "30 minutes", value: "1800000" },
    { label: "1 hour", value: "3600000" },
    { label: "6 hours", value: "21600000" },
    { label: "24 hours", value: "86400000" },
  ],
};

function formatSchedule(type: string, value: string): string {
  if (type === "cron") {
    return value;
  }
  if (type === "interval") {
    const ms = parseInt(value, 10);
    if (ms < 60000) {
      return `${ms / 1000}s`;
    }
    if (ms < 3600000) {
      return `${ms / 60000}m`;
    }
    if (ms < 86400000) {
      return `${(ms / 3600000).toFixed(1)}h`;
    }
    return `${(ms / 86400000).toFixed(1)}d`;
  }
  if (type === "once") {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }
  return value;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  const now = Date.now();
  const diff = d.getTime() - now;
  const abs = Math.abs(diff);
  const past = diff < 0;
  if (abs < 60000) {
    return past ? "just now" : "in <1m";
  }
  if (abs < 3600000) {
    const m = Math.floor(abs / 60000);
    return past ? `${m}m ago` : `in ${m}m`;
  }
  if (abs < 86400000) {
    const h = Math.floor(abs / 3600000);
    return past ? `${h}h ago` : `in ${h}h`;
  }
  const days = Math.floor(abs / 86400000);
  return past ? `${days}d ago` : `in ${days}d`;
}

const statusColors: Record<string, string> = {
  active: "text-green-400 bg-green-400/10 border-green-500/30",
  paused: "text-amber-400 bg-amber-400/10 border-amber-500/30",
  completed: "text-gray-400 bg-gray-400/10 border-gray-500/30",
};

const scheduleTypeIcons: Record<string, React.ReactNode> = {
  cron: <CalendarClock size={14} />,
  interval: <Timer size={14} />,
  once: <Clock size={14} />,
};

export function CronManager() {
  const tasks = useOperationsStore((s) => s.scheduledTasks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormData>(EMPTY_FORM);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "completed">("all");

  // Request task list on mount
  useEffect(() => {
    void ws.request("task.list");
  }, []);

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const handleCreate = () => {
    if (!form.prompt || !form.scheduleValue) {
      return;
    }
    void ws.request("task.create", {
      prompt: form.prompt,
      scheduleType: form.scheduleType,
      scheduleValue: form.scheduleValue,
      groupFolder: form.groupFolder,
      chatJid: form.chatJid || undefined,
      contextMode: form.contextMode,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    // Refresh list
    setTimeout(() => void ws.request("task.list"), 300);
  };

  const handleUpdate = () => {
    if (!editingId || !form.prompt || !form.scheduleValue) {
      return;
    }
    void ws.request("task.update", {
      taskId: editingId,
      prompt: form.prompt,
      scheduleType: form.scheduleType,
      scheduleValue: form.scheduleValue,
      contextMode: form.contextMode,
    });
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const startEdit = (task: ScheduledTaskInfo) => {
    setForm({
      prompt: task.prompt,
      scheduleType: task.schedule_type,
      scheduleValue: task.schedule_value,
      groupFolder: task.group_folder,
      chatJid: task.chat_jid,
      contextMode: task.context_mode,
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const handlePause = (id: string) => {
    void ws.request("task.pause", { taskId: id });
  };
  const handleResume = (id: string) => {
    void ws.request("task.resume", { taskId: id });
  };
  const handleDelete = (id: string) => {
    if (confirm("Delete this scheduled task?")) {
      void ws.request("task.cancel", { taskId: id });
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Scheduled Tasks
          </h2>
          <span className="text-xs text-gray-500 font-mono">{tasks.length} total</span>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/30 transition-colors"
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2">
        {(["all", "active", "paused", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filter === f
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                : "bg-[#12122a] text-gray-500 border-[#1e1e3a] hover:text-gray-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-1 text-[10px] opacity-60">
                {tasks.filter((t) => t.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-[#12122a] border border-[#1e1e3a] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              {editingId ? "Edit Task" : "Create Task"}
            </h3>
            <button onClick={cancelForm} className="text-gray-500 hover:text-gray-300">
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Prompt</label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={3}
              placeholder="What should the agent do?"
              className="w-full bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Schedule Type</label>
              <div className="flex gap-1">
                {(["cron", "interval", "once"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, scheduleType: t, scheduleValue: "" })}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                      form.scheduleType === t
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                        : "bg-[#0a0a1a] text-gray-500 border-[#1e1e3a] hover:text-gray-300"
                    }`}
                  >
                    {scheduleTypeIcons[t]}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Context Mode</label>
              <div className="flex gap-1">
                {(["isolated", "group"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setForm({ ...form, contextMode: m })}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                      form.contextMode === m
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                        : "bg-[#0a0a1a] text-gray-500 border-[#1e1e3a] hover:text-gray-300"
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Schedule Value
              {form.scheduleType === "cron" && " (cron expression)"}
              {form.scheduleType === "interval" && " (milliseconds)"}
              {form.scheduleType === "once" && " (ISO datetime)"}
            </label>
            <input
              type={form.scheduleType === "once" ? "datetime-local" : "text"}
              value={
                form.scheduleType === "once" && form.scheduleValue
                  ? form.scheduleValue.slice(0, 16)
                  : form.scheduleValue
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  scheduleValue:
                    form.scheduleType === "once"
                      ? new Date(e.target.value).toISOString()
                      : e.target.value,
                })
              }
              placeholder={
                form.scheduleType === "cron"
                  ? "0 9 * * *"
                  : form.scheduleType === "interval"
                    ? "3600000"
                    : ""
              }
              className="w-full bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none font-mono"
            />
            {SCHEDULE_PRESETS[form.scheduleType] && (
              <div className="flex flex-wrap gap-1 mt-2">
                {SCHEDULE_PRESETS[form.scheduleType].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setForm({ ...form, scheduleValue: p.value })}
                    className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                      form.scheduleValue === p.value
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                        : "bg-[#0a0a1a] text-gray-500 border-[#1e1e3a] hover:text-gray-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!editingId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Group Folder</label>
                <input
                  type="text"
                  value={form.groupFolder}
                  onChange={(e) => setForm({ ...form, groupFolder: e.target.value })}
                  placeholder="main"
                  className="w-full bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Chat JID (optional)</label>
                <input
                  type="text"
                  value={form.chatJid}
                  onChange={(e) => setForm({ ...form, chatJid: e.target.value })}
                  placeholder="Auto-resolve from group"
                  className="w-full bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={cancelForm}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={!form.prompt || !form.scheduleValue}
              className="flex items-center gap-1.5 px-4 py-2 text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              {editingId ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-[#12122a] border border-[#1e1e3a] rounded-xl p-8 text-center">
          <CalendarClock size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {filter === "all" ? "No scheduled tasks yet" : `No ${filter} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#12122a] border border-[#1e1e3a] rounded-xl p-4 hover:border-[#2a2a4a] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Status + Schedule Badge Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full border font-medium ${statusColors[task.status] || statusColors.completed}`}
                    >
                      {task.status}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-[#1a1a3a] text-gray-400 border border-[#252550]">
                      {scheduleTypeIcons[task.schedule_type]}
                      {formatSchedule(task.schedule_type, task.schedule_value)}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">{task.group_folder}</span>
                  </div>

                  {/* Prompt */}
                  <p className="text-sm text-white leading-relaxed line-clamp-2">{task.prompt}</p>

                  {/* Timing info */}
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                    {task.next_run && (
                      <span>
                        Next:{" "}
                        <span className="text-gray-400 font-mono">
                          {formatRelativeTime(task.next_run)}
                        </span>
                      </span>
                    )}
                    {task.last_run && (
                      <span>
                        Last:{" "}
                        <span className="text-gray-400 font-mono">
                          {formatRelativeTime(task.last_run)}
                        </span>
                      </span>
                    )}
                    {task.last_result && (
                      <span className="truncate max-w-[200px]" title={task.last_result}>
                        Result: <span className="text-gray-400">{task.last_result}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {task.status === "active" && (
                    <button
                      onClick={() => handlePause(task.id)}
                      className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                      title="Pause"
                    >
                      <Pause size={14} />
                    </button>
                  )}
                  {task.status === "paused" && (
                    <button
                      onClick={() => handleResume(task.id)}
                      className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                      title="Resume"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(task)}
                    className="p-1.5 text-gray-400 hover:bg-[#1a1a3a] hover:text-white rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
