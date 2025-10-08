import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chats.js";
import profileRoutes from "./routes/profile.js";
import multer from 'multer';
import path from 'path';
import discussionRoutes from "./routes/discussions.js";
import "./db.js"; // Import Firebase configuration


const app = express();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // folder to save files
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public')); 
app.use(cors({ origin: ["http://localhost:5500", "http://127.0.0.1:5500"] }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/chats", chatRoutes); // For the private AI assistant
app.use("/profile", profileRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/discussions", discussionRoutes);


const port = 5006;
app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));