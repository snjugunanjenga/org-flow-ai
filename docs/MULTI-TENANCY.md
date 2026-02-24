# Multi-Tenant Architecture

## Overview

The platform implements multi-tenancy through PostgreSQL Row-Level Security (RLS), ensuring strict data isolation between organizations while allowing platform admins cross-tenant visibility.

## Tenant Isolation Layers

### 1. Database (RLS)
- Every data table includes `org_id` column
- All RLS policies use `is_org_member(auth.uid(), org_id)` to restrict access
- Security-definer functions (`is_org_member`, `has_org_role`, `is_org_manager_or_admin`) prevent RLS recursion

### 2. Application (OrgProvider)
- `OrgProvider` context wraps the dashboard, providing `orgId`, `org`, `role`, `subscription`
- All components consume org context via `useOrg()` hook
- Replaces scattered `useOrgId()` calls with centralized context

### 3. External Services
- **Pinecone**: Namespace isolation via `org_{org_id}`
- **Neo4j**: All nodes/edges tagged with `org_id` property

## Subscription Tiers

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Members | 5 | Unlimited | Unlimited |
| Projects | 1 | Unlimited | Unlimited |
| AI Queries | 10/day | Unlimited | Unlimited |
| Notebooks | 2 | Unlimited | Unlimited |

### Lifecycle
1. **Org creation** → auto-creates subscription (plan=free, status=trialing, trial=30 days)
2. **Trial expiry** → status changes to 'expired', FeatureGate shows upgrade prompts
3. **Upgrade** → admin updates plan/status via Platform Admin dashboard

### Enforcement
- **Client-side**: `FeatureGate` component checks plan limits before rendering features
- **Server-side**: `check_plan_limit()` function validates resource counts against plan limits
- **Hook**: `useSubscription()` fetches and caches org subscription via React Query

## Role Hierarchy

### Platform Level (`user_roles` table)
- `admin` — Global superadmin, cross-tenant access

### Organization Level (`org_memberships` table)
- `admin` — Org founder, full org management
- `manager` — Team management, project creation, oversight access
- `member` — Basic access, assigned to teams

## Multi-Org Support
- Users can belong to multiple organizations via `org_memberships`
- `OrgProvider` fetches all orgs, stores active `orgId` in localStorage
- `OrgSwitcher` component in sidebar for switching between orgs

## Edge Function Security
- All edge functions validate `org_id` from authenticated user's JWT
- Shared `get_user_org()` utility extracts user and validates org membership
- Never trusts client-supplied `org_id` without server-side validation

## Data Access Patterns

| Actor | organizations | subscriptions | All org data |
|---|---|---|---|
| Platform Admin | SELECT all | SELECT/UPDATE all | Via admin RLS |
| Org Admin | SELECT own | SELECT own | Full CRUD own org |
| Org Manager | SELECT own | SELECT own | Restricted CRUD |
| Org Member | SELECT own | SELECT own | Read-only + own data |
