// discussions.js
import express from "express";
import multer from "multer";
import path from "path";
import { db } from "../db.js";
import { collection, doc, getDocs, addDoc, getDoc, query, where, orderBy, updateDoc, increment } from "firebase/firestore";

const router = express.Router();

// --- Multer storage for file uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ---------------- POST a Discussion ----------------
router.post("/", upload.single("file"), async (req, res) => {
  const { user_id, batch, department, content, is_public } = req.body;
  const file_path = req.file ? req.file.filename : null;

  if (!user_id || !content) {
    return res.status(400).json({ success: false, message: "Missing user_id or content" });
  }

  try {
    const discussionsRef = collection(db, "discussions");
    const docRef = await addDoc(discussionsRef, {
      user_id,
      batch: batch || null,
      department: department || null,
      content,
      file_path,
      is_public: is_public === "true" || is_public === true,
      created_at: new Date()
    });
    res.json({ success: true, id: docRef.id });
  } catch(err) {
    console.error("POST /discussions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- GET class posts ----------------
router.get("/", async (req, res) => {
  const { batch, department } = req.query;

  if (!batch || !department) {
    return res.status(400).json({ success: false, message: "Missing batch or department" });
  }

  try {
    const discussionsRef = collection(db, "discussions");
    const q = query(
      discussionsRef,
      where("batch", "==", batch),
      where("department", "==", department),
      orderBy("created_at", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const rows = await Promise.all(
      querySnapshot.docs.map(async (discussionDoc) => {
        const discussionData = discussionDoc.data();
        const userDoc = await getDoc(doc(db, "users", discussionData.user_id));
        return {
          id: discussionDoc.id,
          ...discussionData,
          name: userDoc.data().name
        };
      })
    );
    
    res.json(rows);
  } catch(err) {
    console.error("GET /discussions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- GET department posts ----------------
router.get("/department/:dept", async (req, res) => {
  const department = req.params.dept;

  try {
    const discussionsRef = collection(db, "discussions");
    const q = query(
      discussionsRef,
      where("department", "==", department),
      orderBy("created_at", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const rows = await Promise.all(
      querySnapshot.docs.map(async (discussionDoc) => {
        const discussionData = discussionDoc.data();
        const userDoc = await getDoc(doc(db, "users", discussionData.user_id));
        return {
          id: discussionDoc.id,
          ...discussionData,
          name: userDoc.data().name
        };
      })
    );
    
    res.json(rows);
  } catch(err) {
    console.error("GET /department/:dept error:", err);
    res.status(500).json({ success: false });
  }
});

// ---------------- POST a department discussion ----------------
router.post("/department", upload.single("file"), async (req, res) => {
  const { user_id, department, content } = req.body;
  const file_path = req.file ? req.file.filename : null;

  if (!user_id || !department || !content) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const discussionsRef = collection(db, "discussions");
    const docRef = await addDoc(discussionsRef, {
      user_id,
      batch: null, // batch = null for department-level
      department,
      content,
      file_path,
      is_public: false,
      created_at: new Date()
    });
    res.json({ success: true, id: docRef.id });
  } catch(err) {
    console.error("POST /department error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- GET public posts ----------------
router.get("/public/all", async (req, res) => {
  try {
    const discussionsRef = collection(db, "discussions");
    const q = query(
      discussionsRef,
      where("is_public", "==", true),
      orderBy("created_at", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const rows = await Promise.all(
      querySnapshot.docs.map(async (discussionDoc) => {
        const discussionData = discussionDoc.data();
        const userDoc = await getDoc(doc(db, "users", discussionData.user_id));
        return {
          id: discussionDoc.id,
          ...discussionData,
          name: userDoc.data().name
        };
      })
    );
    
    res.json(rows);
  } catch(err) {
    console.error("GET /public/all error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- Likes & Replies ----------------
router.post('/:id/like', async (req, res) => {
  const postId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" });

  try {
    // Check if like already exists
    const likesRef = collection(db, "post_likes");
    const q = query(likesRef, where("post_id", "==", postId), where("user_id", "==", user_id));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Add new like
      await addDoc(likesRef, {
        post_id: postId,
        user_id,
        created_at: new Date()
      });
    }
    
    res.json({ success: true });
  } catch(err) {
    console.error("POST /:id/like error:", err);
    res.status(500).json({ success: false });
  }
});

router.get('/:id/likes', async (req, res) => {
  const postId = req.params.id;

  try {
    const likesRef = collection(db, "post_likes");
    const q = query(likesRef, where("post_id", "==", postId));
    const querySnapshot = await getDocs(q);
    
    res.json({ total: querySnapshot.size });
  } catch(err) {
    console.error("GET /:id/likes error:", err);
    res.status(500).json({ success: false });
  }
});

router.post('/:id/reply', upload.single('file'), async (req, res) => {
  const postId = req.params.id;
  const { user_id, content } = req.body;
  const file_path = req.file ? req.file.filename : null;

  if (!user_id || !content) return res.status(400).json({ success: false, message: "Missing user_id or content" });

  try {
    const repliesRef = collection(db, "post_replies");
    await addDoc(repliesRef, {
      post_id: postId,
      user_id,
      content,
      file_path,
      created_at: new Date()
    });
    res.json({ success: true });
  } catch(err) {
    console.error("POST /:id/reply error:", err);
    res.status(500).json({ success: false });
  }
});

router.get('/:id/replies', async (req, res) => {
  const postId = req.params.id;

  try {
    const repliesRef = collection(db, "post_replies");
    const q = query(
      repliesRef,
      where("post_id", "==", postId),
      orderBy("created_at", "asc")
    );
    const querySnapshot = await getDocs(q);
    
    const rows = await Promise.all(
      querySnapshot.docs.map(async (replyDoc) => {
        const replyData = replyDoc.data();
        const userDoc = await getDoc(doc(db, "users", replyData.user_id));
        return {
          id: replyDoc.id,
          ...replyData,
          name: userDoc.data().name
        };
      })
    );
    
    res.json(rows);
  } catch(err) {
    console.error("GET /:id/replies error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
