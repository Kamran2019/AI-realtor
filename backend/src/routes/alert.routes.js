const express = require("express");

const {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  updateAlertRule
} = require("../controllers/alert.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", listAlertRules);
router.post("/", createAlertRule);
router.patch("/:id", updateAlertRule);
router.delete("/:id", deleteAlertRule);

module.exports = router;
