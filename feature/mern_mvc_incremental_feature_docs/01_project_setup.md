# 01 — Project Setup

## Feature name

Production-ready MERN/MVC project foundation.



## Objective

Create the base project structure for a MERN application using MVC architecture, with backend, frontend, environment setup, database connection, health-check API, logging, centralized errors, and test setup.

## Scope of work

Only implement the foundation. Do not implement authentication, users, billing, property analyzer, inspections, reports, scraping, or AI features yet.

## Files/folders to create

```text
project-root/
  package.json
  .gitignore
  README.md
  .env.example
  backend/
    package.json
    .env.example
    src/
      app.js
      server.js
      config/env.js
      config/db.js
      controllers/health.controller.js
      routes/index.js
      routes/health.routes.js
      middlewares/error.middleware.js
      middlewares/notFound.middleware.js
      middlewares/requestLogger.middleware.js
      utils/ApiError.js
      utils/asyncHandler.js
      utils/logger.js
      utils/sendResponse.js
      tests/setup.js
      tests/health.test.js
  frontend/
    package.json
    .env.example
    index.html
    vite.config.js
    src/main.jsx
    src/App.jsx
    src/routes/AppRoutes.jsx
    src/pages/HomePage.jsx
    src/pages/NotFoundPage.jsx
    src/components/Layout.jsx
    src/services/apiClient.js
    src/styles/index.css
    src/tests/setup.js
    src/tests/smoke.test.jsx
```

## Files/folders to modify

```text
None
```

## Backend implementation instructions

1. Configure root `package.json` with scripts:
   - `install:all`: install backend and frontend dependencies.
   - `dev`: run backend and frontend concurrently.
   - `test`: run backend and frontend tests.
   - `test:backend`, `test:frontend`.
2. Backend dependencies: express, mongoose, dotenv, cors, helmet, morgan, compression, cookie-parser, express-rate-limit, zod.
3. Backend dev/test dependencies: nodemon, jest, supertest, mongodb-memory-server.
4. Create `src/config/env.js`.
   - Required variables: `NODE_ENV`, `PORT`, `MONGO_URI`, `CLIENT_URL`.
   - Validate at startup.
   - Throw an explicit error naming missing variables.
5. Create `src/config/db.js`.
   - Export `connectDB`.
   - Use Mongoose.
   - Use `serverSelectionTimeoutMS: 10000`.
   - Log successful connection.
6. Create `src/app.js`.
   - Apply helmet, cors with `CLIENT_URL`, compression, cookieParser, JSON parser `2mb`, URL encoded parser, request logger, routes, not-found middleware, and error middleware.
7. Create `src/server.js`.
   - Connect DB before listening.
   - Gracefully handle `SIGINT` and `SIGTERM`.
8. Implement `GET /api/health`.
   - Return `success: true`, service name, environment, timestamp.
9. Implement centralized error handling:
   - `ApiError(statusCode, message, details)`.
   - `asyncHandler`.
   - `notFound.middleware`.
   - `error.middleware`.
   - Hide stack trace in production.
10. Add basic logger utility wrapping console with info/warn/error methods.

## Frontend implementation instructions

1. Create Vite React frontend.
2. Configure Axios in `src/services/apiClient.js`.
   - `baseURL = import.meta.env.VITE_API_URL`.
   - `withCredentials = true`.
3. Add `Layout` with a header and main content.
4. Add routes:
   - `/` -> HomePage.
   - `*` -> NotFoundPage.
5. HomePage must show app name and a simple running message.
6. Styling should be clean and minimal.

## Database/model changes

No models yet. Only database connection is required.

## API routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Verify API is running |

## Controllers/services/middlewares required

- `health.controller.js`
- `health.routes.js`
- `error.middleware.js`
- `notFound.middleware.js`
- `requestLogger.middleware.js`
- `ApiError.js`
- `asyncHandler.js`
- `logger.js`
- `sendResponse.js`

## Validation rules

- JSON body size must be limited to `2mb`.
- Environment variables must be validated at startup.

## Security requirements

- Use Helmet.
- CORS must allow only `CLIENT_URL`.
- Do not expose stack traces in production.
- Do not hardcode secrets.

## Error handling requirements

- Unknown routes return `404`.
- App errors use one JSON format:
  - `success: false`
  - `message`
  - `details`
  - `stack` only outside production.
- Startup must fail if required env variables are missing.

## Test cases to write

1. `GET /api/health` returns 200.
2. Health response includes `success: true`.
3. Health response includes service name.
4. Unknown route returns 404.
5. Error response follows standard format.
6. Frontend renders app name.
7. Frontend unknown route renders NotFoundPage.

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

Backend, frontend, MongoDB connection, health check, logging, centralized errors, and tests all work.

## What the user/developer should see after running the app

- `http://localhost:5173` shows the home page.
- `http://localhost:5001/api/health` returns healthy JSON.

## Regression check instructions to ensure previous features are not broken

This is the first feature, so there are no previous production features to verify. Still run all setup tests after implementation.

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

