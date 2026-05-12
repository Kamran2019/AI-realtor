const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const { listAuditLogs, listAuditLogsSchema } = require("../services/auditLog.service");

const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: issue.message
  }));

const getAuditLogs = asyncHandler(async (req, res) => {
  const parsedQuery = listAuditLogsSchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(400, "Validation failed", formatValidationIssues(parsedQuery.error.issues));
  }

  const result = await listAuditLogs(parsedQuery.data);

  sendResponse(res, 200, {
    success: true,
    message: "Audit logs loaded.",
    data: result
  });
});

module.exports = {
  getAuditLogs
};
