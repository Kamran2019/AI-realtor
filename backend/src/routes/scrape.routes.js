const express = require("express");
const controller = require("../controllers/scrape.controller");
const auth = require("../middleware/auth");
const authorize = require("../middleware/rbac");

const router = express.Router();

router.use(auth);
router.use(authorize("admin", "sub_admin"));

router.get("/sources", controller.listSources);
router.post("/sources", controller.createSource);
router.put("/sources/:id", controller.updateSource);
router.delete("/sources/:id", controller.deleteSource);
router.get("/runs", controller.listRuns);
router.post("/sources/:id/run", controller.triggerRun);

module.exports = router;

