const express = require("express");
const {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail
} = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/resend-verification", resendVerification);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

module.exports = router;
