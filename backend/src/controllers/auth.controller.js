const { signupSchema } = require("../validators/auth.validator");
const authService = require("../services/auth.service");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: issue.message
  }));

const signup = asyncHandler(async (req, res) => {
  const parsedBody = signupSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(400, "Validation failed", formatValidationIssues(parsedBody.error.issues));
  }

  const user = await authService.signup(parsedBody.data);

  sendResponse(res, 201, {
    success: true,
    message: "Account created successfully.",
    data: {
      user
    }
  });
});

module.exports = { signup };
