# 20 — Production Hardening and Deployment

## Feature name

Production configuration, Docker, CI, seed admin, and final regression.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Prepare the app for production deployment with secure config, Docker, CI, build scripts, seed admin, and final verification.

## Scope of work

No new product features.

## Files/folders to create

```text
docker-compose.yml
Dockerfile.backend
Dockerfile.frontend
nginx/default.conf
scripts/seedAdmin.js
scripts/checkEnv.js
docs/deployment.md
docs/security-checklist.md
.github/workflows/ci.yml
```

## Files/folders to modify

```text
package.json
backend/package.json
frontend/package.json
backend/src/config/env.js
backend/src/server.js
frontend/vite.config.js
README.md
```

## Backend implementation instructions

Add production env validation, strong JWT secret checks, secure cookies in production, strict CORS, requestId middleware, seed admin script, production build/start scripts, Docker files, and CI workflow running tests/build.

## Frontend implementation instructions

Add error boundary, production build config, and remove sensitive console logs.

## Database/model changes

No new models.

## API routes

No new product routes.

## Controllers/services/middlewares required

request ID middleware, env checker, seed script, CI workflow

## Validation rules

Env checker must fail missing vars; JWT secrets >=32 chars; seed admin password follows policy.

## Security requirements

No secrets committed; secure cookies production; CORS not wildcard; stack hidden; public report links token protected.

## Error handling requirements

Startup env errors name variable; production API errors safe; CI fails on test/build failure.

## Test cases to write

1. Env checker fails missing var.
2. Weak JWT secret rejected.
3. Seed admin creates admin.
4. Seed admin no duplicate.
5. Error response includes requestId.
6. Stack hidden in production.
7. Full tests pass.
8. Build succeeds.

## Commands to run tests

```bash
npm run test
npm run test:backend
npm run test:frontend
```

## Commands to run the complete app

```bash
npm run dev
```

For production verification where applicable:

```bash
npm run build
npm run start
```

## Expected result after implementation

Application is deployable with production-grade defaults.

## What the user/developer should see after running the app

Docker starts app; CI passes; seeded admin can log in.

## Regression check instructions to ensure previous features are not broken

Run complete manual smoke test for signup, login, user management, billing, scraping, properties, scoring, bookmarks, alerts, legal pack, reports, inspections, AI detection, sharing, admin, models.

## Final checklist

- [ ] Previous tests passed before implementation
- [ ] Required files/folders created
- [ ] Required files/folders modified
- [ ] Backend implementation completed
- [ ] Frontend implementation completed where applicable
- [ ] Database/model changes completed where applicable
- [ ] API routes implemented where applicable
- [ ] Controllers/services/middlewares implemented
- [ ] Validation rules implemented exactly
- [ ] Security requirements implemented exactly
- [ ] Error handling implemented exactly
- [ ] New tests added
- [ ] New tests passed
- [ ] Full test suite passed after implementation
- [ ] Backend runs successfully
- [ ] Frontend runs successfully
- [ ] Feature works manually
- [ ] No previous production-ready feature is broken

