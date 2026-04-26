# 18 — Admin Dashboard and Audit Logs

## Feature name

Admin metrics and sensitive action audit trail.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Add audit logging and admin dashboard metrics for operational visibility.

## Scope of work

Audit and dashboard only.

## Files/folders to create

```text
backend/src/models/AuditLog.js
backend/src/services/auditLog.service.js
backend/src/controllers/adminDashboard.controller.js
backend/src/controllers/auditLog.controller.js
backend/src/routes/admin.routes.js
backend/src/tests/admin-audit.test.js
frontend/src/pages/admin/AdminDashboardPage.jsx
frontend/src/pages/admin/AuditLogsPage.jsx
frontend/src/services/adminApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
backend/src/controllers/auth.controller.js
backend/src/controllers/user.controller.js
backend/src/controllers/billing.controller.js
backend/src/controllers/report.controller.js
backend/src/controllers/scrapeSource.controller.js
frontend/src/routes/AppRoutes.jsx
```

## Backend implementation instructions

Create AuditLog model and recordAudit service. Log login success/failure, user changes, billing checkout, report generation/share, scrape source changes/runs, inspection completion. Add dashboard counts and recent items. Add audit log list with filters/pagination.

## Frontend implementation instructions

Add `/admin` dashboard cards and `/admin/audit-logs` table with filters.

## Database/model changes

Create AuditLog collection.

## API routes

| GET | `/api/admin/dashboard` | admin, sub_admin | Metrics |
| GET | `/api/admin/audit-logs` | admin | Audit logs |

## Controllers/services/middlewares required

admin dashboard controller, audit log controller/service

## Validation rules

page >=1; limit 1–100; actorUserId valid; dates ISO.

## Security requirements

Audit logs must not store passwords/tokens/payment card data. Audit failure must not break main action.

## Error handling requirements

Invalid filters 400; forbidden 403; dashboard aggregation failure 500.

## Test cases to write

1. Admin dashboard works.
2. Sub_admin dashboard works.
3. User forbidden.
4. Admin audit logs works.
5. Sub_admin audit forbidden.
6. User creation logs.
7. Report share logs.
8. No secrets in meta.

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

Admin can monitor usage and review sensitive actions.

## What the user/developer should see after running the app

Admin dashboard and audit log pages show data.

## Regression check instructions to ensure previous features are not broken

Report, inspection, property, billing, and auth tests pass.

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

