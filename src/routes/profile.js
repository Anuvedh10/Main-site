const express = require("express");
const { query } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/profile - any logged-in user (admin or read-only) can view it
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`SELECT name, role, bio FROM profile WHERE id = 1`);
    res.json({ profile: rows[0] });
  } catch (err) {
    console.error("get profile error:", err);
    res.status(500).json({ error: "Could not load profile." });
  }
});

// PUT /api/profile - admin only
router.put("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const name = (req.body.name || "").trim() || "Admin User";
    const role = (req.body.role || "").trim() || "Workspace Owner";
    const bio = (req.body.bio || "").trim();

    const { rows } = await query(
      `UPDATE profile SET name = $1, role = $2, bio = $3 WHERE id = 1
       RETURNING name, role, bio`,
      [name, role, bio]
    );
    res.json({ profile: rows[0] });
  } catch (err) {
    console.error("update profile error:", err);
    res.status(500).json({ error: "Could not save profile." });
  }
});

module.exports = router;
