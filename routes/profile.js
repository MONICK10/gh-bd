import express from "express";
import { db } from "../db.js";
import { collection, doc, getDocs, getDoc, updateDoc, query, where } from "firebase/firestore";
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
    // Get user document
    const userDoc = await getDoc(doc(db, "users", id));
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = {
      id: userDoc.id,
      name: userDoc.data().name,
      email: userDoc.data().email,
      nickname: userDoc.data().nickname || null,
      bio: userDoc.data().bio || null,
      avatar_url: userDoc.data().avatar_url || null,
      created_at: userDoc.data().createdAt
    };

    // Count friends
    const friendsRef = collection(db, "friends");
    const q1 = query(friendsRef, where("user_id", "==", id), where("status", "==", "accepted"));
    const q2 = query(friendsRef, where("friend_id", "==", id), where("status", "==", "accepted"));
    
    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const friendsCount = snapshot1.size + snapshot2.size;

    // Get pending friend requests
    const pendingQuery = query(friendsRef, where("friend_id", "==", id), where("status", "==", "pending"));
    const pendingSnapshot = await getDocs(pendingQuery);
    
    const pendingRequests = await Promise.all(
      pendingSnapshot.docs.map(async (friendDoc) => {
        const requesterId = friendDoc.data().user_id;
        const requesterDoc = await getDoc(doc(db, "users", requesterId));
        return {
          request_id: friendDoc.id,
          requester_id: requesterId,
          requester_name: requesterDoc.data().name,
          avatar_url: requesterDoc.data().avatar_url || null
        };
      })
    );

    res.json({
      user,
      friendsCount,
      pendingRequests,
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
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      name: name || null,
      nickname: nickname || null,
      bio: bio || null,
      updatedAt: new Date()
    });
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
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      avatar_url: avatarUrl,
      updatedAt: new Date()
    });
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;
