# Testing Strategy

## Stack
- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright (Chromium, Firefox, WebKit)
- **CI/CD**: GitHub Actions

## Unit Tests (Vitest)

### Coverage Areas
- Utility functions and helpers
- React components (render, interaction)
- Agent logic (entity extraction, scoring)
- Auth guards and role checks
- Caching configuration
- Vector memory helpers
- Team/role management logic
- Transcript processing

### Running
```bash
npm run test          # Watch mode
npm run test:ci       # CI mode with coverage
```

## Integration Tests (Vitest)

### Coverage Areas
- Full user flows (signup → dashboard)
- Agent chains (message → extract → embed → notify)
- Transcript pipeline (transcript → summary → knowledge → conflict)
- Pinecone upsert/query (mock client)
- Neo4j operations (mock driver)
- Role-based access verification

## E2E Tests (Playwright)

### Coverage Areas
- Auth flows (signup, login, logout, OAuth)
- All 11 dashboard views
- 3D graph interaction (click, filter, time slider)
- Agent queries and reasoning display
- Manager flows (team assignment, communication analytics)
- Transcript pipeline (meeting → summary → conflict → notification)
- Project tracking (create, tasks, progress)
- Multi-tenant isolation
- Mobile viewport
- Voice flow
- Demo mode

### Running
```bash
npx playwright test                  # All browsers
npx playwright test --project=chromium  # Single browser
npx playwright test --ui             # Interactive mode
```

## Super Admin Authentication Verification

Use this scenario to validate platform-level authorization behavior.

### Preconditions
- Seeded users exist for:
  - `simonnjenganjuguna@gmail.com` (has `admin` role in `user_roles`)
  - `steve.jobs@apple.com` (no `admin` role)
- Seed/demo data is present in admin tables (`subscriptions`, `organizations`, `admin_newsletters`, `admin_audit_log`).

### Playwright E2E Assertions
1. Login as `simonnjenganjuguna@gmail.com`.
2. Verify **Platform Admin** is visible in the sidebar.
3. Open `/dashboard/admin` and verify tabs are visible:
   - Analytics
   - Organizations
   - Subscriptions
   - Newsletters
   - Audit Log
4. Verify admin tabs render non-empty data states (seed/mock records).
5. Sign out.
6. Login as `steve.jobs@apple.com`.
7. Verify **Platform Admin** is not present in the sidebar and direct admin navigation is blocked.

### Notes
- If credentials are invalid in the current deployment, run this flow against the environment where seeded accounts were created.
- Capture screenshots for both personas as evidence in QA reports.

## CI/CD Pipeline

See `.github/workflows/ci.yml`:
1. **Lint**: ESLint
2. **Unit + Integration**: `vitest run` with coverage
3. **Build**: `vite build`
4. **E2E**: Playwright against preview
5. **Deploy**: Auto-deploy on main merge

Coverage threshold: 80% for agent logic modules.
