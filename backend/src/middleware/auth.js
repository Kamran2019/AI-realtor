const User = require("../models/User");
const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/tokens");
const { getAccountOwnerId } = require("../utils/account");

async function authMiddleware(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return next(new AppError("User is not active", 401));
    }

    req.user = user;
    req.accountOwnerId = getAccountOwnerId(user);
    next();
  } catch (error) {
    next(new AppError("Invalid or expired access token", 401));
  }
}

module.exports = authMiddleware;

