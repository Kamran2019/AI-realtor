const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { ensureDir } = require("../utils/files");

const destination = path.join(process.cwd(), "backend", "uploads", "images");
ensureDir(destination);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, destination),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || ".jpg");
    cb(null, `${uuidv4()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

module.exports = upload;

