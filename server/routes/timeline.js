const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// POST /api/timeline — Create a timeline task
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { projectId, phase, taskName, description, dueDate } = req.body;

    const newTask = {
      projectId: new ObjectId(projectId),
      phase: phase || "Pre-Production",
      taskName,
      description: description || "",
      status: "pending", // pending | in-progress | completed
      dueDate: dueDate || null,
      completedAt: null,
      order: Date.now(),
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("timeline").insertOne(newTask);
    newTask._id = result.insertedId;

    res.status(201).json({ task: newTask });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/timeline/project/:projectId — Get all tasks for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const db = getDB();
    const tasks = await db.collection("timeline")
      .find({ projectId: new ObjectId(req.params.projectId) })
      .sort({ order: 1 })
      .toArray();

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/timeline/:id — Update a task
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const updates = {};

    if (req.body.taskName) updates.taskName = req.body.taskName;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.phase) updates.phase = req.body.phase;
    if (req.body.status) {
      updates.status = req.body.status;
      if (req.body.status === "completed") {
        updates.completedAt = new Date().toISOString();
      }
    }
    if (req.body.dueDate) updates.dueDate = req.body.dueDate;
    updates.updatedAt = new Date().toISOString();

    await db.collection("timeline").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    const updated = await db.collection("timeline").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ task: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/timeline/:id — Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    await db.collection("timeline").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/timeline/bulk — Create multiple tasks at once (for templates)
router.post("/bulk", async (req, res) => {
  try {
    const db = getDB();
    const { projectId, tasks } = req.body;

    const docs = tasks.map((task, index) => ({
      projectId: new ObjectId(projectId),
      phase: task.phase || "Pre-Production",
      taskName: task.taskName,
      description: task.description || "",
      status: "pending",
      dueDate: task.dueDate || null,
      completedAt: null,
      order: Date.now() + index,
      createdAt: new Date().toISOString(),
    }));

    const result = await db.collection("timeline").insertMany(docs);
    res.status(201).json({ message: `${result.insertedCount} tasks created` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
