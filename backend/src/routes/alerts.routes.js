const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/alerts.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { enforcePlanLimit } = require("../middleware/featureGate");

const router = express.Router();

router.use(auth);
router.get("/", controller.listAlerts);
router.post(
  "/",
  enforcePlanLimit("alertRules"),
  [body("name").isLength({ min: 2 })],
  validate,
  controller.createAlert
);
router.put("/:id", controller.updateAlert);
router.delete("/:id", controller.deleteAlert);

module.exports = router;

