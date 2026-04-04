const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectDir = path.join(uploadsDir, req.body.projectId || "general");
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    cb(null, projectDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// POST /api/deliverables — Upload a deliverable
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const db = getDB();
    const { projectId, clientId, category, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newDeliverable = {
      projectId: new ObjectId(projectId),
      clientId: new ObjectId(clientId),
      fileName: req.file.originalname,
      storedName: req.file.filename,
      filePath: `/uploads/${projectId}/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category: category || "general", // design | content | video | document | general
      description: description || "",
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("deliverables").insertOne(newDeliverable);
    newDeliverable._id = result.insertedId;

    res.status(201).json({ deliverable: newDeliverable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deliverables/project/:projectId — Get deliverables for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const db = getDB();
    const deliverables = await db.collection("deliverables")
      .find({ projectId: new ObjectId(req.params.projectId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ deliverables });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/deliverables/:id/download — Download a file
router.get("/:id/download", async (req, res) => {
  try {
    const db = getDB();
    const deliverable = await db.collection("deliverables").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!deliverable) {
      return res.status(404).json({ message: "File not found" });
    }

    // Increment download count
    await db.collection("deliverables").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { downloadCount: 1 } }
    );

    const filePath = path.join(__dirname, "..", deliverable.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, deliverable.fileName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/deliverables/:id — Delete a deliverable
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const deliverable = await db.collection("deliverables").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (deliverable) {
      // Delete file from disk
      const filePath = path.join(__dirname, "..", deliverable.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await db.collection("deliverables").deleteOne({ _id: new ObjectId(req.params.id) });
    }

    res.json({ message: "Deliverable deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
