const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isMongoConnected = false;

const DB_FILE_PATH = path.join(__dirname, 'data', 'db.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initialize db.json if it doesn't exist
if (!fs.existsSync(DB_FILE_PATH)) {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify({
    users: [],
    tasks: [],
    goals: [],
    events: [],
    notes: [],
    habits: []
  }, null, 2));
}

// Read database from JSON file
function readJSONDb() {
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading JSON database, resetting:", err);
    return { users: [], tasks: [], goals: [], events: [], notes: [], habits: [] };
  }
}

// Write database to JSON file
function writeJSONDb(data) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to JSON database:", err);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI is not set in environment. Falling back to local JSON File Database.");
    isMongoConnected = false;
    return;
  }
  
  try {
    // Set connection timeout to be fast for fallback
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log("🚀 Connected to MongoDB successfully!");
    isMongoConnected = true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.warn("⚠️ Falling back to local JSON File Database.");
    isMongoConnected = false;
  }
}

module.exports = {
  connectDB,
  getIsMongoConnected: () => isMongoConnected,
  readJSONDb,
  writeJSONDb
};
