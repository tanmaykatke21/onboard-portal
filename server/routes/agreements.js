const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// POST /api/agreements — Create a new agreement
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { projectId, clientId, title, content, terms } = req.body;

    const newAgreement = {
      projectId: new ObjectId(projectId),
      clientId: new ObjectId(clientId),
      title: title || "Service Agreement",
      content: content || "",
      terms: terms || [],
      status: "pending", // pending | signed | declined
      signedAt: null,
      signatureName: null,
      signatureIP: null,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("agreements").insertOne(newAgreement);
    newAgreement._id = result.insertedId;

    res.status(201).json({ agreement: newAgreement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agreements/project/:projectId — Get agreements for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const db = getDB();
    const agreements = await db.collection("agreements")
      .find({ projectId: new ObjectId(req.params.projectId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ agreements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agreements/:id — Get single agreement
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const agreement = await db.collection("agreements").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    res.json({ agreement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/agreements/:id/sign — Client signs an agreement
router.put("/:id/sign", async (req, res) => {
  try {
    const db = getDB();
    const { signatureName } = req.body;
    const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    await db.collection("agreements").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: "signed",
          signedAt: new Date().toISOString(),
          signatureName,
          signatureIP: clientIP,
        },
      }
    );

    const updated = await db.collection("agreements").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ agreement: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/agreements/:id — Update agreement content (admin)
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const updates = {};

    if (req.body.title) updates.title = req.body.title;
    if (req.body.content) updates.content = req.body.content;
    if (req.body.terms) updates.terms = req.body.terms;
    if (req.body.status) updates.status = req.body.status;
    updates.updatedAt = new Date().toISOString();

    await db.collection("agreements").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    const updated = await db.collection("agreements").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ agreement: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agreements — Get all agreements (admin)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const agreements = await db.collection("agreements").find().sort({ createdAt: -1 }).toArray();
    res.json({ agreements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
