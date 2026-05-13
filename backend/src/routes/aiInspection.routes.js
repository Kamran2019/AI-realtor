const express = require("express");

const { runImageDetection } = require("../controllers/aiInspection.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/:inspectionId/rooms/:roomId/images/:imageIndex/detect", runImageDetection);

module.exports = router;
