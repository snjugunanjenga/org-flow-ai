# Platform Administration

## Overview

The Platform Admin dashboard is available at `/dashboard/admin` for the global superadmin. It provides platform-wide oversight, subscription management, cross-tenant analytics, and communications.

## Access Control

- **Super Admin**: Identified by the `admin` role in `user_roles` table (NOT org-level admin)
- **Route Guard**: `AdminGuard` component checks `user_roles` before rendering; redirects non-admins to `/dashboard`
- **RLS**: Platform admin policies use `has_role(auth.uid(), 'admin')` for cross-tenant access

## Admin Dashboard Tabs

### Analytics Tab
- Total organizations count
- Total users (org memberships) count
- Subscription breakdown: Free / Pro / Enterprise
- Status breakdown: Trialing / Active / Canceled / Past Due

### Organizations Tab
- List all organizations with member count, creation date, plan, status
- Search and filter organizations
- Click to expand org detail: members, teams, projects count
- Quick actions: change plan, suspend org

### Subscriptions Tab
- List all subscriptions with org name, plan, status
- Inline plan/status editing via dropdowns
- Trial end date visibility

### Newsletters Tab
- Compose and send newsletters to organizations
- Target audience filtering: all, free, pro, enterprise
- Sent newsletter history with delivery tracking

### Audit Log Tab
- View recent admin actions (subscription changes, newsletter sends, org suspensions)
- Tracked in `admin_audit_log` table
- Fields: admin_user_id, action, target_type, target_id, metadata, created_at

## Database Tables

### admin_newsletters
- id, sent_by, subject, body, target_audience, sent_count, status, sent_at, created_at
- RLS: Platform admins only (via `has_role()`)

### admin_audit_log
- id, admin_user_id, action, target_type, target_id, metadata, created_at
- RLS: Platform admins only (via `has_role()`)

## Security Model

1. Client-side: `AdminGuard` checks `user_roles` table for `admin` role
2. Server-side: All admin tables have RLS policies using `has_role(auth.uid(), 'admin')`
3. Never uses localStorage or hardcoded credentials for admin checks
4. `user_roles` is a separate table from `profiles` to prevent privilege escalation
