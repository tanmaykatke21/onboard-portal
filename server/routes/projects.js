const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// POST /api/projects — Create a new project
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { clientId, projectName, startDate, currentPhase } = req.body;

    const newProject = {
      clientId: new ObjectId(clientId),
      projectName,
      status: "active",
      startDate: startDate || new Date().toISOString(),
      currentPhase: currentPhase || "Pre-Production",
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("projects").insertOne(newProject);
    newProject._id = result.insertedId;

    // Link project back to user
    await db.collection("users").updateOne(
      { _id: new ObjectId(clientId) },
      { $set: { projectId: result.insertedId } }
    );

    res.status(201).json({ project: newProject });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id — Get project by ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Also get the client info
    const client = await db.collection("users").findOne({ _id: project.clientId });
    res.json({ project, client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/client/:clientId — Get project by client ID
router.get("/client/:clientId", async (req, res) => {
  try {
    const db = getDB();
    const project = await db.collection("projects").findOne({
      clientId: new ObjectId(req.params.clientId),
    });

    if (!project) {
      return res.status(404).json({ message: "No project found for this client" });
    }

    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id — Update project
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const updates = {};

    if (req.body.projectName) updates.projectName = req.body.projectName;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.currentPhase) updates.currentPhase = req.body.currentPhase;
    if (req.body.startDate) updates.startDate = req.body.startDate;
    updates.updatedAt = new Date().toISOString();

    await db.collection("projects").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    const updated = await db.collection("projects").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ project: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects — Get all projects
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const projects = await db.collection("projects").find().sort({ createdAt: -1 }).toArray();
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
