const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const getHealth = asyncHandler(async (req, res) => {
  sendResponse(res, 200, {
    success: true,
    data: {
      service: "AI Realtor API",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = { getHealth };
