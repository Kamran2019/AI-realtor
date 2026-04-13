const User = require("../models/User");
const env = require("../config/env");
const { getRefreshCookieOptions } = require("../utils/cookies");
const {
  createAccessToken,
  createRefreshToken,
  hashToken,
} = require("../utils/tokens");

function sanitizeUser(user) {
  const data = user.toJSON();
  delete data.passwordHash;
  delete data.emailVerificationTokenHash;
  delete data.emailVerificationExpiresAt;
  delete data.passwordResetTokenHash;
  delete data.passwordResetExpiresAt;
  delete data.refreshTokens;
  return data;
}

async function issueSession(user, req, res) {
  const accessToken = createAccessToken({
    sub: user._id.toString(),
    role: user.role,
    ownerUserId: (user.ownerUserId || user._id).toString(),
    email: user.email,
  });
  const refreshToken = createRefreshToken({
    sub: user._id.toString(),
  });

  const expiresAt = new Date(
    Date.now() + env.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000
  );

  user.refreshTokens = (user.refreshTokens || []).filter(
    (token) => token.expiresAt > new Date()
  );
  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: req.get("user-agent"),
    ip: req.ip,
  });
  user.lastLoginAt = new Date();
  await user.save();

  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  return {
    accessToken,
    user: sanitizeUser(user),
  };
}

async function rotateRefreshToken(user, incomingToken, req, res) {
  user.refreshTokens = (user.refreshTokens || []).filter(
    (token) => token.tokenHash !== hashToken(incomingToken)
  );
  await user.save();
  return issueSession(user, req, res);
}

async function revokeRefreshToken(user, token, res) {
  if (user && token) {
    user.refreshTokens = (user.refreshTokens || []).filter(
      (item) => item.tokenHash !== hashToken(token)
    );
    await user.save();
  }
  res.clearCookie("refreshToken", getRefreshCookieOptions());
}

async function getOwnerUser(user) {
  return User.findById(user.ownerUserId || user._id);
}

module.exports = {
  sanitizeUser,
  issueSession,
  rotateRefreshToken,
  revokeRefreshToken,
  getOwnerUser,
};

