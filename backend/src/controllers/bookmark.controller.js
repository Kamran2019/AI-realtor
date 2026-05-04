const {
  propertyIdParamsSchema
} = require("../validators/bookmarkNote.validator");
const bookmarkService = require("../services/bookmark.service");
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

const toggleBookmark = asyncHandler(async (req, res) => {
  const { propertyId } = parseRequest(propertyIdParamsSchema, req.params);
  const result = await bookmarkService.toggleBookmark({
    propertyId,
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: result.bookmarked ? "Bookmark added." : "Bookmark removed.",
    data: result
  });
});

const listBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await bookmarkService.listBookmarks({
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Bookmarks loaded.",
    data: {
      bookmarks
    }
  });
});

module.exports = {
  listBookmarks,
  toggleBookmark
};
