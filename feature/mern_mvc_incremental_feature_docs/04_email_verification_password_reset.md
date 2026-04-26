# 04 — Email Verification and Password Reset

## Feature name

Email verification and forgot/reset password.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Implement secure one-time token flows for email verification and password reset using hashed expiring tokens and email service abstraction.

## Scope of work

Add verification and password reset only. Do not add Google OAuth or billing.

## Files/folders to create

```text
backend/src/services/email.service.js
backend/src/services/tokenHash.service.js
backend/src/templates/emails/verificationEmail.js
backend/src/templates/emails/passwordResetEmail.js
backend/src/tests/auth.email-reset.test.js
frontend/src/pages/auth/VerifyEmailPage.jsx
frontend/src/pages/auth/ForgotPasswordPage.jsx
frontend/src/pages/auth/ResetPasswordPage.jsx
```

## Files/folders to modify

```text
backend/src/config/env.js
backend/src/controllers/auth.controller.js
backend/src/services/auth.service.js
backend/src/routes/auth.routes.js
frontend/src/services/authApi.js
frontend/src/routes/AppRoutes.jsx
```

## Backend implementation instructions

1. Add SMTP and APP_BASE_URL env vars.
2. Create email service with nodemailer; mock in test environment.
3. Generate 32-byte random tokens and store SHA-256 hashes.
4. Signup must create verification token expiring in 24 hours and send email.
5. `resend-verification` always returns generic success.
6. `verify-email` hashes token, finds unexpired user, marks verified, clears token.
7. `forgot-password` always returns generic success and sends reset email if active account exists.
8. `reset-password` validates token, validates strong new password, updates passwordHash, clears reset fields, clears refresh hash.

## Frontend implementation instructions

1. Update signup success message to tell user to verify email.
2. Create `/verify-email?token=...`.
3. Create `/forgot-password`.
4. Create `/reset-password?token=...`.
5. Login page links to forgot password.

## Database/model changes

Use existing User emailVerification and passwordReset fields.

## API routes

| POST | `/api/auth/resend-verification` | Public | Resend verification |
| POST | `/api/auth/verify-email` | Public | Verify email |
| POST | `/api/auth/forgot-password` | Public | Request reset |
| POST | `/api/auth/reset-password` | Public | Reset password |

## Controllers/services/middlewares required

- email service
- token hash service
- auth controller methods

## Validation rules

- token required
- email valid
- reset password follows strong password policy
- reject unknown fields

## Security requirements

- Store only token hashes.
- Verification expires 24 hours.
- Reset expires 30 minutes.
- Do not reveal account existence.

## Error handling requirements

- Invalid/expired token returns 400.
- Email send failures return safe 500.
- Already verified returns success.

## Test cases to write

1. Signup creates verification hash.
2. Verify valid token works.
3. Invalid token fails.
4. Expired token fails.
5. Forgot password generic for unknown email.
6. Reset changes password.
7. Old password fails.
8. New password logs in.
9. Refresh hash cleared after reset.

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

Users can verify email and reset forgotten passwords securely.

## What the user/developer should see after running the app

Verification and reset pages show success/error states.

## Regression check instructions to ensure previous features are not broken

Signup, login, session, and setup tests must still pass.

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

