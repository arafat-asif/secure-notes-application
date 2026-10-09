# Secure Note-Taking Application

Interview task implementation using:
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing
- React + Vite frontend

## Requirements covered

- USER: CRUD own notes
- ADMIN: all user capabilities + user management + view all notes
- JWT auth + role authorization
- Pagination for list endpoints
- Explicit `schema.index()` definitions
- Exactly one `User.aggregate()` call for grouping users by interests
- A single aggregation pipeline containing `$lookup` for user posts
- Minimal indexes only for required query paths

## Run backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

MongoDB must be running locally, or set `MONGODB_URI` to MongoDB Atlas.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` if the backend is not running on `http://localhost:5000/api`.

## First admin

Register normally, then promote a user in MongoDB:

```js
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "ADMIN" } }
)
```

## API

Auth:
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

Notes:
- GET `/api/notes?page=1&limit=10`
- GET `/api/notes/:id`
- POST `/api/notes`
- PUT `/api/notes/:id`
- DELETE `/api/notes/:id`

Admin users:
- GET `/api/users?page=1&limit=10`
- GET `/api/users/:id`
- POST `/api/users`
- PUT `/api/users/:id`
- DELETE `/api/users/:id`
- GET `/api/users/by-interests?page=1&limit=20`

Posts:
- POST `/api/posts`
- GET `/api/posts?page=1&limit=10`
- GET `/api/posts/user/:userId`

All protected endpoints require:

`Authorization: Bearer <JWT>`

## Deployment

Backend can be deployed as a Node service on Render.
Frontend can be deployed on Vercel/Netlify.
MongoDB can be hosted on MongoDB Atlas.

Do not commit `.env`.
