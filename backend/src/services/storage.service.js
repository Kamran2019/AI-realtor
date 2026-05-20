const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const ApiError = require("../utils/ApiError");

const STORAGE_ROOT = process.env.REPORT_STORAGE_DIR || path.resolve(__dirname, "../../uploads");
const INSPECTION_STORAGE_ROOT =
  process.env.INSPECTION_STORAGE_DIR || path.resolve(__dirname, "../../uploads/inspections");
const INSPECTION_PUBLIC_PREFIX = "/uploads/inspections";

const inspectionMimeExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const resolveStoragePath = (key) => {
  if (!key || typeof key !== "string") {
    throw new ApiError(400, "Storage key is required.");
  }

  const storagePath = path.resolve(STORAGE_ROOT, key);
  const rootWithSeparator = `${path.resolve(STORAGE_ROOT)}${path.sep}`;

  if (!storagePath.startsWith(rootWithSeparator)) {
    throw new ApiError(400, "Invalid storage key.");
  }

  return storagePath;
};

const writeBuffer = async ({ buffer, key }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ApiError(500, "Report storage failed.");
  }

  const storagePath = resolveStoragePath(key);

  try {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(storagePath, buffer, { flag: "w" });
  } catch (error) {
    throw new ApiError(500, "Report storage failed.");
  }

  return {
    key,
    sizeBytes: buffer.length
  };
};

const readBuffer = async (key) => {
  const storagePath = resolveStoragePath(key);

  try {
    return await fs.readFile(storagePath);
  } catch (error) {
    throw new ApiError(404, "Report file not found.");
  }
};

const detectImageMimeType = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

const generateInspectionFileName = ({ inspectionId, mimeType }) => {
  const extension = inspectionMimeExtensions[mimeType];
  const random = crypto.randomBytes(8).toString("hex");

  return `inspection_${inspectionId}_${Date.now()}_${random}.${extension}`;
};

const storeInspectionImage = async ({ file, inspectionId }) => {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new ApiError(400, "Image file is required.");
  }

  const extension = inspectionMimeExtensions[file.mimetype];

  if (!extension) {
    throw new ApiError(400, "Invalid image type. Upload a JPG, PNG, or WebP image.");
  }

  const detectedMimeType = detectImageMimeType(file.buffer);

  if (detectedMimeType !== file.mimetype) {
    throw new ApiError(400, "Invalid image type. Upload a JPG, PNG, or WebP image.");
  }

  const filename = generateInspectionFileName({ inspectionId, mimeType: file.mimetype });
  const storagePath = path.resolve(INSPECTION_STORAGE_ROOT, filename);
  const rootWithSeparator = `${path.resolve(INSPECTION_STORAGE_ROOT)}${path.sep}`;

  if (!storagePath.startsWith(rootWithSeparator)) {
    throw new ApiError(400, "Invalid storage key.");
  }

  try {
    await fs.mkdir(INSPECTION_STORAGE_ROOT, { recursive: true });
    await fs.writeFile(storagePath, file.buffer, { flag: "wx" });
  } catch (error) {
    throw new ApiError(500, "Inspection image storage failed.");
  }

  return {
    filename,
    key: `inspections/${filename}`,
    mimeType: file.mimetype,
    sizeBytes: file.buffer.length,
    url: `${INSPECTION_PUBLIC_PREFIX}/${filename}`
  };
};

module.exports = {
  readBuffer,
  storeInspectionImage,
  writeBuffer
};
