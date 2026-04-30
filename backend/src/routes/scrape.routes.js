const express = require("express");

const {
  createSource,
  listRuns,
  listSources,
  updateSource,
  updateSourceStatus
} = require("../controllers/scrapeSource.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRoles } = require("../middlewares/rbac.middleware");

const router = express.Router();

router.use(authenticate);
router.use(requireRoles("admin", "sub_admin"));

router.get("/sources", listSources);
router.post("/sources", createSource);
router.patch("/sources/:id", updateSource);
router.patch("/sources/:id/status", updateSourceStatus);
router.get("/runs", listRuns);

module.exports = router;
