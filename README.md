# Piggie Diaries

A weight tracker for guinea pigs. Log weights for each pig, view trends over time, compare all your pigs on one chart, check whether a food is safe to feed them, and keep photos of each one.

## Features

- Per-pig weight log with a chart of the trend over time
- Overview page comparing every pig's weight on one combined chart
- Food safety search — checks a curated list of common foods against what's safe, in moderation, or unsafe for guinea pigs
- Profile picture and photo gallery per pig (HEIC photos from iPhone are converted to JPEG automatically)
- Accounts are private — each user only sees and manages their own pigs

## Tech stack

- **Frontend**: React, Vite, React Router, D3 (charts)
- **Backend**: Node.js, Express, MongoDB/Mongoose
- **Auth**: JWT, bcrypt-hashed passwords

## Project structure

```
backend-rest/    REST API
frontend-react/  React app
```

## Running locally

### Backend

```bash
cd backend-rest
npm install
cp .env.example .env
```

Fill in `.env` with your own MongoDB connection string and a random JWT secret.

```bash
npm start
```

Runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Runs on `http://localhost:5173`.

Once both are running, open the frontend URL and register an account to get started.

## Running with Docker

```bash
docker compose up --build
```

Starts both services together, on the same ports as above. You still need `backend-rest/.env` set up with your own MongoDB connection string and JWT secret first — Docker doesn't create that for you, it just reads it at startup.
