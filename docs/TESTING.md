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

## CI/CD Pipeline

See `.github/workflows/ci.yml`:
1. **Lint**: ESLint
2. **Unit + Integration**: `vitest run` with coverage
3. **Build**: `vite build`
4. **E2E**: Playwright against preview
5. **Deploy**: Auto-deploy on main merge

Coverage threshold: 80% for agent logic modules.
