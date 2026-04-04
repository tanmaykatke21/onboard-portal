const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// Initialize Stripe with test key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/create-payment-intent — Create a payment intent for an invoice
router.post("/create-payment-intent", async (req, res) => {
  try {
    const db = getDB();
    const { invoiceId } = req.body;

    // Get invoice details
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(invoiceId),
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.status === "paid") {
      return res.status(400).json({ message: "Invoice already paid" });
    }

    // Get client info
    const client = await db.collection("users").findOne({ _id: invoice.clientId });

    // Create Stripe Payment Intent
    // Amount must be in cents (e.g., $99.70 → 9970)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.total * 100),
      currency: "usd",
      metadata: {
        invoiceId: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        clientEmail: client ? client.email : "",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: invoice.total,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/stripe/payment-success — Mark invoice as paid after successful payment
router.post("/payment-success", async (req, res) => {
  try {
    const db = getDB();
    const { invoiceId, paymentIntentId } = req.body;

    await db.collection("invoices").updateOne(
      { _id: new ObjectId(invoiceId) },
      {
        $set: {
          status: "paid",
          paidAt: new Date().toISOString(),
          stripePaymentId: paymentIntentId,
        },
      }
    );

    const updated = await db.collection("invoices").findOne({ _id: new ObjectId(invoiceId) });
    res.json({ invoice: updated, message: "Payment recorded successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stripe/config — Get publishable key for frontend
router.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_xxxxxxxxxxxxxxxxxxxx",
  });
});

module.exports = router;
