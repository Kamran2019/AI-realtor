const { propertyIdParamsSchema } = require("../validators/property.validator");
const legalPackService = require("../services/legalPack.service");
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

const getLegalPackUrl = (body = {}) => body.url || body.pdfUrl || body.legalPackUrl || "";

const uploadLegalPack = asyncHandler(async (req, res) => {
  const { id } = parseRequest(propertyIdParamsSchema, req.params);
  const property = await legalPackService.attachLegalPack({
    id,
    ownerUserId: req.user._id,
    file: req.file,
    url: getLegalPackUrl(req.body)
  });

  sendResponse(res, 200, {
    success: true,
    message: "Legal pack parsed.",
    data: {
      property
    }
  });
});

const getLegalPackRisks = asyncHandler(async (req, res) => {
  const { id } = parseRequest(propertyIdParamsSchema, req.params);
  const summary = await legalPackService.getRiskSummary({
    id,
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Legal pack risks loaded.",
    data: summary
  });
});

module.exports = {
  getLegalPackRisks,
  uploadLegalPack
};
