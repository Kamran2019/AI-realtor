const express = require("express");
const authRoutes = require("./auth.routes");
const billingRoutes = require("./billing.routes");
const healthRoutes = require("./health.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/billing", billingRoutes);
router.use("/health", healthRoutes);
router.use("/users", userRoutes);

module.exports = router;
