const express = require("express");

const { recalculatePropertyScore } = require("../controllers/scoring.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRoles } = require("../middlewares/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.post(
  "/properties/:id/recalculate",
  requireRoles("admin", "sub_admin"),
  recalculatePropertyScore
);

module.exports = router;
