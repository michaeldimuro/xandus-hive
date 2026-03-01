---
name: supabase-properties
description: Manage real estate properties, comps, and financials in Supabase.
metadata:
  {
    "openclaw":
      {
        "emoji": "🏠",
        "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
      },
  }
---

# Supabase Real Estate Properties

Manage real estate properties, comparable sales (comps), and property financials stored in Supabase.

## Setup

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Tables

This skill covers three related tables: `properties`, `comps`, and `property_financials`.

### `properties`

The main properties table. Schema is flexible -- common columns include:

| Column         | Type   | Notes                                                  |
| -------------- | ------ | ------------------------------------------------------ |
| id             | uuid   | Primary key                                            |
| user_id        | uuid   | Owner                                                  |
| address        | text   | Property address                                       |
| city           | text   |                                                        |
| state          | text   |                                                        |
| zip            | text   |                                                        |
| property_type  | text   | e.g., `single_family`, `multi_family`, `condo`         |
| bedrooms       | number |                                                        |
| bathrooms      | number |                                                        |
| sqft           | number | Square footage                                         |
| lot_size       | number | Lot size in sqft or acres                              |
| year_built     | number |                                                        |
| purchase_price | number |                                                        |
| current_value  | number | Estimated current value                                |
| status         | text   | e.g., `active`, `under_contract`, `closed`, `prospect` |
| notes          | text   |                                                        |
| created_at     | text   | Auto                                                   |

### `comps` (Comparable Sales)

| Column         | Type   | Notes                 |
| -------------- | ------ | --------------------- |
| id             | uuid   | Primary key           |
| property_id    | uuid   | FK to `properties`    |
| address        | text   | Comp property address |
| sale_price     | number |                       |
| sale_date      | text   | ISO timestamp         |
| sqft           | number |                       |
| bedrooms       | number |                       |
| bathrooms      | number |                       |
| distance_miles | number | Distance from subject |
| notes          | text   |                       |
| created_at     | text   | Auto                  |

### `property_financials`

| Column              | Type   | Notes                |
| ------------------- | ------ | -------------------- |
| id                  | uuid   | Primary key          |
| property_id         | uuid   | FK to `properties`   |
| monthly_rent        | number |                      |
| monthly_mortgage    | number |                      |
| monthly_taxes       | number |                      |
| monthly_insurance   | number |                      |
| monthly_hoa         | number |                      |
| monthly_maintenance | number |                      |
| monthly_cash_flow   | number | Calculated or manual |
| cap_rate            | number | Percentage           |
| noi                 | number | Net Operating Income |
| arv                 | number | After Repair Value   |
| rehab_cost          | number |                      |
| notes               | text   |                      |
| created_at          | text   | Auto                 |

## Operations

### List Properties

```bash
# All properties for a user
curl -s "${SUPABASE_URL}/rest/v1/properties?select=*&user_id=eq.USER_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by status
curl -s "${SUPABASE_URL}/rest/v1/properties?select=*&user_id=eq.USER_UUID&status=eq.active&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Get property with comps and financials (embedded)
curl -s "${SUPABASE_URL}/rest/v1/properties?select=*,comps(*),property_financials(*)&id=eq.PROPERTY_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Accept: application/vnd.pgrst.object+json" | jq
```

### Create Property

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/properties" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "USER_UUID",
    "address": "123 Oak Street",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "property_type": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1800,
    "lot_size": 7500,
    "year_built": 1985,
    "purchase_price": 350000,
    "current_value": 420000,
    "status": "active",
    "notes": "Needs roof replacement"
  }' | jq
```

### Update Property

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/properties?id=eq.PROPERTY_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "current_value": 435000,
    "status": "under_contract"
  }' | jq
```

### Delete Property

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/properties?id=eq.PROPERTY_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: return=representation" | jq
```

### Add Comp

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/comps" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "property_id": "PROPERTY_UUID",
    "address": "456 Elm Street",
    "sale_price": 410000,
    "sale_date": "2026-01-15T00:00:00Z",
    "sqft": 1750,
    "bedrooms": 3,
    "bathrooms": 2,
    "distance_miles": 0.3,
    "notes": "Similar condition, updated kitchen"
  }' | jq
```

### List Comps for Property

```bash
curl -s "${SUPABASE_URL}/rest/v1/comps?select=*&property_id=eq.PROPERTY_UUID&order=sale_date.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

### Add/Update Property Financials

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/property_financials" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "property_id": "PROPERTY_UUID",
    "monthly_rent": 2800,
    "monthly_mortgage": 1850,
    "monthly_taxes": 290,
    "monthly_insurance": 120,
    "monthly_hoa": 0,
    "monthly_maintenance": 200,
    "monthly_cash_flow": 340,
    "cap_rate": 6.2,
    "noi": 26040,
    "arv": 450000,
    "rehab_cost": 35000
  }' | jq
```

### Get Financials for Property

```bash
curl -s "${SUPABASE_URL}/rest/v1/property_financials?select=*&property_id=eq.PROPERTY_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

## Notes

- Use PostgREST embedded resources (`select=*,comps(*),property_financials(*)`) to fetch related data in one query
- Property types are free-text but common values: `single_family`, `multi_family`, `condo`, `townhouse`, `commercial`, `land`
- Financial calculations (cap rate, NOI, cash flow) can be computed client-side or stored pre-calculated
- All monetary values are in USD
