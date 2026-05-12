const {
  changeStatusSchema,
  createInspectionSchema,
  inspectionDefectParamsSchema,
  inspectionIdParamsSchema,
  inspectionRoomParamsSchema,
  listInspectionsQuerySchema,
  manualDefectSchema,
  roomSchema,
  updateDefectSchema,
  updateInspectionSchema,
  updateRoomSchema
} = require("../validators/inspection.validator");
const inspectionService = require("../services/inspection.service");
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

const listInspections = asyncHandler(async (req, res) => {
  const result = await inspectionService.listInspections({
    ...parseRequest(listInspectionsQuerySchema, req.query),
    actor: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Inspections loaded.",
    data: result
  });
});

const createInspection = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.createInspection({
    actor: req.user,
    payload: parseRequest(createInspectionSchema, req.body)
  });

  sendResponse(res, 201, {
    success: true,
    message: "Inspection created.",
    data: {
      inspection
    }
  });
});

const getInspectionById = asyncHandler(async (req, res) => {
  const { id } = parseRequest(inspectionIdParamsSchema, req.params);
  const inspection = await inspectionService.getInspectionById({
    actor: req.user,
    id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Inspection loaded.",
    data: {
      inspection
    }
  });
});

const updateInspection = asyncHandler(async (req, res) => {
  const { id } = parseRequest(inspectionIdParamsSchema, req.params);
  const inspection = await inspectionService.updateInspection({
    actor: req.user,
    id,
    updates: parseRequest(updateInspectionSchema, req.body)
  });

  sendResponse(res, 200, {
    success: true,
    message: "Inspection updated.",
    data: {
      inspection
    }
  });
});

const addRoom = asyncHandler(async (req, res) => {
  const { id } = parseRequest(inspectionIdParamsSchema, req.params);
  const inspection = await inspectionService.addRoom({
    actor: req.user,
    id,
    payload: parseRequest(roomSchema, req.body)
  });

  sendResponse(res, 201, {
    success: true,
    message: "Inspection room added.",
    data: {
      inspection
    }
  });
});

const updateRoom = asyncHandler(async (req, res) => {
  const { id, roomId } = parseRequest(inspectionRoomParamsSchema, req.params);
  const inspection = await inspectionService.updateRoom({
    actor: req.user,
    id,
    roomId,
    updates: parseRequest(updateRoomSchema, req.body)
  });

  sendResponse(res, 200, {
    success: true,
    message: "Inspection room updated.",
    data: {
      inspection
    }
  });
});

const authorizeInspectionAccess = asyncHandler(async (req, res, next) => {
  const { id } = parseRequest(inspectionRoomParamsSchema, req.params);

  await inspectionService.assertCanAccessInspectionById({
    actor: req.user,
    id
  });

  next();
});

const uploadRoomImage = asyncHandler(async (req, res) => {
  const { id, roomId } = parseRequest(inspectionRoomParamsSchema, req.params);
  const result = await inspectionService.uploadRoomImage({
    actor: req.user,
    file: req.file,
    id,
    roomId
  });

  sendResponse(res, 200, {
    success: true,
    message: "Inspection image uploaded.",
    data: result
  });
});

const addManualDefect = asyncHandler(async (req, res) => {
  const { id, roomId } = parseRequest(inspectionRoomParamsSchema, req.params);
  const inspection = await inspectionService.addManualDefect({
    actor: req.user,
    id,
    payload: parseRequest(manualDefectSchema, req.body),
    roomId
  });

  sendResponse(res, 201, {
    success: true,
    message: "Manual defect added.",
    data: {
      inspection
    }
  });
});

const updateDefect = asyncHandler(async (req, res) => {
  const { defectId, id, roomId } = parseRequest(inspectionDefectParamsSchema, req.params);
  const inspection = await inspectionService.updateDefect({
    actor: req.user,
    defectId,
    id,
    roomId,
    updates: parseRequest(updateDefectSchema, req.body)
  });

  sendResponse(res, 200, {
    success: true,
    message: "Manual defect updated.",
    data: {
      inspection
    }
  });
});

const deleteDefect = asyncHandler(async (req, res) => {
  const { defectId, id, roomId } = parseRequest(inspectionDefectParamsSchema, req.params);
  const inspection = await inspectionService.deleteDefect({
    actor: req.user,
    defectId,
    id,
    roomId
  });

  sendResponse(res, 200, {
    success: true,
    message: "Manual defect deleted.",
    data: {
      inspection
    }
  });
});

const changeInspectionStatus = asyncHandler(async (req, res) => {
  const { id } = parseRequest(inspectionIdParamsSchema, req.params);
  const { status } = parseRequest(changeStatusSchema, req.body);
  const inspection = await inspectionService.changeInspectionStatus({
    actor: req.user,
    id,
    status
  });

  sendResponse(res, 200, {
    success: true,
    message: "Inspection status updated.",
    data: {
      inspection
    }
  });
});

const deleteInspection = asyncHandler(async (req, res) => {
  const { id } = parseRequest(inspectionIdParamsSchema, req.params);
  const result = await inspectionService.deleteInspection({
    actor: req.user,
    id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Inspection deleted.",
    data: result
  });
});

module.exports = {
  addManualDefect,
  addRoom,
  authorizeInspectionAccess,
  changeInspectionStatus,
  createInspection,
  deleteDefect,
  deleteInspection,
  getInspectionById,
  listInspections,
  updateDefect,
  updateInspection,
  updateRoom,
  uploadRoomImage
};
