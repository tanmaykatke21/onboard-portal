const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// POST /api/invoices — Create a new invoice
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { projectId, clientId, items, dueDate, notes } = req.body;

    // Calculate total from items
    const total = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

    const newInvoice = {
      projectId: new ObjectId(projectId),
      clientId: new ObjectId(clientId),
      invoiceNumber: "INV-" + Date.now().toString().slice(-6),
      items, // [{ description, amount, quantity }]
      total,
      status: "pending", // pending | paid | overdue | cancelled
      dueDate: dueDate || null,
      paidAt: null,
      stripePaymentId: null,
      notes: notes || "",
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("invoices").insertOne(newInvoice);
    newInvoice._id = result.insertedId;

    res.status(201).json({ invoice: newInvoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/invoices/project/:projectId — Get invoices for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const db = getDB();
    const invoices = await db.collection("invoices")
      .find({ projectId: new ObjectId(req.params.projectId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/invoices/:id — Get single invoice
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Also get client info
    const client = await db.collection("users").findOne({ _id: invoice.clientId });
    res.json({ invoice, client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/invoices/:id — Update invoice
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const updates = {};

    if (req.body.status) updates.status = req.body.status;
    if (req.body.items) {
      updates.items = req.body.items;
      updates.total = req.body.items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    }
    if (req.body.dueDate) updates.dueDate = req.body.dueDate;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.stripePaymentId) updates.stripePaymentId = req.body.stripePaymentId;
    if (req.body.paidAt) updates.paidAt = req.body.paidAt;
    updates.updatedAt = new Date().toISOString();

    await db.collection("invoices").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    const updated = await db.collection("invoices").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ invoice: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/invoices — Get all invoices (admin)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const status = req.query.status;
    const filter = status ? { status } : {};
    const invoices = await db.collection("invoices").find(filter).sort({ createdAt: -1 }).toArray();
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
