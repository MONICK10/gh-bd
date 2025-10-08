import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET chats for a specific user
router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const [results] = await pool.query(
      "SELECT c.id, c.content, c.created_at, u.name FROM chats c JOIN users u ON c.user_id = u.id WHERE c.user_id = ? ORDER BY c.created_at ASC",
      [userId]
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST a new chat message
router.post("/", async (req, res) => {
  const { userId, content } = req.body;

  if (!userId || !content?.trim()) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    await pool.query(
      "INSERT INTO chats (user_id, content, created_at) VALUES (?, ?, NOW())",
      [userId, content]
    );
    res.status(201).json({ message: "Post added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;
