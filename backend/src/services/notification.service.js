const Notification = require("../models/Notification");
const User = require("../models/User");
const emailService = require("./email.service");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

const toJSON = (document) => document.toJSON();

const getAddressLine = (property) =>
  [
    property.address?.line1,
    property.address?.city,
    property.address?.postcode
  ]
    .filter(Boolean)
    .join(", ") || "Property";

const getGuidePrice = (property) => property.prices?.guide?.amount ?? null;

const formatPrice = (property) => {
  const amount = getGuidePrice(property);

  if (amount === null || amount === undefined) {
    return "price unavailable";
  }

  return new Intl.NumberFormat("en-GB", {
    currency: property.prices?.guide?.currency || "GBP",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount);
};

const buildAlertNotificationContent = ({ alertRule, property }) => {
  const address = getAddressLine(property);
  const score = property.scoring?.total;
  const yieldValue = property.scoring?.grossYield;
  const scoreText = score === null || score === undefined ? "unscored" : `score ${score}`;
  const yieldText =
    yieldValue === null || yieldValue === undefined ? "yield unavailable" : `${yieldValue}% yield`;

  return {
    message: `${address} matched ${alertRule.name}: ${formatPrice(property)}, ${scoreText}, ${yieldText}.`,
    title: `Alert matched: ${alertRule.name}`
  };
};

const listNotifications = async ({ limit, page, unreadOnly = false, user }) => {
  const filter = {
    userId: user._id
  };

  if (unreadOnly) {
    filter.readAt = null;
  }

  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate("propertyId")
      .populate("alertRuleId")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter)
  ]);

  return {
    notifications: notifications.map((notification) => {
      const serializedNotification = toJSON(notification);

      if (notification.propertyId?.toJSON) {
        serializedNotification.property = notification.propertyId.toJSON();
        serializedNotification.propertyId = notification.propertyId._id.toString();
      }

      if (notification.alertRuleId?.toJSON) {
        serializedNotification.alertRule = notification.alertRuleId.toJSON();
        serializedNotification.alertRuleId = notification.alertRuleId._id.toString();
      }

      return serializedNotification;
    }),
    pagination: {
      limit,
      page,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

const getUnreadCount = ({ user }) =>
  Notification.countDocuments({
    readAt: null,
    userId: user._id
  });

const markRead = async ({ id, user }) => {
  const notification = await Notification.findOne({
    _id: id,
    userId: user._id
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found.");
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  return toJSON(notification);
};

const markAllRead = async ({ user }) => {
  const result = await Notification.updateMany(
    {
      readAt: null,
      userId: user._id
    },
    {
      $set: {
        readAt: new Date()
      }
    }
  );

  return {
    modifiedCount: result.modifiedCount
  };
};

const createInAppNotification = async ({ alertRule, channels, property }) => {
  if (!channels.includes("in_app")) {
    return null;
  }

  const content = buildAlertNotificationContent({ alertRule, property });
  const notification = await Notification.create({
    alertRuleId: alertRule._id,
    channels,
    message: content.message,
    metadata: {
      alertCriteria: alertRule.criteria,
      matchedAt: new Date(),
      score: property.scoring?.total ?? null
    },
    propertyId: property._id,
    title: content.title,
    userId: alertRule.userId
  });

  return toJSON(notification);
};

const sendEmailNotification = async ({ alertRule, channels, property }) => {
  if (!channels.includes("email")) {
    return null;
  }

  const user = await User.findById(alertRule.userId);

  if (!user || user.settings?.emailNotifications === false) {
    return null;
  }

  try {
    return await emailService.sendAlertNotificationEmail({
      alertRule,
      property,
      user
    });
  } catch (error) {
    logger.error("Alert email notification failed.", {
      error: error.message,
      alertRuleId: alertRule._id.toString(),
      propertyId: property._id.toString()
    });
    return null;
  }
};

const createAlertNotification = async ({ alertRule, property }) => {
  const channels = [...new Set(alertRule.channels || [])];
  const [notification, email] = await Promise.all([
    createInAppNotification({ alertRule, channels, property }),
    sendEmailNotification({ alertRule, channels, property })
  ]);

  return {
    email,
    notification
  };
};

module.exports = {
  buildAlertNotificationContent,
  createAlertNotification,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead
};
