# 💪 GymLog

A modern, full-stack workout tracking SaaS application. Track your lifts — nothing else.

## Tech Stack

| Layer     | Technology                                                         |
| --------- | ------------------------------------------------------------------ |
| Frontend  | React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion       |
| Backend   | Node.js · Express 5 · TypeScript · Mongoose · Zod                 |
| Database  | MongoDB Atlas                                                      |
| Auth      | JWT (access + refresh tokens in httpOnly cookies)                  |
| Monitoring| Sentry                                                             |
| Deploy    | Vercel (Frontend SPA + Serverless Backend)                         |

## Project Structure

```
gym-log/
├── frontend/          # React + Vite SPA
│   ├── src/
│   ├── netlify.toml   # Netlify deploy config
│   └── package.json
├── backend/           # Express REST API
│   ├── src/
│   └── package.json
└── docs/              # Documentation
```

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster)

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/NiteshNadar/GymLog.git
cd GymLog
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env      # Fill in your secrets
npm install
npm run dev                # Starts on http://localhost:5001
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env       # Set VITE_API_BASE_URL
npm install
npm run dev                # Starts on http://localhost:5173
```

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Required | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `NODE_ENV`            | ✅       | `development` / `production`         |
| `PORT`                | ✅       | Server port (default: `5001`)        |
| `MONGODB_URI`         | ✅       | MongoDB connection string            |
| `JWT_ACCESS_SECRET`   | ✅       | Min 32 chars, hex recommended        |
| `JWT_REFRESH_SECRET`  | ✅       | Min 32 chars, hex recommended        |
| `CLIENT_URL`          | ✅       | Frontend URL for CORS                |
| `CORS_ORIGINS`        | ✅       | Comma-separated allowed origins      |
| `ENCRYPTION_KEY`      | ✅       | Exactly 64 hex chars                 |
| `SENTRY_DSN`          | ❌       | Sentry error tracking DSN            |

### Frontend (`frontend/.env`)

| Variable               | Required | Description                       |
| ---------------------- | -------- | --------------------------------- |
| `VITE_API_BASE_URL`    | ✅       | Backend API URL                   |
| `VITE_GOOGLE_CLIENT_ID`| ❌       | Google OAuth client ID            |

### Unified Deployment → [Vercel](https://vercel.com)

1. Import your GitHub repo on [vercel.com/new](https://vercel.com/new)
2. Leave **Root Directory** as `/`
3. Expand **Build and Output Settings**:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install && cd backend && npm install`
4. Add all environment variables from both the frontend and backend tables above.
   - For `VITE_API_BASE_URL`, set it to `/api` (this avoids CORS issues completely).
5. Deploy! Vercel will build the React frontend and automatically deploy the Express backend as Serverless Functions via `api/index.ts`.

## Available Scripts

### Backend

| Script          | Description                    |
| --------------- | ------------------------------ |
| `npm run dev`   | Dev server with hot reload     |
| `npm run build` | Compile TypeScript → `dist/`   |
| `npm start`     | Run compiled production build  |

### Frontend

| Script            | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Vite dev server              |
| `npm run build`   | Production build → `dist/`   |
| `npm run preview` | Preview production build     |

## License

Private — All rights reserved.
