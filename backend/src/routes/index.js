const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./users.routes");
const billingRoutes = require("./billing.routes");
const propertyRoutes = require("./properties.routes");
const bookmarkRoutes = require("./bookmarks.routes");
const noteRoutes = require("./notes.routes");
const alertRoutes = require("./alerts.routes");
const notificationRoutes = require("./notifications.routes");
const inspectionRoutes = require("./inspections.routes");
const reportRoutes = require("./reports.routes");
const scrapeRoutes = require("./scrape.routes");
const auditRoutes = require("./audit.routes");
const dashboardRoutes = require("./dashboard.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/billing", billingRoutes);
router.use("/properties", propertyRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/notes", noteRoutes);
router.use("/alerts", alertRoutes);
router.use("/notifications", notificationRoutes);
router.use("/inspections", inspectionRoutes);
router.use("/reports", reportRoutes);
router.use("/scrape", scrapeRoutes);
router.use("/audit", auditRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
