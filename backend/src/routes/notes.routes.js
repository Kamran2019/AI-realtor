const express = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/notes.controller");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(auth);
router.get("/", controller.listNotes);
router.post(
  "/",
  [body("propertyId").notEmpty(), body("text").isLength({ min: 1 })],
  validate,
  controller.createNote
);
router.put("/:id", [body("text").isLength({ min: 1 })], validate, controller.updateNote);
router.delete("/:id", controller.deleteNote);

module.exports = router;

