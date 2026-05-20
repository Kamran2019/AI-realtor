const express = require("express");

const {
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead
} = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = router;
