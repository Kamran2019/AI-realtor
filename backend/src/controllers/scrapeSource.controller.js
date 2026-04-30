const {
  createSourceSchema,
  listQuerySchema,
  sourceIdParamsSchema,
  updateSourceSchema,
  updateSourceStatusSchema
} = require("../validators/scrapeSource.validator");
const scrapeSourceService = require("../services/scrapeSource.service");
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
  const source = await scrapeSourceService.createSource(
    req.user._id,
    parseRequest(createSourceSchema, req.body)
  );

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
  const source = await scrapeSourceService.updateSource({
    id,
    ownerUserId: req.user._id,
    updates: parseRequest(updateSourceSchema, req.body)
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

module.exports = {
  createSource,
  listRuns,
  listSources,
  updateSource,
  updateSourceStatus
};
