import express from "express";
import { pool } from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ensure uploads dir exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const userId = req.body.userId || "anon";
    cb(null, `avatar_${userId}_${timestamp}${ext}`);
  },
});
const upload = multer({ storage });

// GET profile by id
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [userResults] = await pool.query(
      "SELECT id, name, email, nickname, bio, avatar_url, created_at FROM users WHERE id = ?",
      [id]
    );
    if (!userResults.length) return res.status(404).json({ message: "User not found" });
    const user = userResults[0];

    const [[friendsCountRes]] = await pool.query(
      "SELECT COUNT(*) AS count FROM friends WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'",
      [id, id]
    );

    const [pendingRes] = await pool.query(
      `SELECT f.id AS request_id, f.user_id AS requester_id, u.name AS requester_name, u.avatar_url
       FROM friends f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = ? AND f.status = 'pending'`,
      [id]
    );

    res.json({
      user,
      friendsCount: friendsCountRes.count,
      pendingRequests: pendingRes || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// PUT update profile
router.put("/", async (req, res) => {
  const { userId, name, nickname, bio } = req.body;
  if (!userId) return res.status(400).json({ message: "userId required" });

  try {
    await pool.query(
      "UPDATE users SET name = ?, nickname = ?, bio = ? WHERE id = ?",
      [name || null, nickname || null, bio || null, userId]
    );
    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST upload avatar
router.post("/upload", upload.single("avatar"), async (req, res) => {
  const userId = req.body.userId;
  if (!userId || !req.file) return res.status(400).json({ message: "Missing userId or file" });

  const avatarUrl = `/uploads/${req.file.filename}`;
  try {
    await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, userId]);
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;
