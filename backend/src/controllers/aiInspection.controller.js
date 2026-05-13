const { aiImageDetectionParamsSchema } = require("../validators/aiInspection.validator");
const inspectionService = require("../services/inspection.service");
const { runDefectDetection } = require("../services/ai/defectDetection.service");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: issue.message
  }));

const parseRequest = (schema, value) => {
  const parsedValue = schema.safeParse(value);

  if (!parsedValue.success) {
    throw new ApiError(400, "Validation failed", formatValidationIssues(parsedValue.error.issues));
  }

  return parsedValue.data;
};

const findRoom = (inspection, roomId) => {
  const room = inspection.rooms.id(roomId);

  if (!room) {
    throw new ApiError(404, "Room not found.");
  }

  return room;
};

const findImageUrl = (room, imageIndex) => {
  const imageUrl = room.mediaUrls[imageIndex];

  if (!imageUrl) {
    throw new ApiError(404, "Inspection image not found.");
  }

  return imageUrl;
};

const runImageDetection = asyncHandler(async (req, res) => {
  const { imageIndex, inspectionId, roomId } = parseRequest(aiImageDetectionParamsSchema, req.params);
  const inspection = await inspectionService.getAccessibleInspectionDocument({
    actor: req.user,
    id: inspectionId
  });
  const room = findRoom(inspection, roomId);
  const imageUrl = findImageUrl(room, imageIndex);
  const detectionResult = await runDefectDetection({
    imageIndex,
    imageUrl,
    inspectionId,
    roomId
  });

  room.defects.push(...detectionResult.detections);

  inspectionService.recalculateInspectionSummary(inspection);
  await inspection.save();

  const savedInspection = inspection.toJSON();
  const savedRoom = savedInspection.rooms.find((currentRoom) => currentRoom.id === roomId);
  const savedDefects = detectionResult.detections.length
    ? savedRoom.defects.slice(-detectionResult.detections.length)
    : [];

  sendResponse(res, 200, {
    success: true,
    message: "AI defect detection completed.",
    data: {
      defects: savedDefects,
      inspection: savedInspection,
      modelVersion: detectionResult.modelVersion,
      provider: detectionResult.provider,
      summary: savedInspection.summary
    }
  });
});

module.exports = {
  runImageDetection
};
