const fs = require("fs");
const Report = require("../models/Report");
const User = require("../models/User");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { hashToken, randomToken } = require("../utils/tokens");

const listReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({
    ownerUserId: req.accountOwnerId,
  }).sort({ createdAt: -1 });

  res.json({ items: reports });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!report) {
    throw new AppError("Report not found", 404);
  }

  res.json({ report });
});

const enableShare = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!report) {
    throw new AppError("Report not found", 404);
  }

  const token = randomToken();
  report.shareTokenHash = hashToken(token);
  report.shareExpiresAt = new Date(
    Date.now() + Number(req.body.expiresInHours || 168) * 60 * 60 * 1000
  );
  report.shareEnabled = true;
  await report.save();

  res.json({
    shareUrl: `${env.clientUrl}/public/reports/${token}`,
    expiresAt: report.shareExpiresAt,
  });
});

const disableShare = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!report) {
    throw new AppError("Report not found", 404);
  }

  report.shareEnabled = false;
  report.shareTokenHash = undefined;
  report.shareExpiresAt = undefined;
  await report.save();

  res.json({ message: "Report sharing disabled" });
});

const getPublicReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    shareTokenHash: hashToken(req.params.token),
    shareEnabled: true,
    shareExpiresAt: { $gt: new Date() },
  });

  if (!report) {
    throw new AppError("Report link is invalid or expired", 404);
  }

  const owner = await User.findById(report.ownerUserId);
  res.json({
    report,
    branding: owner?.branding || {},
  });
});

const downloadPublicReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    shareTokenHash: hashToken(req.params.token),
    shareEnabled: true,
    shareExpiresAt: { $gt: new Date() },
  });

  if (!report || !report.storage?.diskPath || !fs.existsSync(report.storage.diskPath)) {
    throw new AppError("Report file not found", 404);
  }

  res.download(report.storage.diskPath, report.storage.fileName);
});

module.exports = {
  listReports,
  getReport,
  enableShare,
  disableShare,
  getPublicReport,
  downloadPublicReport,
};
