---
name: supabase-finance
description: Manage financial accounts, transactions, and plans in Supabase.
metadata:
  {
    "openclaw":
      {
        "emoji": "💰",
        "requires": { "bins": ["curl", "jq"], "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"] },
      },
  }
---

# Supabase Financial Data

Manage financial accounts, transactions, and financial plans stored in Supabase.

## Setup

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Tables

### `financial_accounts`

| Column      | Type   | Notes                                                    |
| ----------- | ------ | -------------------------------------------------------- |
| id          | uuid   | Primary key                                              |
| user_id     | uuid   | Owner                                                    |
| name        | text   | Account name                                             |
| type        | text   | e.g., `checking`, `savings`, `credit_card`, `investment` |
| institution | text   | Bank/brokerage name                                      |
| balance     | number | Current balance                                          |
| currency    | text   | Default `USD`                                            |
| notes       | text   |                                                          |
| created_at  | text   | Auto                                                     |

### `financial_transactions`

| Column      | Type   | Notes                                            |
| ----------- | ------ | ------------------------------------------------ |
| id          | uuid   | Primary key                                      |
| account_id  | uuid   | FK to `financial_accounts`                       |
| user_id     | uuid   | Owner                                            |
| date        | text   | Transaction date (ISO)                           |
| description | text   | Transaction description                          |
| amount      | number | Positive = income, negative = expense            |
| category    | text   | e.g., `income`, `expense`, `transfer`            |
| subcategory | text   | e.g., `salary`, `utilities`, `materials`, `rent` |
| notes       | text   |                                                  |
| created_at  | text   | Auto                                             |

### `financial_plans`

| Column     | Type   | Notes                                      |
| ---------- | ------ | ------------------------------------------ |
| id         | uuid   | Primary key                                |
| user_id    | uuid   | Owner                                      |
| name       | text   | Plan name                                  |
| type       | text   | e.g., `budget`, `savings_goal`, `forecast` |
| target     | number | Target amount                              |
| current    | number | Current progress                           |
| start_date | text   | ISO timestamp                              |
| end_date   | text   | ISO timestamp                              |
| status     | text   | e.g., `active`, `completed`, `paused`      |
| notes      | text   |                                            |
| created_at | text   | Auto                                       |

## Operations

### Accounts

#### List Accounts

```bash
curl -s "${SUPABASE_URL}/rest/v1/financial_accounts?select=*&user_id=eq.USER_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

#### Create Account

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/financial_accounts" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "USER_UUID",
    "name": "Business Checking",
    "type": "checking",
    "institution": "Chase",
    "balance": 15000.00,
    "currency": "USD"
  }' | jq
```

#### Update Account Balance

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/financial_accounts?id=eq.ACCOUNT_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "balance": 16500.00
  }' | jq
```

#### Delete Account

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/financial_accounts?id=eq.ACCOUNT_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: return=representation" | jq
```

### Transactions

#### List Transactions

```bash
# All transactions for a user
curl -s "${SUPABASE_URL}/rest/v1/financial_transactions?select=*&user_id=eq.USER_UUID&order=date.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by account
curl -s "${SUPABASE_URL}/rest/v1/financial_transactions?select=*&account_id=eq.ACCOUNT_UUID&order=date.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by date range
curl -s "${SUPABASE_URL}/rest/v1/financial_transactions?select=*&user_id=eq.USER_UUID&date=gte.2026-01-01&date=lte.2026-03-31&order=date.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Filter by category
curl -s "${SUPABASE_URL}/rest/v1/financial_transactions?select=*&user_id=eq.USER_UUID&category=eq.expense&order=date.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

#### Create Transaction

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/financial_transactions" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "account_id": "ACCOUNT_UUID",
    "user_id": "USER_UUID",
    "date": "2026-03-01T00:00:00Z",
    "description": "Materials purchase - lumber",
    "amount": -1250.00,
    "category": "expense",
    "subcategory": "materials",
    "notes": "Oak framing for Johnson project"
  }' | jq
```

Convention: positive amounts for income, negative for expenses.

#### Update Transaction

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/financial_transactions?id=eq.TX_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "category": "expense",
    "subcategory": "materials",
    "notes": "Updated notes"
  }' | jq
```

#### Delete Transaction

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/financial_transactions?id=eq.TX_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: return=representation" | jq
```

### Financial Plans

#### List Plans

```bash
curl -s "${SUPABASE_URL}/rest/v1/financial_plans?select=*&user_id=eq.USER_UUID&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq

# Active plans only
curl -s "${SUPABASE_URL}/rest/v1/financial_plans?select=*&user_id=eq.USER_UUID&status=eq.active&order=created_at.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" | jq
```

#### Create Plan

```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/financial_plans" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "USER_UUID",
    "name": "Emergency Fund",
    "type": "savings_goal",
    "target": 25000,
    "current": 8500,
    "start_date": "2026-01-01T00:00:00Z",
    "end_date": "2026-12-31T23:59:59Z",
    "status": "active",
    "notes": "6 months of expenses"
  }' | jq
```

#### Update Plan Progress

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/financial_plans?id=eq.PLAN_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "current": 12000,
    "status": "active"
  }' | jq
```

#### Delete Plan

```bash
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/financial_plans?id=eq.PLAN_UUID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Prefer: return=representation" | jq
```

## Notes

- All monetary values are in USD unless the `currency` field specifies otherwise
- Use positive amounts for income/deposits and negative amounts for expenses/withdrawals
- Categories are free-text but common values: `income`, `expense`, `transfer`
- Subcategories are free-text for flexibility: `salary`, `utilities`, `materials`, `rent`, `insurance`, `fuel`, etc.
- Plan types are free-text: `budget`, `savings_goal`, `forecast`, `debt_payoff`
- Use PostgREST operators for aggregation queries or complex filtering
