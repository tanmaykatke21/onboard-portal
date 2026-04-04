const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// POST /api/reports — Create a monthly report
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { projectId, clientId, month, year, overview, metrics, highlights, nextSteps } = req.body;

    const newReport = {
      projectId: new ObjectId(projectId),
      clientId: new ObjectId(clientId),
      month, // "January", "February", etc.
      year: year || new Date().getFullYear(),
      overview: overview || "",
      metrics: metrics || {}, // { impressions, engagement, clicks, conversions, etc. }
      highlights: highlights || [], // ["Launched campaign X", "Reached 10k followers"]
      nextSteps: nextSteps || [], // ["Plan Q2 strategy", "Create video content"]
      status: "draft", // draft | published
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("reports").insertOne(newReport);
    newReport._id = result.insertedId;

    res.status(201).json({ report: newReport });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/project/:projectId — Get reports for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const db = getDB();
    const reports = await db.collection("reports")
      .find({ projectId: new ObjectId(req.params.projectId) })
      .sort({ year: -1, createdAt: -1 })
      .toArray();

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/:id — Get single report
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const report = await db.collection("reports").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/reports/:id — Update report
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const updates = {};

    if (req.body.overview !== undefined) updates.overview = req.body.overview;
    if (req.body.metrics) updates.metrics = req.body.metrics;
    if (req.body.highlights) updates.highlights = req.body.highlights;
    if (req.body.nextSteps) updates.nextSteps = req.body.nextSteps;
    if (req.body.status) updates.status = req.body.status;
    updates.updatedAt = new Date().toISOString();

    await db.collection("reports").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    const updated = await db.collection("reports").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ report: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/reports/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    await db.collection("reports").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
