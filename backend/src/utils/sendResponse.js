const sendResponse = (res, statusCode, payload) => {
  res.status(statusCode).json(payload);
};

module.exports = sendResponse;
