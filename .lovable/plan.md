# Implementation Plan

This plan covers six workstreams: fixing the onboarding flow, adding onboarding tests, redesigning the Knowledge Graph, building Resources tab, Platform Admin enhancements, and Multi-Tenant Architecture transformation.

---

## 1. Fix the Onboarding Flow ✅

- Added `OnboardingGuard` wrapper
- Fixed `user_roles` insertion
- Disabled back button on step 1 after org creation

## 2. Onboarding Tests ✅

- `src/pages/__tests__/Onboarding.test.tsx`
- `src/components/auth/__tests__/ProtectedRoute.test.tsx`

## 3. Knowledge Graph — Food-Web Visualization ✅

- `src/components/graph/ForceGraph.tsx` — Canvas-based force-directed graph

## 4. Resources Tab — NotebookLM-Style ✅

- Database tables: resource_notebooks, resource_sources, resource_chats, resource_outputs
- Edge function: `supabase/functions/resource-ai/index.ts`
- Components: NotebookList, NotebookDetail, SourceUploader, SourceList, ResourceChat, NotebookGuide, ReportGenerator

## 5. Platform Admin Enhancements (IN PROGRESS)

### A1. Admin Role Security
- `AdminGuard` component wrapping `/dashboard/admin` route
- Platform admin RLS policies for cross-tenant access
- `has_role()` security-definer function (already exists)

### A2. Enhanced Admin Dashboard
- **Analytics Tab**: Org count, user count, plan breakdown, status breakdown
- **Organizations Tab**: List all orgs, member counts, search/filter, org detail panel
- **Subscriptions Tab**: Inline plan/status editing
- **Newsletters Tab**: Compose, send, delivery tracking
- **Audit Log Tab**: Track admin actions

### A3. Database Changes
- `admin_audit_log` table with RLS
- Add `sent_count`, `status` columns to `admin_newsletters`
- Add `suspended_at` column to `organizations`
- Auto-subscription trigger on org creation
- Fix RLS: permissive policies for admin_newsletters, admin SELECT on organizations

### A4. Super Admin Account
- Email: simonnjenganjuguna@gmail.com
- Role: admin in user_roles
- Mock data: newsletters, audit logs

## 6. Multi-Tenant Architecture Transformation (IN PROGRESS)

### B1. Subscription Enforcement
- `useSubscription` hook — fetches org subscription, returns plan/limits
- `FeatureGate` component — plan-aware feature wrapper
- Plan limits config: free (5 members, 1 project), pro/enterprise (unlimited)

### B2. Subscription Lifecycle
- Auto-create subscription on org INSERT (database trigger)
- Trial expiry handling (30-day default)

### B3. OrgProvider Context
- Centralized org context replacing `useOrgId()`
- Multi-org switching support
- Exposes org, orgId, role, subscription

### B4. Data Isolation Audit
- Fix admin_newsletters RLS (RESTRICTIVE → add PERMISSIVE base)
- Fix subscriptions INSERT policy
- Add missing DELETE policies (resource_chats, direct_messages)
- Platform admin SELECT on organizations

---

## Implementation Order

1. ~~Onboarding fixes~~ ✅
2. ~~Onboarding tests~~ ✅
3. ~~Resources tab~~ ✅
4. ~~Knowledge Graph~~ ✅
5. **Database migration** — admin_audit_log, RLS fixes, triggers ← CURRENT
6. **AdminGuard + route protection**
7. **Enhanced AdminView** — Organizations, Audit Log tabs
8. **OrgProvider + useSubscription** — hooks & context
9. **FeatureGate + plan enforcement**
10. **Documentation updates**
