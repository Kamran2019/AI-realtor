const {
  notificationIdParamsSchema,
  notificationListQuerySchema
} = require("../validators/alert.validator");
const notificationService = require("../services/notification.service");
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

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications({
    ...parseRequest(notificationListQuerySchema, req.query),
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Notifications loaded.",
    data: result
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount({ user: req.user });

  sendResponse(res, 200, {
    success: true,
    message: "Unread notifications counted.",
    data: {
      unreadCount
    }
  });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = parseRequest(notificationIdParamsSchema, req.params);
  const notification = await notificationService.markRead({
    id,
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Notification marked read.",
    data: {
      notification
    }
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead({ user: req.user });
  const unreadCount = await notificationService.getUnreadCount({ user: req.user });

  sendResponse(res, 200, {
    success: true,
    message: "Notifications marked read.",
    data: {
      ...result,
      unreadCount
    }
  });
});

module.exports = {
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead
};
