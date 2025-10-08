import express from "express";
import bcrypt from "bcrypt";
import { db } from "../db.js";
import { collection, doc, getDocs, addDoc, query, where } from "firebase/firestore";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, department, batch } = req.body;

  if (!name || !email || !password || !department || !batch)
    return res.status(400).json({ message: "All fields are required" });

  try {
    // Check if email exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert new user
    await addDoc(usersRef, {
      name,
      email,
      password: hash,
      department,
      batch,
      createdAt: new Date()
    });

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
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(400).json({ message: "User not found" });
    }

    const userDoc = querySnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.json({ 
      message: "✅ Login successful!", 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        batch: user.batch, 
        department: user.department 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;
