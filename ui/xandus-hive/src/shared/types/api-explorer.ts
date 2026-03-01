export type ApiSourceStatus = 'pending' | 'crawling' | 'crawled' | 'error';

export interface ApiSource {
  id: string;
  name: string;
  base_url: string;
  docs_url: string | null;
  auth_config: Record<string, unknown>;
  status: ApiSourceStatus;
  last_crawled_at: string | null;
  created_at: string;
}

export interface ApiSourceCreate {
  name: string;
  base_url: string;
  docs_url?: string;
  auth_config?: Record<string, unknown>;
}

export interface ApiSourceUpdate extends Partial<ApiSourceCreate> {
  status?: ApiSourceStatus;
}

export interface ApiEndpoint {
  id: string;
  source_id: string;
  method: string;
  path: string;
  description: string | null;
  parameters: Record<string, unknown>[];
  request_body: Record<string, unknown> | null;
  response_schema: Record<string, unknown> | null;
  auth_required: boolean;
  selected: boolean;
  created_at: string;
}

export interface ApiDataPull {
  id: string;
  endpoint_id: string;
  trigger_id: string | null;
  transform_config: Record<string, unknown> | null;
  destination_table: string | null;
  last_pull_at: string | null;
  last_result: Record<string, unknown> | null;
}
