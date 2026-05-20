const express = require("express");

const {
  createCheckout,
  createPortal,
  handleWebhook
} = require("../controllers/billing.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();
const webhookRouter = express.Router();

router.use(authenticate);
router.post("/checkout", createCheckout);
router.post("/portal", createPortal);

webhookRouter.post("/", handleWebhook);

module.exports = router;
module.exports.webhookRouter = webhookRouter;
