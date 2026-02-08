

# Revised Onboarding, Demo, and Account Model

## Key Clarification from User

- **Organization founders/managers** sign up with their own real email (e.g., `steve.jobs@acmecorp.com`)
- **Members** also use their own real emails and are invited by managers
- **Only one `admin@chiefofstaff.ai` account exists** -- this is the **platform superadmin** who oversees all organizations and subscriptions (not an org-level admin)
- Demo mode still needed, but demo accounts should use realistic fictional emails, not `@chiefofstaff.ai` domain

---

## Changes from Previous Plan

| Previous Plan | Revised |
|---|---|
| Demo admin was `demo-admin@chiefofstaff.ai` | Demo admin is `admin@chiefofstaff.ai` (platform superadmin) |
| All 10 demo accounts used `@chiefofstaff.ai` | Demo org members use realistic emails like `steve.jobs@apple.com` |
| No platform admin concept | New `platform_admin` flag or role to distinguish platform-wide admin from org admins |
| Org admins = highest role | Org admins manage their org; platform admin manages all orgs |

---

## Account Hierarchy

```text
Platform Admin (admin@chiefofstaff.ai)
  Can view/manage ALL organizations
  Manages subscriptions
  Has platform-level "admin" role in user_roles

Organization Founder/Admin (e.g. steve.jobs@apple.com)
  Creates their org on signup
  Invites team members
  Has "admin" role in org_memberships for their org

Organization Manager (e.g. mike@apple.com)
  Manages teams within their org
  Can invite members
  Has "manager" role in org_memberships

Organization Member (e.g. dev@apple.com)
  Accepts invite, joins org
  Has "member" role in org_memberships
```

---

## Implementation Steps

### 1. Database Migration

**Add `invitations` table:**
- id, org_id, email, role (default: member), invited_by, token (uuid), status (pending/accepted/expired), created_at, expires_at (default: now() + 7 days)
- RLS: org managers/admins can INSERT and SELECT; token-based lookup for accept flow

**Add `onboarding_completed` column to `profiles`:**
- Boolean, default false
- Tracks whether a manager has completed the onboarding wizard

**Add `is_platform_admin` column to `user_roles`:**
- Or simply: the platform admin has an `admin` entry in `user_roles` without an org scope. The existing `has_role(user_id, 'admin')` function already checks this table, so the platform admin can be identified by having a row in `user_roles` with role = `admin`.

### 2. Seed Demo Data Edge Function (`seed-demo-data`)

Creates the full demo environment using the service role key:

**Platform admin account:**
- `admin@chiefofstaff.ai` / `pass123#` -- platform superadmin, has `admin` in `user_roles`

**Demo organization: "Apple" (slug: `appl`)**

Created by a demo founder account:
- `steve.jobs@apple.com` / `pass123#` -- org admin

**Demo org members (all `pass123#`):**
- `sarah.chen@apple.com` (Engineering Lead, manager)
- `marcus.johnson@apple.com` (Product Manager, manager)
- `emily.rodriguez@apple.com` (Designer, member)
- `david.kim@apple.com` (Sales, member)
- `lisa.wang@apple.com` (Marketing, member)
- `james.taylor@apple.com` (Legal, member)
- `priya.patel@apple.com` (HR, member)
- `alex.martinez@apple.com` (Operations, member)
- `rachel.green@apple.com` (Engineering, member)

All accounts created with `email_confirm: true` (no verification needed). All profiles have `onboarding_completed = true`.

**8 teams created:** Engineering, Product, Design, Sales, Marketing, Legal, HR, Operations -- with members assigned.

### 3. "Try the Demo" Button

- Clicking "Try the Demo" on the landing page signs in as `jane.founder@acme-demo.com` (the org admin of the demo org)
- This gives the full manager/admin experience of the demo org
- On success, redirects to `/dashboard`
- Shows a "Demo Mode" badge in the dashboard

### 4. Manager Onboarding Wizard (`/onboarding`)

Shown to new users who sign up and have `onboarding_completed = false`:

- **Step 1: Create Organization** -- name, auto-slug, creates `organizations` row + `org_memberships` with admin role
- **Step 2: Set Up Teams** -- pre-suggested team names with add/remove, creates `teams` rows
- **Step 3: Invite Members** -- email + role input, creates `invitations` rows, generates invite links for managers to share
- **Completion** -- sets `onboarding_completed = true`, redirects to `/dashboard`

### 5. Send Invite Edge Function (`send-invite`)

- Validates caller is org manager/admin (via auth token)
- Creates invitation record with unique token
- Generates invite link: `{SITE_URL}/accept-invite?token={token}`
- Returns the link (email sending can be added later with Resend or similar)
- For now, the link is displayed in the UI for the manager to copy/share manually

### 6. Accept Invite Page (`/accept-invite`)

- Reads `token` from URL query params
- Validates: token exists, not expired, status = pending
- Shows org name and offered role
- If not logged in: shows signup form with email pre-filled (read-only)
- If logged in: shows "Accept Invitation" button
- On accept: creates `org_memberships` row, sets invitation status to `accepted`, sets `onboarding_completed = true`, redirects to `/dashboard`

### 7. Updated Routing

- `/` -- Landing page
- `/auth` -- Login / Signup (handles `?token=` for invited users)
- `/onboarding` -- Manager onboarding wizard (protected; skipped if onboarding completed)
- `/accept-invite` -- Invitation acceptance (reads token from query)
- `/dashboard` -- Main dashboard (protected; requires completed onboarding)

### 8. Protected Route Updates

`ProtectedRoute` will check:
1. Is user authenticated? If no, redirect to `/auth`
2. Is `onboarding_completed` false? If yes, redirect to `/onboarding`
3. Otherwise, render children

### 9. Dashboard Updates

- Show "Demo Mode" badge when logged in as a demo account (check email domain `@apple.com`)
- Show user's org name in header
- Platform admin (`admin@chiefofstaff.ai`) will eventually get a platform management view

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | `invitations` table + `onboarding_completed` column |
| `supabase/functions/seed-demo-data/index.ts` | Create | Bootstrap demo accounts and org |
| `supabase/functions/send-invite/index.ts` | Create | Generate and store invite tokens |
| `src/pages/Onboarding.tsx` | Create | Multi-step manager onboarding wizard |
| `src/pages/AcceptInvite.tsx` | Create | Invite acceptance flow |
| `src/components/landing/HeroSection.tsx` | Modify | Demo login button behavior |
| `src/components/auth/ProtectedRoute.tsx` | Modify | Add onboarding completion check |
| `src/App.tsx` | Modify | Add new routes |
| `src/pages/Dashboard.tsx` | Modify | Demo mode badge, org name |
| `src/contexts/AuthContext.tsx` | Modify | Add profile/org data loading |
| `supabase/config.toml` | Modify | Register edge functions |

