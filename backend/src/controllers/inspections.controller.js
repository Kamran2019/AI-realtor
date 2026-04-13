const Inspection = require("../models/Inspection");
const Report = require("../models/Report");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { mapUploadedFiles } = require("../services/storage.service");
const {
  detectDefectsForRoom,
  summarizeInspection,
} = require("../services/ai-defect.service");
const { generateInspectionPdf } = require("../services/pdf.service");
const { writeAuditLog } = require("../utils/audit");

function mergeRecommendations(inspection) {
  if (inspection.recommendations?.length) {
    return inspection.recommendations;
  }

  return [
    "Prioritize critical and high-severity issues first.",
    "Confirm moisture-related findings with a specialist if they persist.",
    "Retain photo evidence in the final handover pack.",
  ];
}

const listInspections = asyncHandler(async (req, res) => {
  const inspections = await Inspection.find({
    ownerUserId: req.accountOwnerId,
  }).sort({ createdAt: -1 });

  res.json({ items: inspections });
});

const createInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.create({
    ownerUserId: req.accountOwnerId,
    createdByUserId: req.user._id,
    assignedToUserId: req.body.assignedToUserId || req.user._id,
    propertyId: req.body.propertyId,
    propertyRef: req.body.propertyRef || {},
    client: req.body.client || {},
    rooms: req.body.rooms || [],
    recommendations: req.body.recommendations || [],
    geo: req.body.geo || {},
    status: "draft",
  });

  res.status(201).json({ inspection });
});

const getInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });

  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  res.json({ inspection });
});

const updateInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });

  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  Object.assign(inspection, {
    assignedToUserId: req.body.assignedToUserId ?? inspection.assignedToUserId,
    propertyRef: req.body.propertyRef ?? inspection.propertyRef,
    client: req.body.client ?? inspection.client,
    rooms: req.body.rooms ?? inspection.rooms,
    recommendations: req.body.recommendations ?? inspection.recommendations,
    geo: req.body.geo ?? inspection.geo,
    status: req.body.status ?? inspection.status,
  });

  await inspection.save();
  res.json({ inspection });
});

const uploadInspectionImages = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  const roomName = req.body.roomName || "General";
  const files = mapUploadedFiles(req.files || []);
  const existingRoom =
    inspection.rooms.find((room) => room.name.toLowerCase() === roomName.toLowerCase()) ||
    null;

  if (existingRoom) {
    existingRoom.photos.push(...files);
  } else {
    inspection.rooms.push({
      name: roomName,
      photos: files,
      defects: [],
    });
  }

  inspection.status = inspection.status === "draft" ? "in_progress" : inspection.status;
  await inspection.save();

  res.json({ inspection });
});

const runAiDetection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  const allDefects = [];

  for (const room of inspection.rooms) {
    const detections = await detectDefectsForRoom(room);
    room.defects = detections;
    allDefects.push(...detections);
  }

  inspection.defects = allDefects;
  inspection.summary = summarizeInspection(inspection);
  inspection.status = "in_progress";
  await inspection.save();

  res.json({
    inspection,
    detections: allDefects,
  });
});

const finalizeInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  inspection.status = "finalized";
  inspection.completedAt = new Date();
  inspection.recommendations = req.body.recommendations || mergeRecommendations(inspection);
  inspection.summary = summarizeInspection(inspection);
  await inspection.save();

  await writeAuditLog({
    actor: req.user,
    action: "inspection.finalize",
    targetType: "Inspection",
    targetId: inspection._id.toString(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.json({ inspection });
});

const generateInspectionReport = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  const [owner, creator] = await Promise.all([
    User.findById(req.accountOwnerId),
    User.findById(inspection.createdByUserId),
  ]);

  const storage = await generateInspectionPdf({
    inspection,
    branding: owner.branding,
    inspectorName: creator?.name || "Inspector",
  });

  const report = await Report.create({
    ownerUserId: req.accountOwnerId,
    createdByUserId: req.user._id,
    kind: "inspection",
    inspectionId: inspection._id,
    storage,
    status: "ready",
  });

  res.json({ report });
});

module.exports = {
  listInspections,
  createInspection,
  getInspection,
  updateInspection,
  uploadInspectionImages,
  runAiDetection,
  finalizeInspection,
  generateInspectionReport,
};

