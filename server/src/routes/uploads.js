import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        cb(null, allowed.includes(file.mimetype));
    },
});

// POST /api/uploads/image — upload a single image, returns { url }
router.post("/image", requireAuth, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: { message: "No valid image file provided" } });
    }
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
});

export default router;
