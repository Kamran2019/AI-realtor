const dns = require("dns");
const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

const configureSrvDns = () => {
  if (!env.MONGO_URI.startsWith("mongodb+srv://")) {
    return;
  }

  const servers = (env.MONGO_DNS_SERVERS || "1.1.1.1,8.8.8.8")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
};

const connectDB = async () => {
  configureSrvDns();

  const connection = await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  });

  logger.info(`MongoDB connected: ${connection.connection.host}`);
  console.log(
    `MongoDB connected successfully: ${connection.connection.host}/${connection.connection.name}`
  );

  return connection;
};

module.exports = { connectDB };
