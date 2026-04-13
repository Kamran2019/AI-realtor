const express = require("express");
const controller = require("../controllers/properties.controller");
const auth = require("../middleware/auth");
const authorize = require("../middleware/rbac");
const { enforcePlanLimit } = require("../middleware/featureGate");

const router = express.Router();

router.use(auth);

router.get("/", controller.listProperties);
router.get("/export/csv", controller.exportCsv);
router.get("/:id", controller.getProperty);
router.post("/", authorize("admin", "sub_admin"), controller.createProperty);
router.put("/:id", authorize("admin", "sub_admin"), controller.updateProperty);
router.post(
  "/:id/generate-pdf",
  authorize("admin", "sub_admin", "user"),
  enforcePlanLimit("propertyReports"),
  controller.generatePdf
);

module.exports = router;

