const mongoose = require("mongoose");
const path = require("path");
const env = require("./env");
const { ensureDir } = require("../utils/files");

let memoryServer;

async function connectDb() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongoUri);
  } catch (error) {
    const shouldUseMemoryServer =
      env.nodeEnv === "development" &&
      /ECONNREFUSED|ENOTFOUND|failed to connect/i.test(error.message || "");

    if (!shouldUseMemoryServer) {
      throw error;
    }

    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongoBinaryDir = path.resolve(__dirname, "../../.cache/mongodb-binaries");
    ensureDir(mongoBinaryDir);
    memoryServer = await MongoMemoryServer.create({
      binary: {
        downloadDir: mongoBinaryDir,
      },
    });
    await mongoose.connect(memoryServer.getUri());
    console.log("Using in-memory MongoDB fallback for development");
  }
}

module.exports = connectDb;
