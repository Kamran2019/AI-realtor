const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const { PDFParse } = require("pdf-parse");

const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const { applyPropertyScore } = require("./dealScoring.service");
const { detectRisks, sanitizeText } = require("./riskDetection.service");

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const NOT_FOUND_MESSAGE = "Property not found.";
const STORAGE_ROOT = process.env.LEGAL_PACK_STORAGE_DIR || path.resolve(__dirname, "../../uploads");

const toJSON = (document) => document.toJSON();

const findOwnedProperty = async ({ id, ownerUserId }) => {
  const property = await Property.findOne({ _id: id, ownerUserId });

  if (!property) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  return property;
};

const validatePdfBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ApiError(400, "PDF file is required.");
  }

  if (buffer.length > MAX_PDF_BYTES) {
    throw new ApiError(400, "PDF must be 20MB or smaller.");
  }

  if (buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new ApiError(400, "Invalid file type. Legal pack must be a PDF.");
  }
};

const validateHttpsUrl = (value) => {
  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch (error) {
    throw new ApiError(400, "Legal pack URL must be a valid HTTPS URL.");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new ApiError(400, "Legal pack URL must be a valid HTTPS URL.");
  }

  return parsedUrl.toString();
};

const sanitizeFileName = (name = "legal-pack.pdf") => {
  const baseName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "-");

  return baseName.toLowerCase().endsWith(".pdf") ? baseName : `${baseName}.pdf`;
};

const getFileNameFromUrl = (url) => {
  const parsedUrl = new URL(url);
  const pathName = parsedUrl.pathname.split("/").filter(Boolean).pop();

  return sanitizeFileName(pathName || "legal-pack.pdf");
};

const checksumBuffer = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

const buildKey = ({ propertyId, checksum }) => `legal-packs/${propertyId}/${checksum}.pdf`;

const storePdf = async ({ buffer, key }) => {
  const storagePath = path.resolve(STORAGE_ROOT, key);

  try {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(storagePath, buffer, { flag: "w" });
  } catch (error) {
    throw new ApiError(500, "Legal pack storage failed.");
  }
};

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return sanitizeText(result?.text || "");
  } catch (error) {
    throw new ApiError(422, "Legal pack could not be parsed.");
  } finally {
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
  }
};

const readStreamWithLimit = async (stream) => {
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;

    if (total > MAX_PDF_BYTES) {
      throw new ApiError(400, "PDF must be 20MB or smaller.");
    }

    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
};

const downloadPdfFromUrl = async (url) => {
  const pdfUrl = validateHttpsUrl(url);
  let response;

  try {
    response = await fetch(pdfUrl, { redirect: "follow" });
  } catch (error) {
    throw new ApiError(422, "Legal pack URL could not be fetched.");
  }

  if (!response.ok) {
    throw new ApiError(422, "Legal pack URL could not be fetched.");
  }

  const contentLength = Number(response.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > MAX_PDF_BYTES) {
    throw new ApiError(400, "PDF must be 20MB or smaller.");
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType && !/application\/pdf|application\/octet-stream/i.test(contentType)) {
    throw new ApiError(400, "Invalid file type. Legal pack must be a PDF.");
  }

  if (!response.body) {
    throw new ApiError(422, "Legal pack URL could not be fetched.");
  }

  const buffer = await readStreamWithLimit(response.body);
  validatePdfBuffer(buffer);

  return {
    buffer,
    originalName: getFileNameFromUrl(pdfUrl),
    url: pdfUrl
  };
};

const normalizeUploadInput = async ({ file, url }) => {
  const trimmedUrl = typeof url === "string" ? url.trim() : "";

  if (file && trimmedUrl) {
    throw new ApiError(400, "Provide either a PDF file or HTTPS URL, not both.");
  }

  if (file) {
    validatePdfBuffer(file.buffer);

    return {
      buffer: file.buffer,
      mimeType: file.mimetype || "application/pdf",
      originalName: sanitizeFileName(file.originalname),
      sourceType: "upload",
      url: null
    };
  }

  if (trimmedUrl) {
    const downloaded = await downloadPdfFromUrl(trimmedUrl);

    return {
      ...downloaded,
      mimeType: "application/pdf",
      sourceType: "url"
    };
  }

  throw new ApiError(400, "PDF file or HTTPS URL is required.");
};

const attachLegalPack = async ({ id, ownerUserId, file, url }) => {
  const property = await findOwnedProperty({ id, ownerUserId });
  const pdf = await normalizeUploadInput({ file, url });
  const checksum = checksumBuffer(pdf.buffer);
  const key = buildKey({ propertyId: property._id.toString(), checksum });

  await storePdf({ buffer: pdf.buffer, key });

  const extractedText = await extractPdfText(pdf.buffer);
  const risks = detectRisks(extractedText);
  const now = new Date();

  property.legalPack = {
    ...property.legalPack?.toObject?.(),
    status: "available",
    sourceType: pdf.sourceType,
    url: pdf.url || `/uploads/${key}`,
    key,
    checksum,
    originalName: pdf.originalName,
    mimeType: pdf.mimeType,
    sizeBytes: pdf.buffer.length,
    parsedAt: now,
    uploadedAt: now,
    parsedCharacterCount: extractedText.length
  };
  property.risks = risks;

  applyPropertyScore(property);
  property.history.push({
    eventType: "legal_pack_parsed",
    occurredAt: now,
    details: {
      riskCount: risks.length,
      sourceType: pdf.sourceType
    }
  });

  await property.save();

  return toJSON(property);
};

const getRiskSummary = async ({ id, ownerUserId }) => {
  const property = await findOwnedProperty({ id, ownerUserId });

  return {
    legalPack: property.legalPack,
    risks: property.risks || [],
    scoring: property.scoring
  };
};

module.exports = {
  MAX_PDF_BYTES,
  attachLegalPack,
  getRiskSummary
};
