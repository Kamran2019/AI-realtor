const AlertRule = require("../models/AlertRule");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const listAlerts = asyncHandler(async (req, res) => {
  const filters = { ownerUserId: req.accountOwnerId };
  if (!["admin", "sub_admin"].includes(req.user.role) || req.query.scope !== "all") {
    filters.userId = req.user._id;
  }

  const alerts = await AlertRule.find(filters).sort({ createdAt: -1 });
  res.json({ items: alerts });
});

const createAlert = asyncHandler(async (req, res) => {
  const alert = await AlertRule.create({
    ownerUserId: req.accountOwnerId,
    userId: req.user._id,
    name: req.body.name,
    criteria: req.body.criteria || {},
    channels: req.body.channels || { email: true, inApp: true },
    isEnabled: req.body.isEnabled ?? true,
  });

  res.status(201).json({ alert });
});

const updateAlert = asyncHandler(async (req, res) => {
  const alert = await AlertRule.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!alert) {
    throw new AppError("Alert rule not found", 404);
  }

  if (
    String(alert.userId) !== String(req.user._id) &&
    !["admin", "sub_admin"].includes(req.user.role)
  ) {
    throw new AppError("You cannot update this alert rule", 403);
  }

  Object.assign(alert, {
    name: req.body.name ?? alert.name,
    criteria: req.body.criteria ?? alert.criteria,
    channels: req.body.channels ?? alert.channels,
    isEnabled: req.body.isEnabled ?? alert.isEnabled,
  });
  await alert.save();
  res.json({ alert });
});

const deleteAlert = asyncHandler(async (req, res) => {
  const alert = await AlertRule.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!alert) {
    throw new AppError("Alert rule not found", 404);
  }

  if (
    String(alert.userId) !== String(req.user._id) &&
    !["admin", "sub_admin"].includes(req.user.role)
  ) {
    throw new AppError("You cannot delete this alert rule", 403);
  }

  await alert.deleteOne();
  res.json({ message: "Alert deleted" });
});

module.exports = {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
};

