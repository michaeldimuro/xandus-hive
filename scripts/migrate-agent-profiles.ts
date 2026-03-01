#!/usr/bin/env npx tsx
/**
 * Migrate agent profiles from Supabase to filesystem.
 *
 * Reads `agent_profiles` from Supabase and writes them as workspace files
 * in the format expected by OpenClaw agent workspaces.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/migrate-agent-profiles.ts
 *
 * Requires: @supabase/supabase-js (install if not present)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WORKSPACE_ROOT =
  process.env.WORKSPACE_ROOT || join(process.env.HOME!, ".openclaw/workspace/agents");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment");
  process.exit(1);
}

interface AgentProfile {
  id: string;
  name: string;
  display_name?: string;
  system_prompt?: string;
  model_preference?: string;
  skills?: string[];
  avatar_emoji?: string;
  description?: string;
  created_at?: string;
}

async function fetchProfiles(): Promise<AgentProfile[]> {
  const url = `${SUPABASE_URL}/rest/v1/agent_profiles?select=*&order=created_at.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${text}`);
  }

  return res.json();
}

function writeAgentFiles(profile: AgentProfile, agentDir: string) {
  mkdirSync(agentDir, { recursive: true });

  // IDENTITY.md — main agent identity file
  const identity = [
    `# ${profile.display_name || profile.name}`,
    "",
    profile.description ? `> ${profile.description}` : "",
    "",
    profile.system_prompt || "",
    "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
  writeFileSync(join(agentDir, "IDENTITY.md"), identity.trim() + "\n");

  // model-config.md — model preference
  const modelConfig = [
    `# Model Configuration`,
    "",
    `Model: ${profile.model_preference || "default"}`,
    "",
    `Migrated from Supabase agent_profiles.id=${profile.id}`,
    `Original created_at: ${profile.created_at || "unknown"}`,
  ].join("\n");
  writeFileSync(join(agentDir, "model-config.md"), modelConfig + "\n");

  // assigned-skills.md — skills list
  if (profile.skills?.length) {
    const skillsList = [
      `# Assigned Skills`,
      "",
      ...profile.skills.map((s: string) => `- ${s}`),
    ].join("\n");
    writeFileSync(join(agentDir, "assigned-skills.md"), skillsList + "\n");
  }

  // Create empty skills/ directory
  const skillsDir = join(agentDir, "skills");
  if (!existsSync(skillsDir)) {
    mkdirSync(skillsDir, { recursive: true });
  }
}

async function migrate() {
  console.log(`Fetching agent profiles from Supabase...`);
  console.log(`Workspace root: ${WORKSPACE_ROOT}`);

  const profiles = await fetchProfiles();

  if (!profiles.length) {
    console.log("No agent profiles found in Supabase.");
    return;
  }

  console.log(`Found ${profiles.length} agent profile(s)`);

  for (const profile of profiles) {
    const agentName = profile.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    const agentDir = join(WORKSPACE_ROOT, agentName);

    if (existsSync(join(agentDir, "IDENTITY.md"))) {
      console.log(`  SKIP: ${profile.name} → ${agentDir} (IDENTITY.md already exists)`);
      continue;
    }

    writeAgentFiles(profile, agentDir);
    console.log(`  OK: ${profile.name} → ${agentDir}`);
  }

  console.log("\nMigration complete.");
  console.log("Next steps: verify files, then update openclaw.json to reference these agents.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
