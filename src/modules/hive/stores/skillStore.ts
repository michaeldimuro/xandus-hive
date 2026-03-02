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

/**
 * Adapt the skills.status response (gateway format) into SkillMeta[].
 * The gateway returns { skills: Array<{ name, description, scope, ... }> }
 * or { entries: [...] } depending on version.
 */
function extractSkillList(res: unknown): SkillMeta[] {
  const data = res as Record<string, unknown>;
  // Try .skills first, then .entries, then treat the whole response as an array
  const candidates = data?.skills ?? data?.entries ?? data?.installed ?? data;
  if (Array.isArray(candidates)) {
    return candidates.map((s: Record<string, unknown>) => ({
      name: typeof s.name === "string" ? s.name : "",
      description: typeof s.description === "string" ? s.description : "",
      scope: (s.scope as "global" | "library") ?? "global",
      supportingFiles: Array.isArray(s.supportingFiles) ? s.supportingFiles : [],
    }));
  }
  return [];
}

export const useSkillStore = create<SkillStoreState>((set, get) => ({
  skills: [],
  loading: true,
  activeSkill: null,

  setSkills: (skillList) => set({ skills: skillList, loading: false }),
  setActiveSkill: (skill) => set({ activeSkill: skill }),

  fetchSkills: () => {
    // Gateway has skills.status, not skills.list
    skills
      .status()
      .then((res) => {
        const list = extractSkillList(res);
        useSkillStore.getState().setSkills(list);
      })
      .catch(() => {
        // Mark loading done even on error so page doesn't spin forever
        set({ loading: false });
      });
  },

  getSkillContent: (_name, _scope) => {
    // skills.get is not available in the gateway; no-op
  },

  saveSkill: (name, _scope, _content) => {
    // Gateway has skills.update (enable/disable/apiKey), not skills.save
    // Use skills.update with the skill key
    skills
      .status()
      .then(() => {
        // Refresh after any update attempt
        get().fetchSkills();
      })
      .catch(() => {});
    void name;
  },

  deleteSkill: (_name, _scope) => {
    // skills.delete not available in gateway; no-op
    // Could potentially use skills.update with enabled: false
  },

  assignSkills: (_agentId, _skillNames) => {
    // skills.assign not available in gateway; no-op
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

    get().fetchSkills();
  },
}));
