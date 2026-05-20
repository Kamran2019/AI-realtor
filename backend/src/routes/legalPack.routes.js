const express = require("express");
const multer = require("multer");

const {
  getLegalPackRisks,
  uploadLegalPack
} = require("../controllers/legalPack.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRoles } = require("../middlewares/rbac.middleware");
const { MAX_PDF_BYTES } = require("../services/legalPack.service");
const ApiError = require("../utils/ApiError");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PDF_BYTES
  },
  fileFilter(req, file, callback) {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfName = /\.pdf$/i.test(file.originalname || "");

    if (!isPdfMime || !isPdfName) {
      callback(new ApiError(400, "Invalid file type. Legal pack must be a PDF."));
      return;
    }

    callback(null, true);
  }
});

const uploadMiddleware = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(400, "PDF must be 20MB or smaller."));
      return;
    }

    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(400, "Invalid legal pack upload."));
  });
};

router.use(authenticate);

router.post("/:id/legal-pack", requireRoles("admin", "sub_admin"), uploadMiddleware, uploadLegalPack);
router.get("/:id/legal-pack/risks", getLegalPackRisks);

module.exports = router;
