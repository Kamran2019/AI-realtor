const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/signup",
  authRateLimiter,
  [
    body("name").isLength({ min: 2 }),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
  ],
  validate,
  controller.signup
);
router.post(
  "/login",
  authRateLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  controller.login
);
router.get("/me", auth, controller.me);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.post("/verify-email", [body("token").notEmpty()], validate, controller.verifyEmail);
router.post(
  "/request-reset",
  authRateLimiter,
  [body("email").isEmail()],
  validate,
  controller.requestResetPassword
);
router.post(
  "/reset-password",
  authRateLimiter,
  [body("token").notEmpty(), body("password").isLength({ min: 8 })],
  validate,
  controller.resetPassword
);
router.get("/google", controller.googleAuth);
router.get("/google/callback", ...controller.googleCallback);
router.get("/google/failure", controller.googleFailure);

module.exports = router;

