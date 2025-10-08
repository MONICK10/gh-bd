import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js"; // <-- pool exists

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, department, batch } = req.body;

  if (!name || !email || !password || !department || !batch)
    return res.status(400).json({ message: "All fields are required" });

  try {
    // Check if email exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert new user
    await pool.query(
      "INSERT INTO users (name, email, password, department, batch) VALUES (?, ?, ?, ?, ?)",
      [name, email, hash, department, batch]
    );

    res.status(201).json({ message: "✅ Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.json({ message: "✅ Login successful!", user: { id: user.id, name: user.name, email: user.email, batch: user.batch, department: user.department } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;
