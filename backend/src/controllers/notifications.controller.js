const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user._id,
  }).sort({ createdAt: -1 });

  res.json({
    items: notifications,
    unreadCount: notifications.filter((item) => !item.isRead).length,
  });
});

const markRead = asyncHandler(async (req, res) => {
  if (req.params.id === "all") {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.json({ message: "All notifications marked as read" });
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

  res.json({ notification });
});

module.exports = {
  listNotifications,
  markRead,
};

