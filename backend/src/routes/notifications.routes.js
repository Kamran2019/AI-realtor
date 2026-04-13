const express = require("express");
const controller = require("../controllers/notifications.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);
router.get("/", controller.listNotifications);
router.post("/:id/read", controller.markRead);

module.exports = router;

