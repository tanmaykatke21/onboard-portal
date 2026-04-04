const { MongoClient } = require("mongodb");

let db;
let client;

async function connectDB() {
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db("onboard");
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

function getClient() {
  return client;
}

module.exports = { connectDB, getDB, getClient };
