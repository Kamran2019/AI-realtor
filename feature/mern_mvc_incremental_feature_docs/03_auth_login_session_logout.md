# 03 — Login, Session, Refresh Token, and Logout

## Feature name

Login, access token, refresh cookie, current user, and logout.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Implement secure login and session management with JWT access tokens and hashed refresh tokens stored through httpOnly cookies.

## Scope of work

Implement login/session/logout only. Do not implement password reset or role management here.

## Files/folders to create

```text
backend/src/services/token.service.js
backend/src/middlewares/auth.middleware.js
backend/src/tests/auth.login-session.test.js
frontend/src/pages/auth/LoginPage.jsx
frontend/src/context/AuthContext.jsx
frontend/src/components/routes/ProtectedRoute.jsx
frontend/src/pages/DashboardPage.jsx
```

## Files/folders to modify

```text
backend/src/config/env.js
backend/src/models/User.js
backend/src/controllers/auth.controller.js
backend/src/services/auth.service.js
backend/src/routes/auth.routes.js
frontend/src/services/authApi.js
frontend/src/services/apiClient.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
```

## Backend implementation instructions

1. Add env vars: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, COOKIE_SECURE.
2. Add `auth.refreshTokenHash` to User.
3. Create token service with sign/verify access and refresh tokens.
4. Login must validate email/password, reject disabled/deleted users, compare bcrypt password, update lastLoginAt, store SHA-256 hash of refresh token, and set refresh token cookie.
5. Access token payload includes `sub`, `role`, `email`.
6. Refresh endpoint verifies cookie token, compares DB hash, and returns new access token.
7. Logout clears DB refresh hash when possible and clears cookie.
8. `GET /api/auth/me` uses auth middleware and returns safe user.

## Frontend implementation instructions

1. Create `/login`.
2. Add AuthContext with user, accessToken, login, logout, refresh, loadMe.
3. Keep access token in memory/context only.
4. Axios adds Authorization header.
5. On 401, try refresh once, then retry original request.
6. Add protected `/dashboard`.

## Database/model changes

Modify `User` to include `auth.refreshTokenHash`.

## API routes

| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Public/Cookie | Logout |
| GET | `/api/auth/me` | Authenticated | Current user |

## Controllers/services/middlewares required

- token service
- auth middleware
- auth controller login/refresh/logout/me

## Validation rules

- login email valid
- password required max 128
- reject unknown fields

## Security requirements

- Refresh token only in httpOnly cookie.
- Store only refresh token hash.
- Access token not in localStorage.
- Generic invalid login message.

## Error handling requirements

- Invalid login returns 401.
- Disabled account returns 403.
- Invalid refresh clears cookie and returns 401.

## Test cases to write

1. Valid login returns access token.
2. Wrong password returns 401.
3. Unknown email returns 401.
4. Disabled user returns 403.
5. Me works with token.
6. Refresh works with cookie.
7. Logout clears cookie/hash.
8. Response excludes passwordHash.

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

Users can log in, remain authenticated via refresh, access protected routes, and log out.

## What the user/developer should see after running the app

`/login` works and redirects to `/dashboard`; logout returns to login.

## Regression check instructions to ensure previous features are not broken

Signup and setup tests must still pass.

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

