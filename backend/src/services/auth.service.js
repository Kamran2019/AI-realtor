const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const emailService = require("./email.service");
const { comparePassword, hashPassword } = require("./password.service");
const {
  hashToken,
  signAccessToken,
  signRefreshToken,
  tokenHashMatches,
  verifyRefreshToken
} = require("./token.service");
const { generateRawToken } = require("./tokenHash.service");

const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists.";
const INVALID_LOGIN_MESSAGE = "Invalid email or password.";
const INVALID_REFRESH_MESSAGE = "Invalid or expired refresh token.";
const INVALID_EMAIL_TOKEN_MESSAGE = "Invalid or expired verification token.";
const INVALID_RESET_TOKEN_MESSAGE = "Invalid or expired password reset token.";
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const toSafeUser = (user) => user.toJSON();

const ensureActiveUser = (user) => {
  if (user.status !== "active") {
    throw new ApiError(403, "Account is not active.");
  }
};

const createExpiringToken = (ttlMs) => {
  const token = generateRawToken();

  return {
    expiresAt: new Date(Date.now() + ttlMs),
    token,
    tokenHash: hashToken(token)
  };
};

const signup = async ({ name, email, password }) => {
  const existingUser = await User.exists({ email }).collation({
    locale: "en",
    strength: 2
  });

  if (existingUser) {
    throw new ApiError(409, DUPLICATE_EMAIL_MESSAGE);
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = createExpiringToken(VERIFICATION_TOKEN_TTL_MS);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
      emailVerification: {
        isVerified: false,
        tokenHash: verificationToken.tokenHash,
        expiresAt: verificationToken.expiresAt,
        verifiedAt: null
      }
    });

    try {
      await emailService.sendVerificationEmail({
        user,
        token: verificationToken.token
      });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    return toSafeUser(user);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, DUPLICATE_EMAIL_MESSAGE);
    }

    throw error;
  }
};

const resendVerification = async ({ email }) => {
  const user = await User.findOne({ email })
    .select("+emailVerification.tokenHash")
    .collation({
      locale: "en",
      strength: 2
    });

  if (!user || user.status !== "active" || user.emailVerification?.isVerified) {
    return null;
  }

  const verificationToken = createExpiringToken(VERIFICATION_TOKEN_TTL_MS);

  user.set("emailVerification.tokenHash", verificationToken.tokenHash);
  user.set("emailVerification.expiresAt", verificationToken.expiresAt);
  user.set("emailVerification.verifiedAt", null);
  await user.save();

  await emailService.sendVerificationEmail({
    user,
    token: verificationToken.token
  });

  return null;
};

const verifyEmail = async ({ token }) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    "emailVerification.tokenHash": tokenHash
  }).select("+emailVerification.tokenHash");

  if (!user) {
    throw new ApiError(400, INVALID_EMAIL_TOKEN_MESSAGE);
  }

  if (user.emailVerification?.isVerified) {
    return toSafeUser(user);
  }

  if (
    user.status !== "active" ||
    !user.emailVerification?.expiresAt ||
    user.emailVerification.expiresAt <= new Date()
  ) {
    throw new ApiError(400, INVALID_EMAIL_TOKEN_MESSAGE);
  }

  user.set("emailVerification.isVerified", true);
  user.set("emailVerification.verifiedAt", new Date());
  user.set("emailVerification.tokenHash", null);
  user.set("emailVerification.expiresAt", null);
  await user.save();

  return toSafeUser(user);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email })
    .select("+passwordHash +auth.refreshTokenHash")
    .collation({
      locale: "en",
      strength: 2
    });

  if (!user) {
    throw new ApiError(401, INVALID_LOGIN_MESSAGE);
  }

  ensureActiveUser(user);

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, INVALID_LOGIN_MESSAGE);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.lastLoginAt = new Date();
  user.set("auth.refreshTokenHash", hashToken(refreshToken));
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: toSafeUser(user)
  };
};

const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email })
    .select("+passwordReset.tokenHash")
    .collation({
      locale: "en",
      strength: 2
    });

  if (!user || user.status !== "active") {
    return null;
  }

  const resetToken = createExpiringToken(PASSWORD_RESET_TOKEN_TTL_MS);

  user.set("passwordReset.tokenHash", resetToken.tokenHash);
  user.set("passwordReset.expiresAt", resetToken.expiresAt);
  user.set("passwordReset.requestedAt", new Date());
  await user.save();

  await emailService.sendPasswordResetEmail({
    user,
    token: resetToken.token
  });

  return null;
};

const resetPassword = async ({ token, password }) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    "passwordReset.tokenHash": tokenHash
  }).select("+passwordHash +passwordReset.tokenHash +auth.refreshTokenHash");

  if (
    !user ||
    user.status !== "active" ||
    !user.passwordReset?.expiresAt ||
    user.passwordReset.expiresAt <= new Date()
  ) {
    throw new ApiError(400, INVALID_RESET_TOKEN_MESSAGE);
  }

  user.passwordHash = await hashPassword(password);
  user.set("passwordReset.tokenHash", null);
  user.set("passwordReset.expiresAt", null);
  user.set("passwordReset.requestedAt", null);
  user.set("auth.refreshTokenHash", null);
  await user.save();

  return null;
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, INVALID_REFRESH_MESSAGE);
  }

  let decodedToken;

  try {
    decodedToken = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, INVALID_REFRESH_MESSAGE);
  }

  const user = await User.findById(decodedToken.sub).select("+auth.refreshTokenHash");

  if (
    !user ||
    user.status !== "active" ||
    !tokenHashMatches(refreshToken, user.auth?.refreshTokenHash)
  ) {
    throw new ApiError(401, INVALID_REFRESH_MESSAGE);
  }

  return {
    accessToken: signAccessToken(user),
    user: toSafeUser(user)
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  try {
    const decodedToken = verifyRefreshToken(refreshToken);

    await User.updateOne(
      { _id: decodedToken.sub },
      {
        $set: {
          "auth.refreshTokenHash": null
        }
      }
    );
  } catch (error) {
    // Invalid logout cookies are still cleared by the controller.
  }
};

module.exports = {
  forgotPassword,
  login,
  logout,
  refreshSession,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail
};
