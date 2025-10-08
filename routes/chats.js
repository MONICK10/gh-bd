import express from "express";
import { db } from "../db.js";
import { collection, doc, getDocs, addDoc, query, where, orderBy, getDoc } from "firebase/firestore";

const router = express.Router();

// GET chats for a specific user
router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Get user info first
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }
    const userName = userDoc.data().name;

    // Get chats for the user
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("user_id", "==", userId), orderBy("created_at", "asc"));
    const querySnapshot = await getDocs(q);
    
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      content: doc.data().content,
      created_at: doc.data().created_at,
      name: userName
    }));

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
    const chatsRef = collection(db, "chats");
    await addDoc(chatsRef, {
      user_id: userId,
      content,
      created_at: new Date()
    });
    
    res.status(201).json({ message: "Post added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;
