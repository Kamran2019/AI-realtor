const {
  alertIdParamsSchema,
  createAlertRuleSchema,
  updateAlertRuleSchema
} = require("../validators/alert.validator");
const alertService = require("../services/alert.service");
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

const listAlertRules = asyncHandler(async (req, res) => {
  const alertRules = await alertService.listAlertRules({ user: req.user });

  sendResponse(res, 200, {
    success: true,
    message: "Alert rules loaded.",
    data: {
      alertRules
    }
  });
});

const createAlertRule = asyncHandler(async (req, res) => {
  const alertRule = await alertService.createAlertRule({
    payload: parseRequest(createAlertRuleSchema, req.body),
    user: req.user
  });

  sendResponse(res, 201, {
    success: true,
    message: "Alert rule created.",
    data: {
      alertRule
    }
  });
});

const updateAlertRule = asyncHandler(async (req, res) => {
  const { id } = parseRequest(alertIdParamsSchema, req.params);
  const alertRule = await alertService.updateAlertRule({
    id,
    payload: parseRequest(updateAlertRuleSchema, req.body),
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Alert rule updated.",
    data: {
      alertRule
    }
  });
});

const deleteAlertRule = asyncHandler(async (req, res) => {
  const { id } = parseRequest(alertIdParamsSchema, req.params);
  const result = await alertService.deleteAlertRule({
    id,
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Alert rule deleted.",
    data: result
  });
});

module.exports = {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  updateAlertRule
};
