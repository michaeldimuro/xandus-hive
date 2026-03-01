import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { GatewayRequestHandlerOptions, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

// ---------------------------------------------------------------------------
// Path safety
// ---------------------------------------------------------------------------

/**
 * Validate that a resolved path is strictly within the given root directory.
 * Prevents path traversal via .., symlinks, etc.
 */
function isPathWithin(root: string, target: string): boolean {
  const resolvedRoot = path.resolve(root) + path.sep;
  const resolvedTarget = path.resolve(target);
  // The target must start with the root directory path
  return resolvedTarget.startsWith(resolvedRoot) || resolvedTarget === resolvedRoot.slice(0, -1);
}

/**
 * Resolve and validate a file path within a workspace directory.
 * Returns null if the path would escape the workspace.
 */
function resolveWorkspacePath(workspaceDir: string, filePath: string): string | null {
  // Reject obviously malicious paths
  if (!filePath || typeof filePath !== "string") {
    return null;
  }
  const trimmed = filePath.trim();
  if (!trimmed) {
    return null;
  }
  // Reject absolute paths
  if (path.isAbsolute(trimmed)) {
    return null;
  }
  // Reject paths with null bytes
  if (trimmed.includes("\0")) {
    return null;
  }
  const resolved = path.resolve(workspaceDir, trimmed);
  if (!isPathWithin(workspaceDir, resolved)) {
    return null;
  }
  // Additional check: verify real path after symlink resolution (if file exists)
  try {
    const realPath = fs.realpathSync(resolved);
    if (!isPathWithin(workspaceDir, realPath)) {
      return null;
    }
    return realPath;
  } catch {
    // File doesn't exist yet (valid for writes) - check the parent dir exists
    const parentDir = path.dirname(resolved);
    try {
      const realParent = fs.realpathSync(parentDir);
      if (!isPathWithin(workspaceDir, realParent)) {
        return null;
      }
      return path.join(realParent, path.basename(resolved));
    } catch {
      // Parent doesn't exist either — still return the resolved path for writes
      // that will create intermediate directories
      return resolved;
    }
  }
}

function sendError(respond: (ok: boolean, payload?: unknown) => void, err: unknown) {
  respond(false, { error: err instanceof Error ? err.message : String(err) });
}

// ---------------------------------------------------------------------------
// Agent workspace resolution (lazy import to avoid circular deps)
// ---------------------------------------------------------------------------

type AgentListResult = {
  agents: Array<{
    id: string;
    name?: string;
    workspace: string;
    hasWorkspace: boolean;
    workspaceFiles: string[];
  }>;
};

async function listAgentsWithWorkspaces(
  config: OpenClawPluginApi["config"],
): Promise<AgentListResult> {
  // Dynamic import to avoid circular dependency issues at plugin load time
  const { listAgentIds, resolveAgentWorkspaceDir, resolveAgentConfig } =
    await import("../../src/agents/agent-scope.js");

  const ids = listAgentIds(config);
  const agents = await Promise.all(
    ids.map(async (id: string) => {
      const workspaceDir = resolveAgentWorkspaceDir(config, id);
      const agentConfig = resolveAgentConfig(config, id);
      let hasWorkspace = false;
      let workspaceFiles: string[] = [];
      try {
        const stat = await fsp.stat(workspaceDir);
        hasWorkspace = stat.isDirectory();
        if (hasWorkspace) {
          const entries = await fsp.readdir(workspaceDir);
          workspaceFiles = entries.filter(
            (entry) => !entry.startsWith(".") && entry !== "node_modules",
          );
        }
      } catch {
        // Workspace doesn't exist yet
      }
      return {
        id,
        name: agentConfig?.name,
        workspace: workspaceDir,
        hasWorkspace,
        workspaceFiles,
      };
    }),
  );
  return { agents };
}

async function resolveAgentWorkspace(
  config: OpenClawPluginApi["config"],
  agentId: string,
): Promise<string> {
  const { resolveAgentWorkspaceDir } = await import("../../src/agents/agent-scope.js");
  return resolveAgentWorkspaceDir(config, agentId);
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

const agentEditorPlugin = {
  id: "xandus-agent-editor",
  name: "Xandus Agent Editor",
  description:
    "Gateway methods for listing agents, reading/writing workspace files, and listing skills",
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    // -----------------------------------------------------------------------
    // xandus.agent.listAgents
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.agent.listAgents",
      async ({ respond }: GatewayRequestHandlerOptions) => {
        try {
          const result = await listAgentsWithWorkspaces(api.config);
          respond(true, result);
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    // -----------------------------------------------------------------------
    // xandus.agent.readFile
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.agent.readFile",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const agentId = typeof params?.agentId === "string" ? params.agentId.trim() : "";
          if (!agentId) {
            respond(false, { error: "agentId is required" });
            return;
          }

          const filePath = typeof params?.path === "string" ? params.path.trim() : "";
          if (!filePath) {
            respond(false, { error: "path is required" });
            return;
          }

          const workspaceDir = await resolveAgentWorkspace(api.config, agentId);
          const resolvedPath = resolveWorkspacePath(workspaceDir, filePath);
          if (!resolvedPath) {
            respond(false, {
              error: "path traversal rejected: path must be within agent workspace",
            });
            return;
          }

          try {
            const content = await fsp.readFile(resolvedPath, "utf-8");
            const stat = await fsp.stat(resolvedPath);
            respond(true, {
              path: filePath,
              content,
              size: stat.size,
              modifiedAt: stat.mtimeMs,
            });
          } catch (err) {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") {
              respond(false, { error: `file not found: ${filePath}` });
              return;
            }
            throw err;
          }
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    // -----------------------------------------------------------------------
    // xandus.agent.writeFile
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.agent.writeFile",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const agentId = typeof params?.agentId === "string" ? params.agentId.trim() : "";
          if (!agentId) {
            respond(false, { error: "agentId is required" });
            return;
          }

          const filePath = typeof params?.path === "string" ? params.path.trim() : "";
          if (!filePath) {
            respond(false, { error: "path is required" });
            return;
          }

          const content = typeof params?.content === "string" ? params.content : null;
          if (content === null) {
            respond(false, { error: "content must be a string" });
            return;
          }

          const workspaceDir = await resolveAgentWorkspace(api.config, agentId);
          const resolvedPath = resolveWorkspacePath(workspaceDir, filePath);
          if (!resolvedPath) {
            respond(false, {
              error: "path traversal rejected: path must be within agent workspace",
            });
            return;
          }

          // Ensure parent directory exists
          const parentDir = path.dirname(resolvedPath);
          // Validate parent is within workspace
          if (!isPathWithin(workspaceDir, parentDir)) {
            respond(false, {
              error: "path traversal rejected: parent directory escapes workspace",
            });
            return;
          }

          await fsp.mkdir(parentDir, { recursive: true });
          await fsp.writeFile(resolvedPath, content, "utf-8");

          const stat = await fsp.stat(resolvedPath);
          respond(true, {
            path: filePath,
            size: stat.size,
            modifiedAt: stat.mtimeMs,
            written: true,
          });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    // -----------------------------------------------------------------------
    // xandus.agent.listSkills
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.agent.listSkills",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const agentId = typeof params?.agentId === "string" ? params.agentId.trim() : "";
          if (!agentId) {
            respond(false, { error: "agentId is required" });
            return;
          }

          const workspaceDir = await resolveAgentWorkspace(api.config, agentId);
          const skillsDir = path.join(workspaceDir, "skills");

          const skills: Array<{
            name: string;
            path: string;
            size: number;
            modifiedAt: number;
          }> = [];

          try {
            const entries = await fsp.readdir(skillsDir, { withFileTypes: true });

            for (const entry of entries) {
              if (entry.isDirectory()) {
                // Look for SKILL.md inside each subdirectory
                const skillFilePath = path.join(skillsDir, entry.name, "SKILL.md");
                try {
                  const stat = await fsp.stat(skillFilePath);
                  skills.push({
                    name: entry.name,
                    path: `skills/${entry.name}/SKILL.md`,
                    size: stat.size,
                    modifiedAt: stat.mtimeMs,
                  });
                } catch {
                  // No SKILL.md in this directory - skip
                }
              } else if (entry.isFile() && entry.name.endsWith(".md")) {
                // Also pick up top-level .md files in skills/ directory
                const stat = await fsp.stat(path.join(skillsDir, entry.name));
                skills.push({
                  name: entry.name.replace(/\.md$/, ""),
                  path: `skills/${entry.name}`,
                  size: stat.size,
                  modifiedAt: stat.mtimeMs,
                });
              }
            }
          } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
              throw err;
            }
            // skills/ directory doesn't exist — return empty list
          }

          respond(true, {
            agentId,
            skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
          });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    api.logger.info("[xandus-agent-editor] registered gateway methods");
  },
};

export default agentEditorPlugin;
