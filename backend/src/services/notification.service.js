const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./email.service");

async function createNotification({
  ownerUserId,
  userId,
  type,
  title,
  message,
  data = {},
  channels = { inApp: true, email: false },
}) {
  let notification = null;

  if (channels.inApp) {
    notification = await Notification.create({
      ownerUserId,
      userId,
      type,
      title,
      message,
      data,
    });
  }

  if (channels.email) {
    const user = await User.findById(userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        text: message,
        html: `<p>${message}</p>`,
      });
    }
  }

  return notification;
}

module.exports = {
  createNotification,
};

