const morgan = require("morgan");
const env = require("../config/env");
const logger = require("../utils/logger");

const requestLogger = morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

module.exports = requestLogger;
