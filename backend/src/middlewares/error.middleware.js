const env = require("../config/env");
const logger = require("../utils/logger");

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || null
  };

  if (env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error(err.message, err);
  } else {
    logger.warn(err.message);
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
