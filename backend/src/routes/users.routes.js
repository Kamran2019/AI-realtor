const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/users.controller");
const auth = require("../middleware/auth");
const authorize = require("../middleware/rbac");
const validate = require("../middleware/validate");
const { enforcePlanLimit } = require("../middleware/featureGate");

const router = express.Router();

router.use(auth);

router.put("/me/settings", controller.updateMySettings);
router.get("/", authorize("admin"), controller.listUsers);
router.post(
  "/",
  authorize("admin"),
  enforcePlanLimit("users"),
  [
    body("name").isLength({ min: 2 }),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("role").isIn(["sub_admin", "user"]),
  ],
  validate,
  controller.createUser
);
router.put(
  "/:id",
  authorize("admin"),
  [body("role").optional().isIn(["sub_admin", "user"]), body("isActive").optional().isBoolean()],
  validate,
  controller.updateUser
);

module.exports = router;

