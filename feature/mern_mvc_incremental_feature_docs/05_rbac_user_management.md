# 05 — RBAC and User Management

## Feature name

Admin/sub_admin/user roles and user management.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Implement role-based authorization and admin user management for the three-role system.

## Scope of work

Add RBAC middleware and user management only. No billing or property features yet.

## Files/folders to create

```text
backend/src/middlewares/rbac.middleware.js
backend/src/validators/user.validator.js
backend/src/controllers/user.controller.js
backend/src/services/user.service.js
backend/src/routes/user.routes.js
backend/src/tests/rbac-user-management.test.js
frontend/src/pages/admin/UsersPage.jsx
frontend/src/pages/admin/UserFormPage.jsx
frontend/src/components/routes/RoleRoute.jsx
frontend/src/services/userApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
```

## Backend implementation instructions

1. Create `requireRoles(...roles)`.
2. Permission rules:
   - admin: full user management.
   - sub_admin: read-only user list/detail.
   - user: no user management.
3. Implement user APIs: list, detail, create, update, status.
4. Admin can create only sub_admin or user, not admin.
5. Prevent self-disable.
6. Prevent disabling/downgrading the only active admin.
7. All responses use safe user object.

## Frontend implementation instructions

1. Add `/admin/users`.
2. Show user table with search/filter.
3. Admin can create/edit/disable users.
4. Sub_admin can see read-only list.
5. User cannot see admin nav.

## Database/model changes

Use existing User model.

## API routes

| GET | `/api/users` | admin, sub_admin | List users |
| GET | `/api/users/:id` | admin, sub_admin | Detail |
| POST | `/api/users` | admin | Create user |
| PATCH | `/api/users/:id` | admin | Update user |
| PATCH | `/api/users/:id/status` | admin | Enable/disable |

## Controllers/services/middlewares required

- RBAC middleware
- user controller
- user service
- user validator

## Validation rules

- create: name, email, password, role sub_admin/user
- update: name optional, role optional sub_admin/user, status active/disabled
- page >= 1, limit 1–100

## Security requirements

- All routes authenticated.
- Admin required for mutations.
- Never return token/password hashes.
- Prevent last admin removal.

## Error handling requirements

- Unauthorized 401.
- Forbidden 403.
- Invalid ID 400.
- Duplicate email 409.

## Test cases to write

1. Admin lists users.
2. Sub_admin lists users.
3. User forbidden.
4. Admin creates sub_admin/user.
5. Admin cannot create admin.
6. Sub_admin cannot create.
7. Self-disable blocked.
8. Response excludes hashes.

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

Admin can manage sub_admin and user accounts safely.

## What the user/developer should see after running the app

Admin user table works; non-admin access is blocked.

## Regression check instructions to ensure previous features are not broken

Auth, email reset, signup, login, and setup tests must pass.

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

