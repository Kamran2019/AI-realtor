const {
  listQuerySchema,
  patchPropertySchema,
  propertyIdParamsSchema
} = require("../validators/property.validator");
const propertyService = require("../services/property.service");
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

const listProperties = asyncHandler(async (req, res) => {
  const result = await propertyService.listProperties({
    ...parseRequest(listQuerySchema, req.query),
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Properties loaded.",
    data: result
  });
});

const getProperty = asyncHandler(async (req, res) => {
  const { id } = parseRequest(propertyIdParamsSchema, req.params);
  const property = await propertyService.getProperty({
    id,
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Property loaded.",
    data: {
      property
    }
  });
});

const updateProperty = asyncHandler(async (req, res) => {
  const { id } = parseRequest(propertyIdParamsSchema, req.params);
  const property = await propertyService.updateProperty({
    id,
    ownerUserId: req.user._id,
    updates: parseRequest(patchPropertySchema, req.body)
  });

  sendResponse(res, 200, {
    success: true,
    message: "Property updated.",
    data: {
      property
    }
  });
});

module.exports = {
  getProperty,
  listProperties,
  updateProperty
};
