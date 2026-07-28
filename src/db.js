const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Render's managed Postgres requires SSL. Local Postgres (e.g. during
// development) usually doesn't, so we only force it when NODE_ENV=production
// or the connection string points at a non-local host.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.PGSSL === "false"
      ? false
      : { rejectUnauthorized: false },
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT NOT NULL DEFAULT 'Admin User',
      role TEXT NOT NULL DEFAULT 'Workspace Owner',
      bio TEXT NOT NULL DEFAULT '',
      CONSTRAINT single_row CHECK (id = 1)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      tag TEXT NOT NULL DEFAULT 'Project',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Make sure the single shared profile row exists.
  await query(`
    INSERT INTO profile (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING;
  `);
}

// Seeds two demo accounts on first boot, same as the old localStorage demo:
//   guest / guest123  -> role: user  (read-only)
//   admin / admin123  -> role: admin (full access)
// Passwords can (and should) be overridden via env vars, and you should
// change/remove these once real accounts exist.
async function seedDemoUsers() {
  const guestPassword = process.env.SEED_GUEST_PASSWORD || "guest123";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const { rows: existing } = await query(`SELECT username FROM users`);
  const usernames = new Set(existing.map((u) => u.username));

  if (!usernames.has("guest")) {
    const hash = await bcrypt.hash(guestPassword, 10);
    await query(
      `INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      ["guest", hash, "Guest User", "user"]
    );
    console.log("Seeded demo account: guest / (see SEED_GUEST_PASSWORD)");
  }

  if (!usernames.has("admin")) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await query(
      `INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      ["admin", hash, "Admin", "admin"]
    );
    console.log("Seeded demo account: admin / (see SEED_ADMIN_PASSWORD)");
  }
}

module.exports = { pool, query, initSchema, seedDemoUsers };
