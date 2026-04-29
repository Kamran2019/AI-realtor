const crypto = require("crypto");

const TOKEN_BYTE_LENGTH = 32;

const generateRawToken = () => crypto.randomBytes(TOKEN_BYTE_LENGTH).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const tokenHashMatches = (token, expectedHash) => {
  if (!token || !expectedHash) {
    return false;
  }

  const tokenHash = hashToken(token);
  const tokenHashBuffer = Buffer.from(tokenHash, "hex");
  const expectedHashBuffer = Buffer.from(expectedHash, "hex");

  if (tokenHashBuffer.length !== expectedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenHashBuffer, expectedHashBuffer);
};

module.exports = {
  generateRawToken,
  hashToken,
  tokenHashMatches,
  TOKEN_BYTE_LENGTH
};
