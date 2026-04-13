const passport = require("passport");
const User = require("../models/User");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  verifyRefreshToken,
  hashToken,
  randomToken,
} = require("../utils/tokens");
const {
  issueSession,
  rotateRefreshToken,
  revokeRefreshToken,
  sanitizeUser,
  getOwnerUser,
} = require("../services/auth.service");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/email.service");
const { bootstrapDefaultScrapeSources } = require("../services/scraper.service");

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, timezone, locale } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const emailToken = randomToken();
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: "admin",
    ownerUserId: undefined,
    providers: { local: { enabled: true } },
    settings: {
      timezone: timezone || "UTC",
      locale: locale || "en-GB",
    },
    subscription: {
      plan: "free",
      status: "free",
    },
    emailVerificationTokenHash: hashToken(emailToken),
    emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  user.ownerUserId = user._id;
  await user.save();

  await bootstrapDefaultScrapeSources(user._id);
  await sendVerificationEmail(user, emailToken);

  res.status(201).json({
    message: "Account created. Verify your email to continue.",
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is disabled", 403);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Verify your email before logging in", 403);
  }

  const session = await issueSession(user, req, res);
  const owner = await getOwnerUser(user);

  res.json({
    ...session,
    account: sanitizeUser(owner),
  });
});

const me = asyncHandler(async (req, res) => {
  const owner = await getOwnerUser(req.user);
  res.json({
    user: sanitizeUser(req.user),
    account: sanitizeUser(owner),
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401);
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw new AppError("User not found", 401);
  }

  const tokenExists = user.refreshTokens.some(
    (token) => token.tokenHash === hashToken(refreshToken)
  );
  if (!tokenExists) {
    throw new AppError("Refresh token is invalid", 401);
  }

  const session = await rotateRefreshToken(user, refreshToken, req, res);
  const owner = await getOwnerUser(user);

  res.json({
    ...session,
    account: sanitizeUser(owner),
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.sub);
      await revokeRefreshToken(user, refreshToken, res);
    } catch (_error) {
      res.clearCookie("refreshToken");
    }
  } else {
    res.clearCookie("refreshToken");
  }

  res.json({ message: "Logged out" });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Verification token is invalid or expired", 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
});

const requestResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const token = randomToken();
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(user, token);
  }

  res.json({
    message: "If that email exists, a reset link has been sent.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Reset token is invalid or expired", 400);
  }

  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.isEmailVerified = true;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

const googleAuth = (req, res, next) => {
  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(503).json({ message: "Google OAuth is not configured" });
  }

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
};

const googleCallback = [
  (req, res, next) => {
    if (!env.googleClientId || !env.googleClientSecret) {
      return res.status(503).json({ message: "Google OAuth is not configured" });
    }

    return passport.authenticate("google", {
      session: false,
      failureRedirect: "/api/auth/google/failure",
    })(req, res, next);
  },
  asyncHandler(async (req, res) => {
    const session = await issueSession(req.user, req, res);
    const redirectUrl = new URL("/oauth-success", env.clientUrl);
    redirectUrl.searchParams.set("accessToken", session.accessToken);
    res.redirect(redirectUrl.toString());
  }),
];

const googleFailure = (_req, res) => {
  res.status(401).json({ message: "Google authentication failed" });
};

module.exports = {
  signup,
  login,
  me,
  refresh,
  logout,
  verifyEmail,
  requestResetPassword,
  resetPassword,
  googleAuth,
  googleCallback,
  googleFailure,
};
