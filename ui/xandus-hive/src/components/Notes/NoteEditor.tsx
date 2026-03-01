import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Eye, EyeOff, Trash2, Link as LinkIcon } from 'lucide-react';
import type { Note, NoteInput } from '@/stores/notesStore';

const ENTITY_TYPES = [
  { value: '', label: 'None' },
  { value: 'task', label: 'Task' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'lead', label: 'Lead' },
  { value: 'property', label: 'Property' },
  { value: 'calendar_event', label: 'Calendar Event' },
];

interface NoteEditorProps {
  note: Note;
  onSave: (id: string, data: Partial<NoteInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Very lightweight markdown-to-HTML renderer.
 * Handles: headings, bold, italic, code blocks, inline code, links, lists, paragraphs.
 */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (triple backticks)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre class="bg-[#0a0a1a] rounded-lg p-3 my-2 text-sm overflow-x-auto"><code>$2</code></pre>'
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#0a0a1a] px-1.5 py-0.5 rounded text-sm text-indigo-300">$1</code>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-white mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-white mt-4 mb-1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="text-indigo-400 hover:text-indigo-300 underline">$1</a>'
  );

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>');

  // Paragraphs — wrap lines that aren't already tags
  html = html
    .split('\n\n')
    .map((block) => {
      if (
        block.startsWith('<h') ||
        block.startsWith('<pre') ||
        block.startsWith('<li') ||
        block.startsWith('<ul')
      ) {
        return block;
      }
      return `<p class="text-gray-300 mb-2">${block.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}

export function NoteEditor({ note, onSave, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags?.join(', ') || '');
  const [linkedEntityType, setLinkedEntityType] = useState(note.linked_entity_type || '');
  const [linkedEntityId, setLinkedEntityId] = useState(note.linked_entity_id || '');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.join(', ') || '');
    setLinkedEntityType(note.linked_entity_type || '');
    setLinkedEntityId(note.linked_entity_id || '');
    setDirty(false);
    setShowPreview(false);
  }, [note.id]);

  const handleSave = useCallback(async () => {
    if (!dirty) {return;}
    setSaving(true);
    try {
      await onSave(note.id, {
        title: title.trim() || 'Untitled',
        content,
        tags: tags
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        linked_entity_type: linkedEntityType || null,
        linked_entity_id: linkedEntityId || null,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [note.id, title, content, tags, linkedEntityType, linkedEntityId, dirty, onSave]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!dirty) {return;}
    if (autoSaveTimer.current) {clearTimeout(autoSaveTimer.current);}
    autoSaveTimer.current = setTimeout(() => {
      handleSave();
    }, 2000);
    return () => {
      if (autoSaveTimer.current) {clearTimeout(autoSaveTimer.current);}
    };
  }, [dirty, handleSave]);

  const markDirty = () => setDirty(true);

  const handleDelete = async () => {
    if (!confirm(`Delete "${note.title}"?`)) {return;}
    await onDelete(note.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition ${
              showPreview
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a3a]'
            }`}
            title={showPreview ? 'Edit mode' : 'Preview mode'}
          >
            {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {dirty && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
          {saving && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm gradient-accent text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            <Save size={14} />
            Save
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-4">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          className="w-full text-xl font-bold text-white bg-transparent border-none outline-none placeholder-gray-600"
          placeholder="Untitled"
        />
      </div>

      {/* Tags */}
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Tags:</span>
          <input
            type="text"
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              markDirty();
            }}
            className="flex-1 text-sm text-gray-300 bg-transparent border-none outline-none placeholder-gray-600"
            placeholder="idea, meeting, important (comma separated)"
          />
        </div>
      </div>

      {/* Linked entity */}
      <div className="px-4 pt-2 pb-3 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-gray-500" />
          <select
            value={linkedEntityType}
            onChange={(e) => {
              setLinkedEntityType(e.target.value);
              if (!e.target.value) {setLinkedEntityId('');}
              markDirty();
            }}
            className="text-sm bg-transparent border-none outline-none text-gray-400 cursor-pointer"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-[#1a1a3a]">
                {t.label}
              </option>
            ))}
          </select>
          {linkedEntityType && (
            <input
              type="text"
              value={linkedEntityId}
              onChange={(e) => {
                setLinkedEntityId(e.target.value);
                markDirty();
              }}
              className="flex-1 text-sm text-gray-300 bg-transparent border-none outline-none placeholder-gray-600"
              placeholder="Entity ID"
            />
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {showPreview ? (
          <div
            className="p-4 prose prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              markDirty();
            }}
            className="w-full h-full p-4 bg-transparent text-gray-300 text-sm resize-none outline-none font-mono leading-relaxed"
            placeholder="Start writing... (Markdown supported)"
          />
        )}
      </div>
    </div>
  );
}
