const multer = require("multer");

const ApiError = require("../utils/ApiError");

const MAX_INSPECTION_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_INSPECTION_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const inspectionImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_INSPECTION_IMAGE_BYTES
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_INSPECTION_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(new ApiError(400, "Invalid image type. Upload a JPG, PNG, or WebP image."));
      return;
    }

    callback(null, true);
  }
});

const uploadInspectionImage = (req, res, next) => {
  inspectionImageUpload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(400, "Image must be 10MB or smaller."));
      return;
    }

    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(400, "Invalid image upload."));
  });
};

module.exports = {
  ALLOWED_INSPECTION_IMAGE_MIME_TYPES,
  MAX_INSPECTION_IMAGE_BYTES,
  uploadInspectionImage
};
