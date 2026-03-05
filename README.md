# Paws & Hearts - Local Backend

This project now includes a simple Node + Express backend with SQLite and server sessions.

## Setup
1. Install dependencies:
   npm install

2. Start the server (dev with nodemon):
   npm run dev

3. Open http://localhost:3000 in your browser.

## Admin user (seeded)
- Email: martinminevv@gmail.com
- Password: parola1

## Notes
- Sessions are handled with `express-session` and stored in `sessions.sqlite` (via `connect-sqlite3`).
- User passwords are hashed using `bcrypt`.
- The backend serves your existing static files; API endpoints are namespaced under `/api/*`.

API endpoints:
- POST /api/signup
- POST /api/login
- POST /api/logout
- GET /api/me
- GET /api/animals
- POST /api/animals (admin)
- PUT /api/animals/:id (admin)
- DELETE /api/animals/:id (admin)

If you'd like, I can add automatic database backups, stronger validation, or switch the session store to Redis for production.