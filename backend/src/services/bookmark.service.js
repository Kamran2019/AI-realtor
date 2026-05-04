const Property = require("../models/Property");
const PropertyBookmark = require("../models/PropertyBookmark");
const ApiError = require("../utils/ApiError");

const elevatedRoles = new Set(["admin", "sub_admin"]);

const isElevatedUser = (user) => elevatedRoles.has(user.role);

const toJSON = (document) => document.toJSON();

const findAccessibleProperty = async ({ propertyId, user }) => {
  const filter = { _id: propertyId };

  if (!isElevatedUser(user)) {
    filter.ownerUserId = user._id;
  }

  const property = await Property.findOne(filter);

  if (!property) {
    throw new ApiError(404, "Property not found.");
  }

  return property;
};

const toggleBookmark = async ({ propertyId, user }) => {
  await findAccessibleProperty({ propertyId, user });

  const existingBookmark = await PropertyBookmark.findOneAndDelete({
    propertyId,
    userId: user._id
  });

  if (existingBookmark) {
    return {
      bookmark: null,
      bookmarked: false
    };
  }

  try {
    const bookmark = await PropertyBookmark.create({
      propertyId,
      userId: user._id
    });

    return {
      bookmark: toJSON(bookmark),
      bookmarked: true
    };
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const bookmark = await PropertyBookmark.findOne({
      propertyId,
      userId: user._id
    });

    return {
      bookmark: bookmark ? toJSON(bookmark) : null,
      bookmarked: true
    };
  }
};

const listBookmarks = async ({ user }) => {
  const bookmarks = await PropertyBookmark.find({ userId: user._id })
    .populate("propertyId")
    .sort({ createdAt: -1, _id: -1 });

  return bookmarks.map((bookmark) => {
    const serializedBookmark = toJSON(bookmark);

    if (bookmark.propertyId?.toJSON) {
      serializedBookmark.property = bookmark.propertyId.toJSON();
      serializedBookmark.propertyId = bookmark.propertyId._id.toString();
    }

    return serializedBookmark;
  });
};

module.exports = {
  listBookmarks,
  toggleBookmark
};
