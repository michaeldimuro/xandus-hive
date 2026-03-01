export interface CronJob {
  id: string;
  name: string;
  schedule: string; // cron expression
  prompt: string; // what to send the agent
  session: string; // session key (e.g. "main")
  agentId?: string; // optional target agent
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt?: string;
}

export interface CronJobCreate {
  name: string;
  schedule: string;
  prompt: string;
  session?: string;
  agentId?: string;
  enabled?: boolean;
}
