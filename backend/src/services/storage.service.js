const fs = require("fs/promises");
const path = require("path");

const ApiError = require("../utils/ApiError");

const STORAGE_ROOT = process.env.REPORT_STORAGE_DIR || path.resolve(__dirname, "../../uploads");

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

module.exports = {
  readBuffer,
  writeBuffer
};
