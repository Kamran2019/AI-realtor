const PropertyNote = require("../models/PropertyNote");
const Property = require("../models/Property");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sanitizeText } = require("../utils/text");

const createNote = asyncHandler(async (req, res) => {
  const { propertyId, text } = req.body;
  const property = await Property.findOne({
    _id: propertyId,
    ownerUserId: req.accountOwnerId,
  });

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  const note = await PropertyNote.create({
    ownerUserId: req.accountOwnerId,
    userId: req.user._id,
    propertyId,
    text: sanitizeText(text),
  });

  res.status(201).json({ note });
});

const listNotes = asyncHandler(async (req, res) => {
  const filters = { ownerUserId: req.accountOwnerId };
  if (req.query.propertyId) {
    filters.propertyId = req.query.propertyId;
  }
  const notes = await PropertyNote.find(filters).sort({ createdAt: -1 });
  res.json({ items: notes });
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await PropertyNote.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!note) {
    throw new AppError("Note not found", 404);
  }
  if (
    String(note.userId) !== String(req.user._id) &&
    !["admin", "sub_admin"].includes(req.user.role)
  ) {
    throw new AppError("You cannot edit this note", 403);
  }

  note.text = sanitizeText(req.body.text);
  await note.save();
  res.json({ note });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await PropertyNote.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!note) {
    throw new AppError("Note not found", 404);
  }
  if (
    String(note.userId) !== String(req.user._id) &&
    !["admin", "sub_admin"].includes(req.user.role)
  ) {
    throw new AppError("You cannot delete this note", 403);
  }

  await note.deleteOne();
  res.json({ message: "Note deleted" });
});

module.exports = {
  createNote,
  listNotes,
  updateNote,
  deleteNote,
};

