const mongoose = require("mongoose");

const app = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const { startScrapeScheduler } = require("./jobs/scrapeScheduler.job");
const logger = require("./utils/logger");

let server;
let scrapeScheduler;
let isShuttingDown = false;

const listen = () =>
  new Promise((resolve, reject) => {
    server = app.listen(env.PORT);

    server.once("listening", () => {
      logger.info(`API server listening on port ${env.PORT}`);
      resolve();
    });

    server.once("error", reject);
  });

const startServer = async () => {
  await connectDB();
  await listen();
  scrapeScheduler = startScrapeScheduler();
};

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully.`);
  scrapeScheduler?.stop();

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

startServer().catch(async (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(
      `Port ${env.PORT} is already in use. Stop the existing process or set a different PORT in backend/.env.`
    );
  } else {
    logger.error("Failed to start server", error);
  }

  scrapeScheduler?.stop();
  await mongoose.disconnect().catch((disconnectError) => {
    logger.error("Failed to disconnect MongoDB after startup error", disconnectError);
  });

  process.exit(1);
});
