const path = require("path");

const { getPlan } = require("../config/plans");
const Property = require("../models/Property");
const Report = require("../models/Report");
const ApiError = require("../utils/ApiError");
const propertyReportPdfService = require("./pdf/propertyReportPdf.service");
const storageService = require("./storage.service");

const REPORT_TYPE = "property_investor_pdf";
const PDF_MIME_TYPE = "application/pdf";

const getMonthRange = (date = new Date()) => ({
  end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
  start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
});

const formatAddress = (property) =>
  [
    property.address?.line1,
    property.address?.line2,
    property.address?.city,
    property.address?.county,
    property.address?.postcode,
    property.address?.country
  ]
    .filter(Boolean)
    .join(", ") || "Untitled property";

const sanitizeFileSegment = (value) =>
  String(value || "property-report")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "property-report";

const serializeReport = (report) => {
  const serializedReport = report.toJSON();

  if (report.propertyId?.toJSON) {
    serializedReport.property = report.propertyId.toJSON();
    serializedReport.propertyId = report.propertyId._id.toString();
  }

  return serializedReport;
};

const findOwnedProperty = async ({ ownerUserId, propertyId }) => {
  const property = await Property.findOne({ _id: propertyId, ownerUserId });

  if (!property) {
    throw new ApiError(404, "Property not found.");
  }

  return property;
};

const findOwnedReport = async ({ id, ownerUserId, populateProperty = false }) => {
  const query = Report.findOne({ _id: id, ownerUserId });

  if (populateProperty) {
    query.populate("propertyId");
  }

  const report = await query;

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  return report;
};

const enforceMonthlyReportLimit = async ({ ownerUserId, user }) => {
  const plan = getPlan(user?.subscription?.plan);
  const limit = plan.limits?.reportsPerMonth;

  if (limit === null || limit === undefined) {
    return;
  }

  const { start, end } = getMonthRange();
  const currentUsage = await Report.countDocuments({
    ownerUserId,
    type: REPORT_TYPE,
    createdAt: {
      $gte: start,
      $lt: end
    }
  });

  if (currentUsage >= limit) {
    throw new ApiError(403, `Monthly report limit reached for your plan (${limit}).`);
  }
};

const buildReportMetadata = (property) => ({
  dealScore: property.scoring?.total ?? null,
  propertyAddress: formatAddress(property),
  riskCount: property.risks?.length || 0,
  sourceUrl: property.source?.url || null
});

const buildStorageKey = ({ property, report }) => {
  const propertySegment = sanitizeFileSegment(property.source?.listingId || property._id.toString());

  return path.posix.join(
    "reports",
    property.ownerUserId.toString(),
    `${report._id.toString()}-${propertySegment}.pdf`
  );
};

const generatePropertyReport = async ({ ownerUserId, propertyId, user }) => {
  const property = await findOwnedProperty({ ownerUserId, propertyId });
  await enforceMonthlyReportLimit({ ownerUserId, user });

  const generatedAt = new Date();
  const title = `Investor report - ${formatAddress(property)}`;
  const report = await Report.create({
    ownerUserId,
    propertyId: property._id,
    title,
    type: REPORT_TYPE,
    status: "processing",
    metadata: buildReportMetadata(property)
  });

  try {
    const pdfBuffer = await propertyReportPdfService.generatePropertyReportPdf({
      generatedAt,
      property,
      user
    });
    const file = await storageService.writeBuffer({
      buffer: pdfBuffer,
      key: buildStorageKey({ property, report })
    });

    report.status = "ready";
    report.file = {
      key: file.key,
      mimeType: PDF_MIME_TYPE,
      sizeBytes: file.sizeBytes
    };
    report.generatedAt = generatedAt;
    report.errorMessage = null;
    await report.save();

    return serializeReport(report);
  } catch (error) {
    report.status = "failed";
    report.errorMessage = error.message || "Report generation failed.";
    report.failedAt = new Date();
    await report.save();

    throw new ApiError(500, "Property report generation failed.", {
      reportId: report._id.toString()
    });
  }
};

const listReports = async ({ ownerUserId }) => {
  const reports = await Report.find({ ownerUserId })
    .populate("propertyId")
    .sort({ createdAt: -1, _id: -1 });

  return reports.map(serializeReport);
};

const getReport = async ({ id, ownerUserId }) => {
  const report = await findOwnedReport({ id, ownerUserId, populateProperty: true });

  return serializeReport(report);
};

const getReportFile = async ({ id, ownerUserId }) => {
  const report = await findOwnedReport({ id, ownerUserId });

  if (report.status !== "ready" || !report.file?.key) {
    throw new ApiError(409, "Report is not ready for download.");
  }

  const buffer = await storageService.readBuffer(report.file.key);

  return {
    buffer,
    fileName: `${sanitizeFileSegment(report.title)}.pdf`,
    mimeType: report.file.mimeType || PDF_MIME_TYPE,
    report: serializeReport(report)
  };
};

module.exports = {
  REPORT_TYPE,
  generatePropertyReport,
  getReport,
  getReportFile,
  listReports
};
