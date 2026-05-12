const express = require("express");

const {
  addManualDefect,
  addRoom,
  authorizeInspectionAccess,
  changeInspectionStatus,
  createInspection,
  deleteDefect,
  deleteInspection,
  getInspectionById,
  listInspections,
  updateDefect,
  updateInspection,
  updateRoom,
  uploadRoomImage
} = require("../controllers/inspection.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { uploadInspectionImage } = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", listInspections);
router.post("/", createInspection);
router.get("/:id", getInspectionById);
router.patch("/:id", updateInspection);
router.delete("/:id", deleteInspection);
router.post("/:id/rooms", addRoom);
router.patch("/:id/rooms/:roomId", updateRoom);
router.post("/:id/rooms/:roomId/images", authorizeInspectionAccess, uploadInspectionImage, uploadRoomImage);
router.post("/:id/rooms/:roomId/defects", addManualDefect);
router.patch("/:id/rooms/:roomId/defects/:defectId", updateDefect);
router.delete("/:id/rooms/:roomId/defects/:defectId", deleteDefect);
router.patch("/:id/status", changeInspectionStatus);

module.exports = router;
