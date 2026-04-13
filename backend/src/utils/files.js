const fs = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function resolveUploadPath(...parts) {
  return path.join(process.cwd(), ...parts);
}

module.exports = {
  ensureDir,
  resolveUploadPath,
};

