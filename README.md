# UniReserve (MERN)

A role-based reservation system for Saint Michael College of Caraga.

## Stack
- Node.js + Express + MongoDB (Mongoose)
- React + Vite + TailwindCSS
- JWT auth (access), refresh cookie, bcrypt passwords
- Multer uploads (covers), Nodemailer optional

## Getting Started
1. Backend
   ```sh
   cd server
   cp .env.example .env   # fill values
   npm install
   node server.js         # or npm run dev
   ```
2. Frontend
   ```sh
   cd client
   npm install
   npm run dev
   ```

## Environment (server/.env)
```
MONGO_URI=mongodb://localhost:27017/unireserve
JWT_SECRET=change-me
PORT=5000
CLIENT_URL=http://localhost:5173
EMAIL_USER=you@example.com
EMAIL_PASS=app-password
```

## Seed
`server/seed/seed.js` drops DB and seeds sample libraries/resources and a developer/librarian/student/personnel (password `admin123` in seed; change before real use). Run with `npm run seed` from `server`.

## Security Checklist before pushing to production
- Generate a strong `JWT_SECRET` and rotate any seeded passwords.
- Do **not** commit `.env` files; already ignored in `.gitignore`.
- Remove or change default seed credentials; set real librarian/developer accounts.
- Enable HTTPS and set proper CORS origins in `server/app.js` (`CLIENT_URL`).
- Consider enabling a firewall/IP allowlist for MongoDB.
- Set secure cookie flags if deployed on HTTPS (`refreshCookieOptions` in `utils/jwt.js`).
- Review upload handling (`uploads/`) and serve behind auth if needed.
- Run `npm audit` (both client/server) and patch if required.

## Scripts
- `npm run dev` (server) – start with nodemon
- `npm run seed` (server) – seed sample data
- `npm run dev` (client) – start Vite dev server

## Notes
- Admin/librarian only routes and returns; users cannot mark returns.
- Overdue cron runs hourly (and on boot) to mark overdue and create unpaid fines.
- Notifications are stored in Mongo; UI shows latest items.

