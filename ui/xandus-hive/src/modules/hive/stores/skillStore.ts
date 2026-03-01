import { create } from "zustand";
import { skills } from "@/lib/openclaw-ws";

export interface SkillMeta {
  name: string;
  description: string;
  scope: "global" | "library";
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

  setSkills: (skillList) => set({ skills: skillList, loading: false }),
  setActiveSkill: (skill) => set({ activeSkill: skill }),

  fetchSkills: () => {
    skills
      .list()
      .then((res) => {
        const list = (res as { skills: SkillMeta[] }).skills;
        if (Array.isArray(list)) {
          useSkillStore.getState().setSkills(list);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  getSkillContent: (name, scope) => {
    skills
      .get(name, scope)
      .then((res) => {
        const skill = (res as { skill: SkillFull }).skill;
        if (skill) {
          useSkillStore.getState().setActiveSkill(skill);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  saveSkill: (name, scope, content) => {
    skills
      .save(name, scope, content)
      .then(() => {
        get().fetchSkills();
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  deleteSkill: (name, scope) => {
    skills
      .delete(name, scope)
      .then(() => {
        get().fetchSkills();
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  assignSkills: (agentId, skillNames) => {
    skills.assign(agentId, skillNames).catch(() => {
      /* handled by caller */
    });
  },

  uploadSkill: async (file, scope) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", scope);

    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const res = await fetch(`${baseUrl}/api/skills/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }

    // Refresh skills list after upload
    get().fetchSkills();
  },
}));
