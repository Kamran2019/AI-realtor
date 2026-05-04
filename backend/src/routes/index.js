const express = require("express");
const authRoutes = require("./auth.routes");
const billingRoutes = require("./billing.routes");
const bookmarkRoutes = require("./bookmark.routes");
const healthRoutes = require("./health.routes");
const propertyNoteRoutes = require("./propertyNote.routes");
const propertyRoutes = require("./property.routes");
const scrapeRoutes = require("./scrape.routes");
const scoringRoutes = require("./scoring.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/billing", billingRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/health", healthRoutes);
router.use("/", propertyNoteRoutes);
router.use("/properties", propertyRoutes);
router.use("/scrape", scrapeRoutes);
router.use("/scoring", scoringRoutes);
router.use("/users", userRoutes);

module.exports = router;
