const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../services/token.service");

const getBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const authenticate = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req.get("authorization"));

  if (!token) {
    throw new ApiError(401, "Authentication required.");
  }

  let decodedToken;

  try {
    decodedToken = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  const user = await User.findById(decodedToken.sub);

  if (!user) {
    throw new ApiError(401, "Authentication required.");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account is not active.");
  }

  req.auth = decodedToken;
  req.user = user;

  next();
});

module.exports = { authenticate };
