# AI Realtor

Production-ready MERN/MVC project foundation.

## Setup

```bash
npm install
npm run install:all
```

Create environment files from the examples:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5001/api/health

## Tests

```bash
npm run test
npm run test:backend
npm run test:frontend
```

## Production

```bash
npm run build
npm run start
```
