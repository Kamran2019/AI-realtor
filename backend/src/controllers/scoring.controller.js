const { propertyIdParamsSchema } = require("../validators/property.validator");
const dealScoringService = require("../services/dealScoring.service");
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

const recalculatePropertyScore = asyncHandler(async (req, res) => {
  const { id } = parseRequest(propertyIdParamsSchema, req.params);
  const property = await dealScoringService.recalculatePropertyScore({
    id,
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Property score recalculated.",
    data: {
      property,
      scoring: property.scoring
    }
  });
});

module.exports = {
  recalculatePropertyScore
};
