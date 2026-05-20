const express = require("express");

const {
  createNote,
  deleteNote,
  listNotes,
  updateNote
} = require("../controllers/propertyNote.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/properties/:propertyId/notes", authenticate, listNotes);
router.post("/properties/:propertyId/notes", authenticate, createNote);
router.patch("/notes/:id", authenticate, updateNote);
router.delete("/notes/:id", authenticate, deleteNote);

module.exports = router;
