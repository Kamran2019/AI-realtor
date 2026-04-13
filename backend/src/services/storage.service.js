const path = require("path");
const fs = require("fs");
const env = require("../config/env");
const { ensureDir } = require("../utils/files");

function mapUploadedFiles(files = []) {
  return files.map((file) => ({
    storageKey: file.filename,
    url: `${env.appBaseUrl}/uploads/images/${file.filename}`,
    caption: file.originalname,
  }));
}

function buildReportStorage(relativeFileName) {
  const reportsDir = path.join(process.cwd(), "backend", "uploads", "reports");
  ensureDir(reportsDir);

  const diskPath = path.join(reportsDir, relativeFileName);
  return {
    diskPath,
    url: `${env.appBaseUrl}/uploads/reports/${relativeFileName}`,
    mimeType: "application/pdf",
    fileName: relativeFileName,
    fileSize: fs.existsSync(diskPath) ? fs.statSync(diskPath).size : 0,
  };
}

module.exports = {
  mapUploadedFiles,
  buildReportStorage,
};

