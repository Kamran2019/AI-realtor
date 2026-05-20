const {
  createSourceSchema,
  listQuerySchema,
  sourceIdParamsSchema,
  updateSourceSchema,
  updateSourceStatusSchema
} = require("../validators/scrapeSource.validator");
const scrapeSourceService = require("../services/scrapeSource.service");
const scraperRunnerService = require("../services/scraperRunner.service");
const { recordAuditForRequest } = require("../services/auditLog.service");
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

const listSources = asyncHandler(async (req, res) => {
  const result = await scrapeSourceService.listSources({
    ...parseRequest(listQuerySchema, req.query),
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Scrape sources loaded.",
    data: result
  });
});

const createSource = asyncHandler(async (req, res) => {
  const payload = parseRequest(createSourceSchema, req.body);
  const source = await scrapeSourceService.createSource(req.user._id, payload);
  await recordAuditForRequest(req, {
    action: "scrape_source_created",
    entityType: "scrape_source",
    entityId: source.id,
    status: "success",
    meta: {
      key: source.key,
      name: source.name
    }
  });

  sendResponse(res, 201, {
    success: true,
    message: "Scrape source created.",
    data: {
      source
    }
  });
});

const updateSource = asyncHandler(async (req, res) => {
  const { id } = parseRequest(sourceIdParamsSchema, req.params);
  const updates = parseRequest(updateSourceSchema, req.body);
  const source = await scrapeSourceService.updateSource({
    id,
    ownerUserId: req.user._id,
    updates
  });
  await recordAuditForRequest(req, {
    action: "scrape_source_updated",
    entityType: "scrape_source",
    entityId: source.id,
    status: "success",
    meta: updates
  });

  sendResponse(res, 200, {
    success: true,
    message: "Scrape source updated.",
    data: {
      source
    }
  });
});

const updateSourceStatus = asyncHandler(async (req, res) => {
  const { id } = parseRequest(sourceIdParamsSchema, req.params);
  const { isEnabled } = parseRequest(updateSourceStatusSchema, req.body);
  const source = await scrapeSourceService.updateSourceStatus({
    id,
    isEnabled,
    ownerUserId: req.user._id
  });
  await recordAuditForRequest(req, {
    action: "scrape_source_status_updated",
    entityType: "scrape_source",
    entityId: source.id,
    status: "success",
    meta: {
      isEnabled
    }
  });

  sendResponse(res, 200, {
    success: true,
    message: "Scrape source status updated.",
    data: {
      source
    }
  });
});

const listRuns = asyncHandler(async (req, res) => {
  const result = await scrapeSourceService.listRuns({
    ...parseRequest(listQuerySchema.pick({ page: true, limit: true }), req.query),
    ownerUserId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Scrape runs loaded.",
    data: result
  });
});

const runSource = asyncHandler(async (req, res) => {
  const { id } = parseRequest(sourceIdParamsSchema, req.params);
  const run = await scraperRunnerService.runSource({
    ownerUserId: req.user._id,
    sourceId: id
  });
  await recordAuditForRequest(req, {
    action: run.status === "completed" ? "inspection_completed" : "inspection_failed",
    entityType: "scrape_run",
    entityId: run.id,
    status: run.status === "completed" ? "success" : "failure",
    meta: {
      sourceId: id,
      stats: run.stats
    }
  });

  sendResponse(res, 200, {
    success: true,
    message: "Scrape run finished.",
    data: {
      run
    }
  });
});

module.exports = {
  createSource,
  listRuns,
  listSources,
  runSource,
  updateSource,
  updateSourceStatus
};
