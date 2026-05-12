const express = require("express");

const { getAdminDashboard } = require("../controllers/adminDashboard.controller");
const { getAuditLogs } = require("../controllers/auditLog.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRoles } = require("../middlewares/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/dashboard", requireRoles("admin", "sub_admin"), getAdminDashboard);
router.get("/audit-logs", requireRoles("admin"), getAuditLogs);

module.exports = router;
