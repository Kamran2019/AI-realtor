const express = require("express");
const {
  createUser,
  getUser,
  listUsers,
  updateUser,
  updateUserStatus
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRoles } = require("../middlewares/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", requireRoles("admin", "sub_admin"), listUsers);
router.get("/:id", requireRoles("admin", "sub_admin"), getUser);
router.post("/", requireRoles("admin"), createUser);
router.patch("/:id", requireRoles("admin"), updateUser);
router.patch("/:id/status", requireRoles("admin"), updateUserStatus);

module.exports = router;
