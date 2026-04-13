const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function createAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiry,
  });
}

function createRefreshToken(payload) {
  const expiresInSeconds = env.jwtRefreshExpiryDays * 24 * 60 * 60;
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: expiresInSeconds,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  randomToken,
};

