const env = require("../config/env");

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: env.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
}

module.exports = {
  getRefreshCookieOptions,
};

