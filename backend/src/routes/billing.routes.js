const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/billing.controller");
const auth = require("../middleware/auth");
const authorize = require("../middleware/rbac");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/webhooks", controller.webhook);
router.use(auth);

router.get("/summary", controller.getBillingSummary);
router.post(
  "/checkout-session",
  authorize("admin"),
  [body("plan").isIn(["starter", "pro", "enterprise"]), body("interval").isIn(["monthly", "yearly"])],
  validate,
  controller.createCheckout
);
router.post("/portal-link", authorize("admin"), controller.createPortal);

module.exports = router;

