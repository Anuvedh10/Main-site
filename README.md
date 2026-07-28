# Aurelia — backend

A real Express + PostgreSQL backend for the Aurelia dashboard, replacing
the old localStorage-only demo. Now:

- All accounts, the profile, and the project list live in a shared Postgres
  database — every visitor sees the same data, on any device.
- Only **admins** can edit the profile or add/remove projects. This is
  enforced by the server (JWT + a role check on every write), not just by
  hiding buttons in the UI.
- New public signups always get a read-only **user** account. Admin
  accounts are created by promoting a row directly in the database (see
  below) — there is no public signup path to admin.

## Project structure

```
src/
  server.js          Express app entrypoint, serves the API + the frontend
  db.js              Postgres connection, schema creation, demo seed data
  middleware/auth.js JWT verification + admin check
  routes/auth.js      POST /api/auth/signup, /login, GET /api/auth/me
  routes/profile.js   GET/PUT /api/profile
  routes/projects.js  GET/POST /api/projects, DELETE /api/projects/:id
public/               Your original frontend (unchanged look & pages),
                      with data.js replaced by api.js which talks to the
                      API above instead of localStorage
```

## Run it locally

1. Install Postgres and create a database, e.g. `aurelia`.
2. `cp .env.example .env` and fill in `DATABASE_URL` and `JWT_SECRET`
   (the example file explains both).
3. `npm install`
4. `npm start`
5. Open `http://localhost:3000`

The server auto-creates its tables and seeds two demo accounts on first
boot:

| username | password (default, override via env) | role  |
|----------|----------------------------------------|-------|
| guest    | guest123 (`SEED_GUEST_PASSWORD`)        | user  |
| admin    | admin123 (`SEED_ADMIN_PASSWORD`)        | admin |

**Change or remove these once you have real accounts.**

## Deploy on Render (GitHub)

1. Push this folder to a GitHub repo.
2. In Render, choose **New > Blueprint** and point it at the repo —
   `render.yaml` is already set up to create both the web service and a
   free Postgres database, and wires `DATABASE_URL` between them
   automatically.
   - If you'd rather not use the Blueprint, create the two manually:
     a **Postgres** instance and a **Web Service** (`npm install` /
     `npm start`), then set `DATABASE_URL` on the web service to the
     Postgres instance's *Internal Connection String*, and set a
     `JWT_SECRET` to any long random value.
3. Once deployed, log in with the seeded `admin` account, go to
   **Settings**, and:
   - Update the shared profile.
   - Add/remove projects.
   - Change the admin password to something private (there's no "change
     password" UI yet — for now that means either signing up a new user
     and promoting it to admin in the database, then removing the old
     admin row, or updating `SEED_ADMIN_PASSWORD` before the *first*
     deploy so the seed uses your own password from the start).

### Promoting a user to admin

There's no UI for this on purpose (keeps the public signup path
read-only-only). Run this against your database — Render's dashboard has
a **Connect > psql / Shell** option under your Postgres instance:

```sql
UPDATE users SET role = 'admin' WHERE username = 'their_username';
```

## API summary

| Method | Path                | Auth        | Description                        |
|--------|---------------------|-------------|-------------------------------------|
| POST   | /api/auth/signup     | —           | Create a `user` account             |
| POST   | /api/auth/login       | —           | Get a JWT                           |
| GET    | /api/auth/me          | any user    | Current user info                   |
| GET    | /api/profile          | any user    | Shared profile                      |
| PUT    | /api/profile          | admin       | Update shared profile               |
| GET    | /api/projects         | any user    | List projects                       |
| POST   | /api/projects         | admin       | Add a project                       |
| DELETE | /api/projects/:id     | admin       | Remove a project                    |

Send the JWT as `Authorization: Bearer <token>`.

## Notes / things you may want to add next

- **Password reset** — there's no email/reset flow yet.
- **HTTPS** — Render terminates TLS for you automatically, so this is
  covered once deployed.
- **Rate limiting** on `/api/auth/login` and `/signup` would be a good
  next hardening step if this becomes public-facing at scale.
