const express = require("express");
const controller = require("../controllers/bookmarks.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);
router.get("/", controller.listBookmarks);
router.post("/toggle", controller.toggleBookmark);

module.exports = router;

