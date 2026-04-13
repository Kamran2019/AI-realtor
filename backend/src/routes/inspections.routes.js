const express = require("express");
const controller = require("../controllers/inspections.controller");
const auth = require("../middleware/auth");
const authorize = require("../middleware/rbac");
const upload = require("../middleware/upload");
const { enforcePlanLimit } = require("../middleware/featureGate");

const router = express.Router();

router.use(auth);
router.get("/", controller.listInspections);
router.post("/", enforcePlanLimit("inspections"), controller.createInspection);
router.get("/:id", controller.getInspection);
router.put("/:id", controller.updateInspection);
router.post("/:id/images", upload.array("images", 10), controller.uploadInspectionImages);
router.post("/:id/ai-detect", controller.runAiDetection);
router.post("/:id/finalize", controller.finalizeInspection);
router.post(
  "/:id/generate-report",
  authorize("admin", "sub_admin", "user"),
  controller.generateInspectionReport
);

module.exports = router;

