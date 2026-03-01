import { create } from 'zustand';
import * as ws from '@/lib/websocket';

export interface SkillMeta {
  name: string;
  description: string;
  scope: 'global' | 'library';
  supportingFiles: string[];
}

export interface SkillFull extends SkillMeta {
  content: string;
}

interface SkillStoreState {
  skills: SkillMeta[];
  loading: boolean;
  activeSkill: SkillFull | null;
  setSkills: (skills: SkillMeta[]) => void;
  setActiveSkill: (skill: SkillFull | null) => void;
  fetchSkills: () => void;
  getSkillContent: (name: string, scope: string) => void;
  saveSkill: (name: string, scope: string, content: string) => void;
  deleteSkill: (name: string, scope: string) => void;
  assignSkills: (agentId: string, skills: string[]) => void;
  uploadSkill: (file: File, scope: string) => Promise<void>;
}

export const useSkillStore = create<SkillStoreState>((set, get) => ({
  skills: [],
  loading: true,
  activeSkill: null,

  setSkills: (skills) => set({ skills, loading: false }),
  setActiveSkill: (skill) => set({ activeSkill: skill }),

  fetchSkills: () => {
    ws.send({ type: 'skill.list' });
  },

  getSkillContent: (name, scope) => {
    ws.send({ type: 'skill.get', name, scope });
  },

  saveSkill: (name, scope, content) => {
    ws.send({ type: 'skill.save', name, scope, content });
  },

  deleteSkill: (name, scope) => {
    ws.send({ type: 'skill.delete', name, scope });
  },

  assignSkills: (agentId, skills) => {
    ws.send({ type: 'skill.assign', agentId, skills });
  },

  uploadSkill: async (file, scope) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', scope);

    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const res = await fetch(`${baseUrl}/api/skills/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }

    // Refresh skills list after upload
    get().fetchSkills();
  },
}));
