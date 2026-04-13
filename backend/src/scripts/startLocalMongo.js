const path = require("path");
const fs = require("fs");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ensureDir } = require("../utils/files");

async function run() {
  const binaryDir = path.resolve(__dirname, "../../.cache/mongodb-binaries");
  const dataDir = path.resolve(__dirname, "../../.data/mongo");
  const metaDir = path.resolve(__dirname, "../../.runtime");
  const metaFile = path.join(metaDir, "mongo-dev.json");

  ensureDir(binaryDir);
  ensureDir(dataDir);
  ensureDir(metaDir);

  const mongo = await MongoMemoryServer.create({
    binary: {
      downloadDir: binaryDir,
    },
    instance: {
      port: 27017,
      ip: "127.0.0.1",
      dbPath: dataDir,
      dbName: "ai-auction-analyzer",
    },
  });

  const payload = {
    uri: mongo.getUri(),
    port: 27017,
    pid: process.pid,
    startedAt: new Date().toISOString(),
  };

  fs.writeFileSync(metaFile, JSON.stringify(payload, null, 2));
  console.log(`Local MongoDB ready at ${payload.uri}`);

  const shutdown = async () => {
    try {
      await mongo.stop();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

