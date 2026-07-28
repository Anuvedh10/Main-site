const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { signToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

function toSafeUser(row) {
  return { id: row.id, username: row.username, name: row.name, role: row.role };
}

// POST /api/auth/signup
// Public signup always creates a role:"user" (read-only) account, same
// as the old client-side app. Admin accounts are created by promoting a
// user directly in the database - there's no public path to admin.
router.post("/signup", async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const name = (req.body.name || "").trim();
    const password = req.body.password || "";

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const { rows: existing } = await query(
      `SELECT id FROM users WHERE lower(username) = lower($1)`,
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "That username is already taken." });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (username, password_hash, name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, name, role`,
      [username, hash, name || username]
    );

    const user = toSafeUser(rows[0]);
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ error: "Could not create account. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const { rows } = await query(
      `SELECT id, username, password_hash, name, role FROM users WHERE lower(username) = lower($1)`,
      [username]
    );
    const row = rows[0];
    if (!row) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = toSafeUser(row);
    res.json({ token: signToken(user), user });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Something went wrong signing in. Please try again." });
  }
});

// GET /api/auth/me - returns the current user based on the token
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, username, name, role FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found." });
    res.json({ user: toSafeUser(rows[0]) });
  } catch (err) {
    console.error("me error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
