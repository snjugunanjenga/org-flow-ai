## 1. Lock down demo access on the landing page

**Goal:** the Platform Super Admin card in the hero (screenshot) is a footgun — anyone can click it and land in the global admin console with a hardcoded password. Remove it from the public hero and stop shipping that password in client code.

Changes:
- `src/lib/demo-personas.ts` — remove the `admin` entry from `DEMO_PERSONAS` (so no admin email/password is bundled into the client). Keep the four org personas (apple, founder, pm, student).
- `src/components/landing/HeroSection.tsx` — drops automatically (it maps over `DEMO_PERSONAS`); grid becomes `lg:grid-cols-4`.
- `src/hooks/use-demo-login.ts` — no behavior change needed, but remove the `p.slug === "admin"` branch since the persona is gone.
- Super admin still works: they sign in normally at `/auth` with their real credentials and `AdminGuard` routes them to `/dashboard/admin`. No public one-click entry, no password in the bundle.

## 2. NotebookLM-style sources from Google Drive, SharePoint, OneDrive, Outlook

**Goal:** members add notebook sources by pasting a cloud-storage link (preferred) or uploading/pasting locally. Org members are nudged to keep originals in their personal/org Drive or SharePoint.

### UI (`src/components/resources/SourceUploader.tsx`)
Replace the 3-mode toggle (File / Text / URL) with 5 modes:

1. **Cloud link** (new, default) — single input that auto-detects:
   - `docs.google.com/document|spreadsheets|presentation/d/{id}` → Google Docs/Sheets/Slides
   - `drive.google.com/file/d/{id}` or `/open?id=` → Google Drive file
   - `*.sharepoint.com/...` → SharePoint item
   - `onedrive.live.com/...` or `1drv.ms/...` → OneDrive item
   - `outlook.office.com/mail/.../id/{id}` → Outlook message
   - Anything else → generic web URL (existing behavior)
   - Helper copy: "Tip — keep originals in your personal or org Drive/SharePoint so updates flow into the notebook."
2. **File upload** — unchanged (local file → `documents` bucket).
3. **Paste text** — unchanged.
4. **Web URL** — unchanged generic URL row.

A small "Recent from your Drive" picker (Drive only, behind the existing Google OAuth token) lists the user's 10 most-recent docs so they don't have to copy URLs.

### Backend — new edge function `resource-source-fetch`
Single endpoint that resolves a pasted cloud URL into source content + metadata and inserts the `resource_sources` row server-side (so we can use service role + connector gateways).

- Input: `{ notebook_id, org_id, url }`
- Verifies caller is org member.
- Detects provider from URL; extracts the resource id.
- Calls the matching Lovable connector gateway:
  - Google Docs → `google_docs/v1/documents/{id}` → flatten body to text
  - Google Sheets → `google_sheets/v4/spreadsheets/{id}/values/Sheet1!A1:Z1000` → CSV-ish text
  - Google Drive (other mime) → `google_drive/drive/v3/files/{id}?alt=media` → text (truncate to 200KB), or store metadata only for binaries
  - Microsoft SharePoint → `microsoft_sharepoint/sites/.../drive/items/{id}/content`
  - Microsoft OneDrive → `microsoft_onedrive/v1.0/me/drive/items/{id}/content`
  - Microsoft Outlook → `microsoft_outlook/me/messages/{id}` → subject + body text
- Inserts `resource_sources` row with `source_type` in `gdoc | gsheet | gdrive | sharepoint | onedrive | outlook`, `file_url = original link`, `content = extracted text`, `metadata = { provider, external_id, mime_type, owner }`.
- Returns the inserted row id.

The frontend calls `supabase.functions.invoke("resource-source-fetch", { body: { notebook_id, org_id, url } })`, then triggers `onUploaded()`.

### Connector setup
Use existing Lovable App connectors. If a needed connector is not yet linked (`google_drive`, `microsoft_sharepoint`, `microsoft_onedrive`, `microsoft_outlook`), prompt the user to link it via `standard_connectors--connect` before deploying the edge function. Google Docs/Sheets are already accessible if Google Drive scope is granted; otherwise we link `google_docs`/`google_sheets` too.

These connectors authenticate the developer/workspace account, not each end user. We surface this clearly in the helper copy: "Org-shared connection — links must be readable by the workspace's connected account. For private files, share them with the org service account or upload a copy."

### Display (`src/components/resources/SourceList.tsx`)
Add icons for the new source types (Drive / SharePoint / OneDrive / Outlook badges) and show the provider in the subtitle. The pin/chat plumbing is unchanged because the row schema is the same.

### Migration
No schema change required — `resource_sources.source_type` is already a free-form text column. Optional: add a CHECK-less comment documenting the accepted provider values.

## Out of scope (call out to user)
- Per-end-user OAuth for Drive/SharePoint (would need a full OAuth flow + token table per provider). Current plan uses the workspace connector — appropriate for an org tool, but every member shares the same connected account's permissions. If you want per-user Drive access, that's a follow-up.
- File-change webhooks ("source auto-refresh when the Doc updates"). Today the fetch happens once at add-time; we can add a manual "Re-sync" button per source in a later pass.

## Files touched
- `src/lib/demo-personas.ts` (remove admin)
- `src/components/landing/HeroSection.tsx` (grid cols)
- `src/hooks/use-demo-login.ts` (drop admin branch)
- `src/components/resources/SourceUploader.tsx` (new modes + helper copy)
- `src/components/resources/SourceList.tsx` (provider icons/labels)
- `supabase/functions/resource-source-fetch/index.ts` (new)
- `supabase/config.toml` (register new function, public = false)
