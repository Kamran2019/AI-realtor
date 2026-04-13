const express = require("express");
const controller = require("../controllers/reports.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/public/:token", controller.getPublicReport);
router.get("/public/:token/download", controller.downloadPublicReport);

router.use(auth);
router.get("/", controller.listReports);
router.get("/:id", controller.getReport);
router.post("/:id/share-enable", controller.enableShare);
router.post("/:id/share-disable", controller.disableShare);

module.exports = router;

