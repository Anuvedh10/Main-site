const express = require("express");
const crypto = require("crypto");
const { query } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/projects - any logged-in user can view the shared project list
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, title, description, link, tag, created_at AS "createdAt"
       FROM projects ORDER BY created_at DESC`
    );
    res.json({ projects: rows });
  } catch (err) {
    console.error("list projects error:", err);
    res.status(500).json({ error: "Could not load projects." });
  }
});

// POST /api/projects - admin only
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }
    const description = (req.body.description || "").trim();
    const link = (req.body.link || "").trim();
    const tag = (req.body.tag || "").trim() || "Project";
    const id = `proj_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const { rows } = await query(
      `INSERT INTO projects (id, title, description, link, tag)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, link, tag, created_at AS "createdAt"`,
      [id, title, description, link, tag]
    );
    res.status(201).json({ project: rows[0] });
  } catch (err) {
    console.error("create project error:", err);
    res.status(500).json({ error: "Could not save project." });
  }
});

// DELETE /api/projects/:id - admin only
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM projects WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error("delete project error:", err);
    res.status(500).json({ error: "Could not delete project." });
  }
});

module.exports = router;
