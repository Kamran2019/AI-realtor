const express = require("express");
const controller = require("../controllers/audit.controller");
const auth = require("../middleware/auth");
const authorize = require("../middleware/rbac");

const router = express.Router();

router.use(auth);
router.use(authorize("admin", "sub_admin"));
router.get("/", controller.listAuditLogs);

module.exports = router;

