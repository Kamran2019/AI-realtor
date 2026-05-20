const Property = require("../models/Property");
const PropertyNote = require("../models/PropertyNote");
const ApiError = require("../utils/ApiError");

const elevatedRoles = new Set(["admin", "sub_admin"]);

const isElevatedUser = (user) => elevatedRoles.has(user.role);

const ownsNote = (note, user) => note.userId.toString() === user._id.toString();

const canManageNote = (note, user) => ownsNote(note, user) || isElevatedUser(user);

const toJSON = (document) => document.toJSON();

const serializeNote = (note) => {
  const serializedNote = toJSON(note);

  if (note.userId?.toJSON) {
    serializedNote.user = note.userId.toJSON();
    serializedNote.userId = note.userId._id.toString();
  }

  return serializedNote;
};

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

const findNote = async (id) => {
  const note = await PropertyNote.findById(id);

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  return note;
};

const listNotes = async ({ propertyId, user }) => {
  await findAccessibleProperty({ propertyId, user });

  const notes = await PropertyNote.find({ propertyId })
    .populate("userId")
    .sort({ updatedAt: -1, _id: -1 });

  return notes.map(serializeNote);
};

const createNote = async ({ propertyId, text, user }) => {
  await findAccessibleProperty({ propertyId, user });

  const note = await PropertyNote.create({
    propertyId,
    text,
    userId: user._id
  });

  return toJSON(note);
};

const updateNote = async ({ id, text, user }) => {
  const note = await findNote(id);

  if (!canManageNote(note, user)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }

  note.text = text;
  await note.save();

  return toJSON(note);
};

const deleteNote = async ({ id, user }) => {
  const note = await findNote(id);

  if (!canManageNote(note, user)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }

  await note.deleteOne();

  return {
    deleted: true
  };
};

module.exports = {
  createNote,
  deleteNote,
  listNotes,
  updateNote
};
