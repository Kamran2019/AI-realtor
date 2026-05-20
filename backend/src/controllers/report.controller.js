const { z } = require("zod");

const { listQuerySchema } = require("../validators/property.validator");
const csvExportService = require("../services/csvExport.service");
const { recordAuditForRequest } = require("../services/auditLog.service");
const reportService = require("../services/report.service");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const objectIdSchema = (fieldName) =>
  z
    .string({
      required_error: `${fieldName} is required`
    })
    .trim()
    .regex(/^[a-f\d]{24}$/i, `Invalid ${fieldName}`);

const propertyReportParamsSchema = z
  .object({
    propertyId: objectIdSchema("property ID")
  })
  .strict("Unknown fields are not allowed");

const reportParamsSchema = z
  .object({
    id: objectIdSchema("report ID")
  })
  .strict("Unknown fields are not allowed");

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

const exportPropertyCsv = asyncHandler(async (req, res) => {
  const csv = await csvExportService.generatePropertyCsv({
    ...parseRequest(listQuerySchema, req.query),
    ownerUserId: req.user._id
  });

  res
    .status(200)
    .type("text/csv")
    .set("Content-Disposition", 'attachment; filename="properties.csv"')
    .send(csv);
});

const generatePropertyReport = asyncHandler(async (req, res) => {
  const { propertyId } = parseRequest(propertyReportParamsSchema, req.params);
  const report = await reportService.generatePropertyReport({
    ownerUserId: req.user._id,
    propertyId,
    user: req.user
  });
  await recordAuditForRequest(req, {
    action: "report_generated",
    entityType: "report",
    entityId: report.id,
    status: "success",
    meta: {
      propertyId
    }
  });

  sendResponse(res, 201, {
    success: true,
    message: "Property report generated.",
    data: {
      report
    }
  });
});

const listReports = asyncHandler(async (req, res) => {
  const reports = await reportService.listReports({
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Reports loaded.",
    data: {
      reports
    }
  });
});

const getReport = asyncHandler(async (req, res) => {
  const { id } = parseRequest(reportParamsSchema, req.params);
  const report = await reportService.getReport({
    id,
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Report loaded.",
    data: {
      report
    }
  });
});

const downloadReport = asyncHandler(async (req, res) => {
  const { id } = parseRequest(reportParamsSchema, req.params);
  const file = await reportService.getReportFile({
    id,
    ownerUserId: req.user._id
  });
  await recordAuditForRequest(req, {
    action: "report_shared",
    entityType: "report",
    entityId: id,
    status: "success",
    meta: {
      mimeType: file.mimeType,
      fileName: file.fileName
    }
  });

  res
    .status(200)
    .type(file.mimeType)
    .set("Content-Disposition", `attachment; filename="${file.fileName}"`)
    .send(file.buffer);
});

module.exports = {
  downloadReport,
  exportPropertyCsv,
  generatePropertyReport,
  getReport,
  listReports
};
