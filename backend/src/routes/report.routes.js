const express = require("express");

const {
  downloadReport,
  generatePropertyReport,
  getReport,
  listReports
} = require("../controllers/report.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/property/:propertyId", generatePropertyReport);
router.get("/", listReports);
router.get("/:id/download", downloadReport);
router.get("/:id", getReport);

module.exports = router;
