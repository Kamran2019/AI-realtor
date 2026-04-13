const PropertyBookmark = require("../models/PropertyBookmark");
const Property = require("../models/Property");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { getPlanLimit, hasUnlimitedAccess } = require("../config/plans");

const toggleBookmark = asyncHandler(async (req, res) => {
  const { propertyId } = req.body;
  const property = await Property.findOne({
    _id: propertyId,
    ownerUserId: req.accountOwnerId,
  });
  if (!property) {
    throw new AppError("Property not found", 404);
  }

  const existing = await PropertyBookmark.findOne({
    userId: req.user._id,
    propertyId,
  });

  if (existing) {
    await existing.deleteOne();
    return res.json({ bookmarked: false });
  }

  const owner = await User.findById(req.accountOwnerId);
  const plan = owner?.subscription?.plan || "free";
  if (!hasUnlimitedAccess(plan, "propertyBookmarks")) {
    const count = await PropertyBookmark.countDocuments({ userId: req.user._id });
    if (count >= getPlanLimit(plan, "propertyBookmarks")) {
      throw new AppError(
        `Your ${plan} plan has reached the bookmark limit. Upgrade to continue.`,
        403
      );
    }
  }

  await PropertyBookmark.create({
    userId: req.user._id,
    propertyId,
  });

  res.json({ bookmarked: true });
});

const listBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await PropertyBookmark.find({ userId: req.user._id }).populate("propertyId");
  res.json({
    items: bookmarks,
  });
});

module.exports = {
  toggleBookmark,
  listBookmarks,
};
