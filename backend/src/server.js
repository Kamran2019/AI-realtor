const mongoose = require("mongoose");

const app = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const logger = require("./utils/logger");

let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(env.PORT, () => {
    logger.info(`API server listening on port ${env.PORT}`);
  });
};

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully.`);

  if (server) {
    server.close(async () => {
      await mongoose.disconnect();
      logger.info("HTTP server and MongoDB connection closed.");
      process.exit(0);
    });
    return;
  }

  await mongoose.disconnect();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
