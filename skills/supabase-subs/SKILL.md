---
name: supabase-subs
description: Manage subcontractors and reviews in Supabase (CRUD, search, archive, review).
metadata:
  {
    "openclaw":
      {
        "emoji": "🔧",
        "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
      },
  }
---

# Supabase Subcontractors Management

Manage subcontractors and their reviews stored in the Supabase `subcontractors` and `subcontractor_reviews` tables.

## Setup

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Table Schema

### `subcontractors`

| Column              | Type    | Required | Notes                                                                                                                            |
| ------------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| id                  | uuid    | auto     | Primary key                                                                                                                      |
| name                | text    | yes      |                                                                                                                                  |
| specialty           | enum    | yes      | `electrical`, `plumbing`, `HVAC`, `carpentry`, `drywall`, `roofing`, `painting`, `flooring`, `masonry`, `landscaping`, `general` |
| phone               | text    | yes      |                                                                                                                                  |
| company_name        | text    | no       |                                                                                                                                  |
| email               | text    | no       |                                                                                                                                  |
| hourly_rate         | number  | no       |                                                                                                                                  |
| daily_rate          | number  | no       |                                                                                                                                  |
| quality_rating      | number  | no       | 1.0 to 5.0 (default 3.0)                                                                                                         |
| reliability_score   | number  | no       | 0 to 100 (default 50)                                                                                                            |
| availability_status | enum    | no       | `available`, `busy`, `unavailable`, `do_not_use` (default `available`)                                                           |
| licensed            | boolean | no       | Default false                                                                                                                    |
| license_number      | text    | no       |                                                                                                                                  |
| insured             | boolean | no       | Default false                                                                                                                    |
| notes               | text    | no       |                                                                                                                                  |
| skills              | jsonb   | no       | Array of strings (default `[]`)                                                                                                  |
| tags                | jsonb   | no       | Array of strings (default `[]`)                                                                                                  |
| created_by_user_id  | uuid    | no       |                                                                                                                                  |
| archived            | boolean | no       | Default false                                                                                                                    |
| archived_at         | text    | no       | ISO timestamp when archived                                                                                                      |
| archived_reason     | text    | no       |                                                                                                                                  |
| created_at          | text    | auto     |                                                                                                                                  |

### `subcontractor_reviews`

| Column                 | Type    | Required | Notes                     |
| ---------------------- | ------- | -------- | ------------------------- |
| id                     | uuid    | auto     | Primary key               |
| subcontractor_id       | uuid    | yes      | Foreign key               |
| rating                 | number  | yes      | Overall rating 1.0 to 5.0 |
| project_id             | uuid    | no       | Related project           |
| quality_rating         | number  | no       |                           |
| timeliness_rating      | number  | no       |                           |
| professionalism_rating | number  | no       |                           |
| communication_rating   | number  | no       |                           |
| review_text            | text    | no       |                           |
| would_hire_again       | boolean | no       | Default true              |
| job_description        | text    | no       |                           |
| job_cost               | number  | no       |                           |
| reviewed_by_user_id    | uuid    | no       |                           |
| created_at             | text    | auto     |                           |

## Operations

### List All Subcontractors

Non-archived by default, ordered by quality rating (highest first).

```bash
# All active subcontractors
curl -s "${SUPABASE_URL}/rest/v1/subcontractors?select=*&archived=eq.false&order=quality_rating.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by specialty
curl -s "${SUPABASE_URL}/rest/v1/subcontractors?select=*&archived=eq.false&specialty=eq.electrical&order=quality_rating.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by availability
curl -s "${SUPABASE_URL}/rest/v1/subcontractors?select=*&archived=eq.false&availability_status=eq.available&order=quality_rating.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Include archived
curl -s "${SUPABASE_URL}/rest/v1/subcontractors?select=*&order=quality_rating.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

### Get Subcontractor by ID

```bash
curl -s "${SUPABASE_URL}/rest/v1/subcontractors?select=*&id=eq.SUB_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Accept: application/vnd.pgrst.object+json" | jq
```

### Search Subcontractors

Search by name or company name (case-insensitive).

```bash
curl -s "${SUPABASE_URL}/rest/v1/subcontractors?select=*&archived=eq.false&or=(name.ilike.*QUERY*,company_name.ilike.*QUERY*)&order=quality_rating.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

Replace `QUERY` with the search term (e.g., `*Mike*`).

### Create Subcontractor

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/subcontractors" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Mike Johnson",
    "specialty": "electrical",
    "phone": "555-0123",
    "company_name": "Johnson Electric LLC",
    "email": "mike@johnsonelectric.com",
    "hourly_rate": 85,
    "daily_rate": 650,
    "quality_rating": 4.5,
    "reliability_score": 90,
    "availability_status": "available",
    "licensed": true,
    "license_number": "EL-12345",
    "insured": true,
    "notes": "Excellent commercial work",
    "skills": ["panel upgrades", "wiring", "troubleshooting"],
    "tags": ["preferred", "commercial"],
    "created_by_user_id": "USER_UUID"
  }' | jq
```

Required fields: `name`, `specialty`, `phone`.
Defaults: `quality_rating` = 3.0, `reliability_score` = 50, `availability_status` = `available`, `licensed` = false, `insured` = false, `skills` = `[]`, `tags` = `[]`.

Valid `specialty` values: `electrical`, `plumbing`, `HVAC`, `carpentry`, `drywall`, `roofing`, `painting`, `flooring`, `masonry`, `landscaping`, `general`.

### Update Subcontractor

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/subcontractors?id=eq.SUB_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "availability_status": "busy",
    "quality_rating": 4.8,
    "hourly_rate": 90
  }' | jq
```

Updatable fields: `name`, `company_name`, `phone`, `email`, `hourly_rate`, `daily_rate`, `quality_rating`, `reliability_score`, `availability_status`, `licensed`, `license_number`, `insured`, `notes`, `skills`, `tags`.

### Archive Subcontractor (Soft Delete)

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/subcontractors?id=eq.SUB_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "archived": true,
    "archived_at": "2026-03-01T00:00:00Z",
    "archived_reason": "Moved out of area"
  }' | jq
```

### Create Review

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/subcontractor_reviews" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "subcontractor_id": "SUB_UUID",
    "rating": 4.5,
    "project_id": "PROJECT_UUID",
    "quality_rating": 5.0,
    "timeliness_rating": 4.0,
    "professionalism_rating": 4.5,
    "communication_rating": 4.5,
    "review_text": "Excellent work on panel upgrade",
    "would_hire_again": true,
    "job_description": "200A panel upgrade",
    "job_cost": 3500,
    "reviewed_by_user_id": "USER_UUID"
  }' | jq
```

Required fields: `subcontractor_id`, `rating`.
Default: `would_hire_again` = true.

### Get Reviews for Subcontractor

```bash
curl -s "${SUPABASE_URL}/rest/v1/subcontractor_reviews?select=*&subcontractor_id=eq.SUB_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

## Notes

- All IDs are UUIDs
- Archiving is a soft delete -- the record remains but `archived` is set to true
- The `skills` and `tags` fields are JSON arrays of strings
- Quality rating ranges from 1.0 to 5.0; reliability score ranges from 0 to 100
- Use `ilike` for case-insensitive search with `%` wildcards (encoded as `*` in URL)
