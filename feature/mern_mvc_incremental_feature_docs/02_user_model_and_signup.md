# 02 — User Model and Signup

## Feature name

User model and secure signup.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Create the User model and signup flow with strict validation, password hashing, duplicate email handling, and safe responses.

## Scope of work

Implement signup only. Do not implement login, refresh tokens, email verification sending, password reset, Google OAuth, billing, or RBAC management yet.

## Files/folders to create

```text
backend/src/models/User.js
backend/src/validators/auth.validator.js
backend/src/controllers/auth.controller.js
backend/src/services/auth.service.js
backend/src/services/password.service.js
backend/src/routes/auth.routes.js
backend/src/tests/auth.signup.test.js
frontend/src/pages/auth/SignupPage.jsx
frontend/src/services/authApi.js
frontend/src/components/forms/TextInput.jsx
frontend/src/components/ui/FormError.jsx
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
```

## Backend implementation instructions

1. Create `User` model with email, passwordHash, name, role, status, emailVerification, passwordReset, authProviders.google, subscription, companyBranding, settings, lastLoginAt, gdpr, timestamps.
2. Role enum must be `admin`, `sub_admin`, `user`; default `user`.
3. Status enum must be `active`, `disabled`, `deleted`; default `active`.
4. Add case-insensitive unique index for email.
5. Create Zod signup schema:
   - name: 2–80 chars.
   - email: valid email, lowercase.
   - password: 10–128 chars.
   - password must contain lowercase, uppercase, number, special character.
   - reject unknown fields.
6. Hash passwords with bcrypt salt rounds 12.
7. `auth.service.signup` must check duplicate email, hash password, create user, and return safe user without token/password fields.
8. `POST /api/auth/signup` returns `201`.

## Frontend implementation instructions

1. Create `/signup`.
2. Fields: name, email, password.
3. Show inline field errors.
4. Disable submit during request.
5. On success show: `Account created successfully.`
6. Do not auto-login yet.

## Database/model changes

Create `User` collection.

## API routes

| POST | `/api/auth/signup` | Public | Create user account |

## Controllers/services/middlewares required

- auth controller
- auth service
- password service
- auth validator

## Validation rules

- email valid and unique
- name 2–80
- password 10–128 and strong
- reject unknown fields

## Security requirements

- Never return passwordHash.
- Never log passwords.
- Duplicate email uses 409 and safe message.
- Store bcrypt hashes only.

## Error handling requirements

- Validation returns 400.
- Duplicate email returns 409.
- DB errors flow through central error middleware.

## Test cases to write

1. Valid signup succeeds.
2. Role defaults to user.
3. Password is hashed.
4. Response excludes passwordHash.
5. Duplicate email returns 409.
6. Invalid email returns 400.
7. Weak password returns 400.
8. Missing name returns 400.
9. Case-insensitive duplicate rejected.

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

Users can create accounts securely.

## What the user/developer should see after running the app

`/signup` displays a working signup form and creates a user.

## Regression check instructions to ensure previous features are not broken

Health endpoint and setup tests must still pass before and after signup implementation.

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

