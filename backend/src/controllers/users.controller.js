const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword } = require("../utils/password");
const { sanitizeUser } = require("../services/auth.service");
const { writeAuditLog } = require("../utils/audit");

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ ownerUserId: req.accountOwnerId }).sort({
    createdAt: -1,
  });

  res.json({
    items: users.map(sanitizeUser),
  });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, timezone, locale } = req.body;

  if (role === "admin") {
    throw new AppError("Only one admin owner is allowed per account", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const user = await User.create({
    ownerUserId: req.accountOwnerId,
    name,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role,
    isEmailVerified: true,
    providers: { local: { enabled: true } },
    settings: {
      timezone: timezone || "UTC",
      locale: locale || "en-GB",
    },
  });

  await writeAuditLog({
    actor: req.user,
    action: "user.create",
    targetType: "User",
    targetId: user._id.toString(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
    meta: { email: user.email, role: user.role },
  });

  res.status(201).json({
    user: sanitizeUser(user),
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, isActive, timezone, locale } = req.body;
  const user = await User.findOne({
    _id: id,
    ownerUserId: req.accountOwnerId,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (String(user._id) === String(req.accountOwnerId) && role && role !== "admin") {
    throw new AppError("The account owner must remain admin", 400);
  }

  if (role && role !== "admin") {
    user.role = role;
  }

  if (typeof isActive === "boolean") {
    user.isActive = isActive;
    user.disabledAt = isActive ? null : new Date();
  }

  if (timezone) user.settings.timezone = timezone;
  if (locale) user.settings.locale = locale;

  await user.save();

  await writeAuditLog({
    actor: req.user,
    action: "user.update",
    targetType: "User",
    targetId: user._id.toString(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
    meta: { role: user.role, isActive: user.isActive },
  });

  res.json({
    user: sanitizeUser(user),
  });
});

const updateMySettings = asyncHandler(async (req, res) => {
  const { timezone, locale, branding } = req.body;

  if (timezone) req.user.settings.timezone = timezone;
  if (locale) req.user.settings.locale = locale;

  if (branding) {
    req.user.branding = {
      ...req.user.branding,
      ...branding,
    };
  }

  await req.user.save();
  res.json({
    user: sanitizeUser(req.user),
  });
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  updateMySettings,
};
