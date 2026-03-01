#!/usr/bin/env npx tsx
/**
 * Migrate triggers from Xandus SQLite to OpenClaw cron jobs.
 *
 * Reads triggers from the xandus-micro SQLite database and outputs
 * OpenClaw cron job definitions that can be imported via the gateway.
 *
 * Usage:
 *   npx tsx scripts/migrate-triggers.ts [path-to-xandus.db]
 *
 * Default DB path: ~/Desktop/xandus-micro/store/xandus.db
 *
 * Output: writes cron-jobs.json and webhooks.json to current directory
 */

import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";

const dbPath = process.argv[2] || join(process.env.HOME!, "Desktop/xandus-micro/store/xandus.db");

if (!existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  console.error("Usage: npx tsx scripts/migrate-triggers.ts [path-to-db]");
  process.exit(1);
}

interface XandusTrigger {
  id: string;
  name: string;
  type: "cron" | "webhook" | "manual" | "telegram";
  enabled: number;
  cron_expression?: string;
  prompt?: string;
  webhook_path?: string;
  session_key?: string;
  group_folder?: string;
  created_at?: string;
}

interface OpenClawCronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  agent?: string;
  enabled: boolean;
  source: string;
}

interface OpenClawWebhook {
  id: string;
  name: string;
  path: string;
  agent?: string;
  source: string;
}

const db = new Database(dbPath);

// Check what tables exist
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%trigger%'")
  .all() as Array<{ name: string }>;

if (tables.length === 0) {
  console.log("No trigger tables found in database.");
  console.log(
    "Available tables:",
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((t: unknown) => (t as { name: string }).name)
      .join(", "),
  );
  process.exit(0);
}

const tableName = tables[0].name;
console.log(`Reading triggers from table: ${tableName}`);

let triggers: XandusTrigger[];
try {
  triggers = db.prepare(`SELECT * FROM ${tableName}`).all() as XandusTrigger[];
} catch (err) {
  console.error(`Failed to read triggers:`, err);
  process.exit(1);
}

console.log(`Found ${triggers.length} trigger(s)`);

const cronJobs: OpenClawCronJob[] = [];
const webhooks: OpenClawWebhook[] = [];
const skipped: string[] = [];

for (const trigger of triggers) {
  switch (trigger.type) {
    case "cron":
      if (trigger.cron_expression && trigger.prompt) {
        cronJobs.push({
          id: trigger.id,
          name: trigger.name,
          schedule: trigger.cron_expression,
          prompt: trigger.prompt,
          agent: trigger.session_key || "main",
          enabled: trigger.enabled === 1,
          source: `migrated from xandus-micro trigger ${trigger.id}`,
        });
      } else {
        skipped.push(`${trigger.name} (cron): missing expression or prompt`);
      }
      break;

    case "webhook":
      if (trigger.webhook_path) {
        webhooks.push({
          id: trigger.id,
          name: trigger.name,
          path: trigger.webhook_path,
          agent: trigger.session_key || "main",
          source: `migrated from xandus-micro trigger ${trigger.id}`,
        });
      } else {
        skipped.push(`${trigger.name} (webhook): missing path`);
      }
      break;

    case "manual":
      // Manual triggers become cron jobs without a schedule (fired via cron.run)
      if (trigger.prompt) {
        cronJobs.push({
          id: trigger.id,
          name: trigger.name,
          schedule: "", // No schedule — manual only
          prompt: trigger.prompt,
          agent: trigger.session_key || "main",
          enabled: trigger.enabled === 1,
          source: `migrated from xandus-micro manual trigger ${trigger.id}`,
        });
      }
      break;

    case "telegram":
      // Telegram-specific triggers need special handling via bindings
      skipped.push(`${trigger.name} (telegram): needs manual migration to OpenClaw bindings`);
      break;

    default: {
      const unknownType: string = trigger.type as string;
      skipped.push(`${trigger.name}: unknown type "${unknownType}"`);
    }
  }
}

// Write output files
writeFileSync("cron-jobs.json", JSON.stringify(cronJobs, null, 2));
writeFileSync("webhooks.json", JSON.stringify(webhooks, null, 2));

console.log(`\nMigrated:`);
console.log(`  ${cronJobs.length} cron job(s) → cron-jobs.json`);
console.log(`  ${webhooks.length} webhook(s) → webhooks.json`);

if (skipped.length) {
  console.log(`\nSkipped (${skipped.length}):`);
  skipped.forEach((s) => console.log(`  - ${s}`));
}

console.log(`\nNext steps:`);
console.log(`  1. Review cron-jobs.json and webhooks.json`);
console.log(`  2. Import cron jobs: openclaw cron add --file cron-jobs.json`);
console.log(`  3. Add webhook config to openclaw.json manually`);
console.log(`  4. Test: openclaw cron list`);

db.close();
