# 12 — Alerts and Notifications

## Feature name

Custom alerts and notification inbox.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Allow users to create alert rules and receive in-app/email notifications when matching properties are created or updated.

## Scope of work

Alert rules, matching, notifications. No reports.

## Files/folders to create

```text
backend/src/models/AlertRule.js
backend/src/models/Notification.js
backend/src/validators/alert.validator.js
backend/src/controllers/alert.controller.js
backend/src/controllers/notification.controller.js
backend/src/services/alert.service.js
backend/src/services/notification.service.js
backend/src/routes/alert.routes.js
backend/src/routes/notification.routes.js
backend/src/tests/alerts-notifications.test.js
frontend/src/pages/alerts/AlertsPage.jsx
frontend/src/pages/notifications/NotificationsPage.jsx
frontend/src/components/notifications/UnreadBadge.jsx
frontend/src/services/alertApi.js
frontend/src/services/notificationApi.js
```

## Files/folders to modify

```text
backend/src/services/scraperRunner.service.js
backend/src/routes/index.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
```

## Backend implementation instructions

Create AlertRule and Notification models. Implement rule CRUD, notification list/unread/mark-read. Matching service checks score, price, yield, postcodes, type, tenure. Trigger matching after scraper upsert and scoring. Enforce plan maxAlerts.

## Frontend implementation instructions

Create alerts management page and notifications inbox. Add unread badge to layout.

## Database/model changes

Create AlertRule and Notification collections.

## API routes

| GET/POST/PATCH/DELETE | `/api/alerts` | Authenticated | Alert CRUD |
| GET | `/api/notifications` | Authenticated | List |
| GET | `/api/notifications/unread-count` | Authenticated | Count |
| PATCH | `/api/notifications/:id/read` | Authenticated | Read |
| PATCH | `/api/notifications/read-all` | Authenticated | Read all |

## Controllers/services/middlewares required

alert controller/service, notification controller/service

## Validation rules

Alert name 2–100; at least one criterion; score 0–100; price/yield >=0; at least one channel.

## Security requirements

Users manage own rules; notifications visible only to receiver; plan limits server-side.

## Error handling requirements

Limit exceeded returns clear error; invalid rule 400; not found 404.

## Test cases to write

1. Create alert within limit.
2. Limit enforced.
3. At least one criterion required.
4. Matching property creates notification.
5. Non-match does not.
6. Email service called.
7. Mark read works.
8. Only own notifications visible.

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

Users receive notifications for matching deals.

## What the user/developer should see after running the app

Alerts page manages rules; notification badge updates.

## Regression check instructions to ensure previous features are not broken

Bookmarks, scoring, dashboard, scraper, and billing tests pass.

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

