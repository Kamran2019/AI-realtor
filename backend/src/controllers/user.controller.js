const {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamsSchema
} = require("../validators/user.validator");
const userService = require("../services/user.service");
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

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(parseRequest(listUsersQuerySchema, req.query));

  sendResponse(res, 200, {
    success: true,
    message: "Users loaded.",
    data: result
  });
});

const getUser = asyncHandler(async (req, res) => {
  const { id } = parseRequest(userIdParamsSchema, req.params);
  const user = await userService.getUserById(id);

  sendResponse(res, 200, {
    success: true,
    message: "User loaded.",
    data: {
      user
    }
  });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(parseRequest(createUserSchema, req.body));

  sendResponse(res, 201, {
    success: true,
    message: "User created.",
    data: {
      user
    }
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = parseRequest(userIdParamsSchema, req.params);
  const user = await userService.updateUser(
    id,
    parseRequest(updateUserSchema, req.body),
    req.user._id
  );

  sendResponse(res, 200, {
    success: true,
    message: "User updated.",
    data: {
      user
    }
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = parseRequest(userIdParamsSchema, req.params);
  const { status } = parseRequest(updateUserStatusSchema, req.body);
  const user = await userService.updateUserStatus(id, status, req.user._id);

  sendResponse(res, 200, {
    success: true,
    message: "User status updated.",
    data: {
      user
    }
  });
});

module.exports = {
  createUser,
  getUser,
  listUsers,
  updateUser,
  updateUserStatus
};
