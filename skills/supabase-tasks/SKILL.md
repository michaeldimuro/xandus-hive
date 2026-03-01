---
name: supabase-tasks
description: Manage tasks and kanban boards stored in Supabase (create, update, list, comment).
metadata:
  {
    "openclaw":
      {
        "emoji": "✅",
        "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
      },
  }
---

# Supabase Tasks & Kanban Management

Manage tasks and task comments stored in the Supabase `tasks` and `task_comments` tables.

## Setup

Set the following environment variables:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Table Schema

### `tasks`

| Column         | Type | Required | Notes                                                         |
| -------------- | ---- | -------- | ------------------------------------------------------------- |
| id             | uuid | auto     | Primary key                                                   |
| project_id     | uuid | yes      | Foreign key to `projects`                                     |
| user_id        | uuid | yes      | User who created the task                                     |
| title          | text | yes      |                                                               |
| description    | text | no       |                                                               |
| status         | enum | no       | `backlog`, `todo`, `in_progress`, `blocked`, `review`, `done` |
| priority       | enum | no       | `low`, `medium`, `high`, `urgent`                             |
| due_date       | text | no       | ISO 8601 timestamp                                            |
| assignee_id    | uuid | no       | User UUID for task assignee                                   |
| review_outcome | text | no       |                                                               |
| blocked_reason | text | no       |                                                               |
| created_at     | text | auto     |                                                               |

### `task_comments`

| Column     | Type | Required | Notes                  |
| ---------- | ---- | -------- | ---------------------- |
| id         | uuid | auto     | Primary key            |
| task_id    | uuid | yes      | Foreign key to `tasks` |
| user_id    | uuid | yes      | User who wrote comment |
| text       | text | yes      | Comment body           |
| created_at | text | auto     |                        |

## Operations

### List All Tasks

Optionally filter by `project_id` or `assignee_id`.

```bash
# All tasks (newest first)
curl -s "${SUPABASE_URL}/rest/v1/tasks?select=*&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by project
curl -s "${SUPABASE_URL}/rest/v1/tasks?select=*&project_id=eq.PROJECT_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by assignee
curl -s "${SUPABASE_URL}/rest/v1/tasks?select=*&assignee_id=eq.USER_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

### Create Task

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/tasks" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "project_id": "PROJECT_UUID",
    "user_id": "USER_UUID",
    "title": "Task title",
    "description": "Optional description",
    "status": "backlog",
    "priority": "medium",
    "due_date": "2026-03-15T09:00:00Z",
    "assignee_id": "ASSIGNEE_UUID"
  }' | jq
```

Required fields: `project_id`, `user_id`, `title`.
Defaults: `status` = `backlog`, `priority` = `medium`.

### Update Task

Use PATCH with the task ID to update status, priority, assignee, review outcome, or blocked reason.

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/tasks?id=eq.TASK_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "in_progress",
    "priority": "high",
    "assignee_id": "USER_UUID"
  }' | jq
```

Valid status values: `backlog`, `todo`, `in_progress`, `blocked`, `review`, `done`.
Valid priority values: `low`, `medium`, `high`, `urgent`.
Additional fields: `review_outcome`, `blocked_reason`.

### Add Task Comment

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/task_comments" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "task_id": "TASK_UUID",
    "user_id": "USER_UUID",
    "text": "Comment text here"
  }' | jq
```

### Get Task Comments

```bash
curl -s "${SUPABASE_URL}/rest/v1/task_comments?select=*&task_id=eq.TASK_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

## Related: Projects

Tasks belong to projects. Use the `projects` table to create/manage projects.

### Create Project

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/projects" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "USER_UUID",
    "business": "synergy",
    "name": "Project Name",
    "description": "Optional description"
  }' | jq
```

Valid `business` values: `capture_health`, `inspectable`, `synergy`.

## Notes

- All IDs are UUIDs
- Timestamps are ISO 8601 format
- The Supabase REST API uses PostgREST query syntax for filtering
- Use `eq.`, `neq.`, `gt.`, `lt.`, `gte.`, `lte.`, `like.`, `ilike.` for filter operators
