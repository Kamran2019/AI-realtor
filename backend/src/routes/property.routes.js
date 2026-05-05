const express = require("express");

const {
  exportPropertyCsv
} = require("../controllers/report.controller");
const {
  getProperty,
  listProperties,
  updateProperty
} = require("../controllers/property.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRoles } = require("../middlewares/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", listProperties);
router.get("/export.csv", exportPropertyCsv);
router.get("/:id", getProperty);
router.patch("/:id", requireRoles("admin", "sub_admin"), updateProperty);

module.exports = router;
