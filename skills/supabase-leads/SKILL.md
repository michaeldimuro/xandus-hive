---
name: supabase-leads
description: Manage sales leads across businesses stored in Supabase (create, update status, list).
metadata:
  {
    "openclaw":
      {
        "emoji": "🎯",
        "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
      },
  }
---

# Supabase Leads Management

Manage sales leads stored in the Supabase `leads` table.

## Setup

Set the following environment variables:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Table Schema

### `leads`

| Column     | Type   | Required | Notes                                                                          |
| ---------- | ------ | -------- | ------------------------------------------------------------------------------ |
| id         | uuid   | auto     | Primary key                                                                    |
| user_id    | uuid   | yes      | Owner user                                                                     |
| business   | enum   | yes      | `capture_health`, `inspectable`, `synergy`                                     |
| name       | text   | yes      | Lead contact name                                                              |
| email      | text   | no       |                                                                                |
| phone      | text   | no       |                                                                                |
| company    | text   | no       |                                                                                |
| source     | text   | yes      | Where the lead came from                                                       |
| status     | enum   | no       | `new`, `contacted`, `qualified`, `proposal_sent`, `negotiating`, `won`, `lost` |
| value      | number | no       | Deal value                                                                     |
| notes      | text   | no       |                                                                                |
| created_at | text   | auto     |                                                                                |

## Operations

### List All Leads

```bash
# All leads for a user (newest first)
curl -s "${SUPABASE_URL}/rest/v1/leads?select=*&user_id=eq.USER_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by business
curl -s "${SUPABASE_URL}/rest/v1/leads?select=*&user_id=eq.USER_UUID&business=eq.synergy&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by status
curl -s "${SUPABASE_URL}/rest/v1/leads?select=*&user_id=eq.USER_UUID&status=eq.qualified&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

### Create Lead

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/leads" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "USER_UUID",
    "business": "synergy",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "555-0100",
    "company": "Acme Corp",
    "source": "referral",
    "status": "new",
    "value": 15000,
    "notes": "Met at trade show"
  }' | jq
```

Required fields: `user_id`, `business`, `name`, `source`.
Default: `status` = `new`.
Valid `business` values: `capture_health`, `inspectable`, `synergy`.

### Update Lead Status

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/leads?id=eq.LEAD_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "qualified"
  }' | jq
```

Valid status values: `new`, `contacted`, `qualified`, `proposal_sent`, `negotiating`, `won`, `lost`.

### Delete Lead

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/leads?id=eq.LEAD_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: return=representation" | jq
```

## Notes

- All IDs are UUIDs
- The `business` field determines which business vertical the lead belongs to
- The `source` field is free-text -- use it to track where leads originate (e.g., "referral", "website", "cold call", "trade show")
- Use PostgREST filter operators for advanced queries: `eq.`, `neq.`, `gt.`, `lt.`, `ilike.`
