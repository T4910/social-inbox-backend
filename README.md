# Multi-Organization Social Task & User Management Platform

## Overview

This project is a modern, full-stack platform for managing users, roles, permissions, and tasks across multiple organizations. It features robust role-based access control (RBAC), multi-tenancy, and modern authentication (including Google OAuth). The stack includes a Hono.js backend (TypeScript, Prisma, PostgreSQL) and a Next.js frontend (React, TanStack Query, Tailwind CSS).

## Features

- Multi-organization support (users, roles, tasks, invites, org switching)
- Role-based access control (RBAC) for all sensitive actions and views
- User management (overview, profile, edit, delete, invite)
- Task management (CRUD, assignment, status, priority)
- Authentication (email/password, Google OAuth)
- Profile & account settings (edit info, password, avatar)

## Prerequisites

- Node.js (v18+ recommended)
- pnpm (recommended) or npm
- PostgreSQL database (for production)

## Getting Started

### 1. Clone the repository

```sh
# In your terminal
cd path/to/your/projects
# (Clone or copy the repo here)
git clone https://github.com/t4910/social-inbox-frontend.git frontend
git clone https://github.com/t4910/social-inbox-backend.git backend 
```

### 2. Install dependencies

#### Backend

```sh
cd backend
pnpm install # or npm install
```

#### Frontend

```sh
cd ../frontend
pnpm install # or npm install
```

### 3. Configure environment variables

- Copy `.env.example` to `.env` in the `frontend` and `.env` & `.dev.vars` in the `backend` if present, and fill in the required values (database URL, JWT secret, etc).

### 4. Run database synchronization (backend)

```sh
cd backend
pnpm db:push # or npm run db:push
```

### 5. Start the development servers

#### Backend

```sh
cd backend
pnpm run dev # or npm run dev
```

#### Frontend

```sh
cd frontend
pnpm run dev # or npm run dev
```

- The frontend will be available at http://localhost:3000
- The backend will be available at http://127.0.0.1:8787 (or as configured)

## Deployment

- To build and deploy the backend:

```sh
cd backend
pnpm run deploy # or npm run deploy
```

- To build and deploy the frontend:

```sh
cd frontend
pnpm run build
pnpm run start
```

## Additional Notes

- For Google OAuth, set up credentials in your Google Cloud Console and update your `.env` & `dev.vars` files accordingly.
- For more details on architecture, see the code comments and documentation in each folder.

---

Feel free to open issues or contribute!
