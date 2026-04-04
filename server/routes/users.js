const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// POST /api/users — Create user profile after Firebase register
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { firebaseUid, name, email, role } = req.body;

    const existing = await db.collection("users").findOne({ firebaseUid });
    if (existing) {
      return res.json({ user: existing });
    }

    const newUser = {
      firebaseUid,
      name,
      email,
      role: role || "client",
      projectId: null,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("users").insertOne(newUser);
    newUser._id = result.insertedId;

    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/firebase/:firebaseUid — Get user by Firebase UID
router.get("/firebase/:firebaseUid", async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({
      firebaseUid: req.params.firebaseUid,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id — Get user by MongoDB _id
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id — Update user (e.g., add projectId)
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const updates = {};

    if (req.body.projectId) updates.projectId = new ObjectId(req.body.projectId);
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.role) updates.role = req.body.role;

    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    const updated = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users — Get all clients (admin use)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const role = req.query.role;
    const filter = role ? { role } : {};
    const users = await db.collection("users").find(filter).sort({ createdAt: -1 }).toArray();

    // Attach project info to each client
    const results = await Promise.all(
      users.map(async (user) => {
        const project = user.projectId
          ? await db.collection("projects").findOne({ _id: user.projectId })
          : null;
        return { ...user, project };
      })
    );

    res.json({ users: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
