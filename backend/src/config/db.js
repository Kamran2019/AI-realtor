const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

const connectDB = async () => {
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
