const express = require("express");

const {
  listBookmarks,
  toggleBookmark
} = require("../controllers/bookmark.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", listBookmarks);
router.post("/:propertyId/toggle", toggleBookmark);

module.exports = router;
