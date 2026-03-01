---
name: supabase-notes
description: Manage notes stored in Supabase (create, list, update, delete).
metadata:
  {
    "openclaw":
      {
        "emoji": "📝",
        "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
      },
  }
---

# Supabase Notes

Manage notes stored in the Supabase `notes` table.

## Setup

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Table Schema

### `notes`

| Column     | Type | Required | Notes                              |
| ---------- | ---- | -------- | ---------------------------------- |
| id         | uuid | auto     | Primary key                        |
| user_id    | uuid | yes      | Owner user                         |
| title      | text | yes      |                                    |
| content    | text | yes      | Note body text                     |
| color      | text | no       | Hex color code (default `#fef08a`) |
| created_at | text | auto     |                                    |

## Operations

### List All Notes

```bash
# All notes for a user (newest first)
curl -s "${SUPABASE_URL}/rest/v1/notes?select=*&user_id=eq.USER_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

### Get Note by ID

```bash
curl -s "${SUPABASE_URL}/rest/v1/notes?select=*&id=eq.NOTE_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Accept: application/vnd.pgrst.object+json" | jq
```

### Create Note

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/notes" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "USER_UUID",
    "title": "Meeting Notes",
    "content": "Discussed project timeline and budget...",
    "color": "#fef08a"
  }' | jq
```

Required fields: `user_id`, `title`, `content`.
Default: `color` = `#fef08a` (light yellow).

### Update Note

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/notes?id=eq.NOTE_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content...",
    "color": "#bbf7d0"
  }' | jq
```

### Delete Note

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/notes?id=eq.NOTE_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: return=representation" | jq
```

## Suggested Color Codes

| Color        | Hex       | Use Case  |
| ------------ | --------- | --------- |
| Light Yellow | `#fef08a` | Default   |
| Light Green  | `#bbf7d0` | Completed |
| Light Blue   | `#bfdbfe` | Reference |
| Light Pink   | `#fecdd3` | Important |
| Light Purple | `#ddd6fe` | Ideas     |
| Light Orange | `#fed7aa` | Follow-up |

## Notes

- All IDs are UUIDs
- The `color` field is a hex color code used for visual display in the dashboard
- Notes content supports plain text; for rich formatting, use Markdown conventions
