---
name: supabase-calendar
description: Manage calendar events stored in Supabase (create, list, update, delete).
metadata:
  {
    "openclaw":
      {
        "emoji": "📅",
        "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
      },
  }
---

# Supabase Calendar Events

Manage calendar events stored in the Supabase `calendar_events` table.

## Setup

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Table Schema

### `calendar_events`

| Column      | Type    | Required | Notes                                      |
| ----------- | ------- | -------- | ------------------------------------------ |
| id          | uuid    | auto     | Primary key                                |
| user_id     | uuid    | yes      | Owner user                                 |
| title       | text    | yes      |                                            |
| start_time  | text    | yes      | ISO 8601 timestamp                         |
| end_time    | text    | yes      | ISO 8601 timestamp                         |
| business    | enum    | no       | `capture_health`, `inspectable`, `synergy` |
| location    | text    | no       |                                            |
| description | text    | no       |                                            |
| all_day     | boolean | no       | Default false                              |
| created_at  | text    | auto     |                                            |

## Operations

### List Events

```bash
# All events for a user (sorted by start time)
curl -s "${SUPABASE_URL}/rest/v1/calendar_events?select=*&user_id=eq.USER_UUID&order=start_time.asc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Events in a date range
curl -s "${SUPABASE_URL}/rest/v1/calendar_events?select=*&user_id=eq.USER_UUID&start_time=gte.2026-03-01T00:00:00Z&start_time=lte.2026-03-31T23:59:59Z&order=start_time.asc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by business
curl -s "${SUPABASE_URL}/rest/v1/calendar_events?select=*&user_id=eq.USER_UUID&business=eq.synergy&order=start_time.asc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Today's events
curl -s "${SUPABASE_URL}/rest/v1/calendar_events?select=*&user_id=eq.USER_UUID&start_time=gte.$(date -u +%Y-%m-%dT00:00:00Z)&start_time=lte.$(date -u +%Y-%m-%dT23:59:59Z)&order=start_time.asc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

### Create Event

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/calendar_events" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "USER_UUID",
    "title": "Client Meeting",
    "start_time": "2026-03-15T10:00:00Z",
    "end_time": "2026-03-15T11:00:00Z",
    "business": "synergy",
    "location": "123 Main St, Suite 200",
    "description": "Discuss renovation scope",
    "all_day": false
  }' | jq
```

Required fields: `user_id`, `title`, `start_time`, `end_time`.
Default: `all_day` = false.
Valid `business` values: `capture_health`, `inspectable`, `synergy`.

### Update Event

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/calendar_events?id=eq.EVENT_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "title": "Updated Meeting Title",
    "start_time": "2026-03-15T14:00:00Z",
    "end_time": "2026-03-15T15:00:00Z",
    "location": "New location"
  }' | jq
```

### Delete Event

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/calendar_events?id=eq.EVENT_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: return=representation" | jq
```

## Notes

- All timestamps are ISO 8601 format (e.g., `2026-03-15T10:00:00Z`)
- For all-day events, set `all_day` to true and use midnight-to-midnight timestamps
- The `business` field is optional and groups events by business vertical
- Use `gte` and `lte` PostgREST operators for date range queries
