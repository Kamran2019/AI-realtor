const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { hashToken, tokenHashMatches } = require("./tokenHash.service");

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id || user._id.toString(),
      role: user.role,
      email: user.email
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN
    }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user.id || user._id.toString()
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
    }
  );

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

module.exports = {
  hashToken,
  signAccessToken,
  signRefreshToken,
  tokenHashMatches,
  verifyAccessToken,
  verifyRefreshToken
};
