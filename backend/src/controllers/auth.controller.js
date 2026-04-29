const env = require("../config/env");
const {
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema
} = require("../validators/auth.validator");
const authService = require("../services/auth.service");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const COOKIE_PATH = "/api/auth";
const DURATION_UNITS_IN_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: issue.message
  }));

const parseDurationToMs = (duration) => {
  const match = String(duration).trim().match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    return undefined;
  }

  const [, amount, unit] = match;

  return Number(amount) * DURATION_UNITS_IN_MS[unit];
};

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: COOKIE_PATH
});

const setRefreshCookie = (res, refreshToken) => {
  const maxAge = parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN);

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...getRefreshCookieOptions(),
    ...(maxAge ? { maxAge } : {})
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieOptions());
};

const parseRequestBody = (schema, body) => {
  const parsedBody = schema.safeParse(body);

  if (!parsedBody.success) {
    throw new ApiError(400, "Validation failed", formatValidationIssues(parsedBody.error.issues));
  }

  return parsedBody.data;
};

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(parseRequestBody(signupSchema, req.body));

  sendResponse(res, 201, {
    success: true,
    message: "Account created successfully. Please check your email to verify your account.",
    data: {
      user
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(
    parseRequestBody(loginSchema, req.body)
  );

  setRefreshCookie(res, refreshToken);

  sendResponse(res, 200, {
    success: true,
    message: "Logged in successfully.",
    data: {
      accessToken,
      user
    }
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(parseRequestBody(resendVerificationSchema, req.body));

  sendResponse(res, 200, {
    success: true,
    message: "Verification email sent if the account can receive it.",
    data: null
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(parseRequestBody(verifyEmailSchema, req.body));

  sendResponse(res, 200, {
    success: true,
    message: "Email verified successfully.",
    data: {
      user
    }
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(parseRequestBody(forgotPasswordSchema, req.body));

  sendResponse(res, 200, {
    success: true,
    message: "If an account exists, password reset instructions have been sent.",
    data: null
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(parseRequestBody(resetPasswordSchema, req.body));
  clearRefreshCookie(res);

  sendResponse(res, 200, {
    success: true,
    message: "Password reset successfully.",
    data: null
  });
});

const refresh = asyncHandler(async (req, res) => {
  try {
    const { accessToken, user } = await authService.refreshSession(
      req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
    );

    sendResponse(res, 200, {
      success: true,
      message: "Session refreshed.",
      data: {
        accessToken,
        user
      }
    });
  } catch (error) {
    if (error.statusCode === 401) {
      clearRefreshCookie(res);
    }

    throw error;
  }
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]);
  clearRefreshCookie(res);

  sendResponse(res, 200, {
    success: true,
    message: "Logged out successfully.",
    data: null
  });
});

const me = asyncHandler(async (req, res) => {
  sendResponse(res, 200, {
    success: true,
    message: "Current user loaded.",
    data: {
      user: req.user.toJSON()
    }
  });
});

module.exports = {
  clearRefreshCookie,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  resendVerification,
  resetPassword,
  verifyEmail,
  signup
};
