require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { initSchema, seedDemoUsers } = require("./db");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const projectsRoutes = require("./routes/projects");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectsRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- Static frontend (dashboard.html, index.html, etc.) ---
app.use(express.static(path.join(__dirname, "..", "public")));

// Any unknown non-API GET request -> fall back to the login page.
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

async function start() {
  try {
    await initSchema();
    await seedDemoUsers();
    app.listen(PORT, () => {
      console.log(`Aurelia server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
