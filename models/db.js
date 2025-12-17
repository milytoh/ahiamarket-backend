const { MongoClient } = require("mongodb");
const mongodb = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;

const dbName = "ahiaMarket";

let client;
let db;

const mongodbConnect = async () => {
  try {
     if (db && client) return { db, client };
    client = new MongoClient(uri);

    await client.connect();
    db = client.db(dbName);
    console.log(" Connected to MongoDB Atlas");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Closing MongoDB Atlas connection...");
      if (client) {
        await client.close();
        console.log("🔌 Connection closed");
      }
      process.exit(0);
    });

    return {db, client};
  } catch (err) {
      console.error(" MongoDB connection error:", err);
      throw err;
  }
};

module.exports = mongodbConnect