function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || "Server error",
    details: err.details || null,
    path: req.originalUrl,
  });
}

module.exports = errorHandler;

