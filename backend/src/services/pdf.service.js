const fs = require("fs");
const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const { buildReportStorage } = require("./storage.service");

function writePdf(buildFn, fileNamePrefix) {
  return new Promise((resolve, reject) => {
    const fileName = `${fileNamePrefix}-${uuidv4()}.pdf`;
    const storage = buildReportStorage(fileName);
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const stream = fs.createWriteStream(storage.diskPath);

    doc.pipe(stream);
    buildFn(doc);
    doc.end();

    stream.on("finish", () => {
      storage.fileSize = fs.statSync(storage.diskPath).size;
      resolve(storage);
    });
    stream.on("error", reject);
  });
}

function brandHeader(doc, branding = {}, title) {
  doc.fontSize(26).fillColor(branding.primaryColor || "#159a8b").text(title);
  doc.moveDown(0.3);
  doc.fontSize(12).fillColor("#1f2933").text(branding.companyName || "AI Property Labs");
  if (branding.footerText) {
    doc.moveDown(0.2);
    doc.fillColor("#5c6870").fontSize(10).text(branding.footerText);
  }
  doc.moveDown();
}

async function generatePropertyInvestmentPdf({ property, branding }) {
  return writePdf((doc) => {
    brandHeader(doc, branding, "Investment Summary");
    doc.fillColor("#1f2933").fontSize(14).text(property.address);
    doc.fontSize(11).fillColor("#48545d").text(`Postcode: ${property.postcode || "N/A"}`);
    doc.text(`Guide Price: GBP ${Number(property.guidePrice || 0).toLocaleString()}`);
    doc.text(`Auction Date: ${property.auctionDate ? new Date(property.auctionDate).toLocaleDateString() : "N/A"}`);
    doc.moveDown();
    doc.fontSize(13).fillColor("#1f2933").text("Key Metrics");
    doc.fontSize(11).fillColor("#48545d");
    doc.text(`Score: ${property.scoring?.score || 0}/100`);
    doc.text(`Yield: ${property.scoring?.yieldPct || 0}%`);
    doc.text(`ROI: ${property.scoring?.roiPct || 0}%`);
    doc.text(`Confidence: ${Math.round((property.scoring?.confidence || 0) * 100)}%`);
    doc.moveDown();
    doc.fontSize(13).fillColor("#1f2933").text("Risk Flags");
    (property.risks?.redFlags?.length
      ? property.risks.redFlags
      : ["No explicit red flags identified in v1"])
      .forEach((flag) => doc.fontSize(11).fillColor("#48545d").text(`- ${flag}`));
    doc.moveDown();
    doc.fontSize(13).fillColor("#1f2933").text("Legal Pack");
    doc.fontSize(11)
      .fillColor("#48545d")
      .text(property.legalPack?.pdfUrl || "No legal pack linked");
  }, "property-report");
}

async function generateInspectionPdf({ inspection, branding, inspectorName }) {
  return writePdf((doc) => {
    brandHeader(doc, branding, "Inspection Report");
    doc.fontSize(12).fillColor("#1f2933").text(`Inspector: ${inspectorName}`);
    doc.text(`Property: ${inspection.propertyRef?.address || "Unspecified property"}`);
    doc.text(`Postcode: ${inspection.propertyRef?.postcode || "N/A"}`);
    doc.text(`Status: ${inspection.status}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#1f2933").text("Summary");
    doc.fontSize(11).fillColor("#48545d");
    doc.text(`Total defects: ${inspection.summary?.totalDefects || 0}`);
    doc.text(`Critical: ${inspection.summary?.criticalCount || 0}`);
    doc.text(`High: ${inspection.summary?.highCount || 0}`);
    doc.text(`Medium: ${inspection.summary?.mediumCount || 0}`);
    doc.text(`Low: ${inspection.summary?.lowCount || 0}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#1f2933").text("Findings");
    (inspection.defects || []).forEach((defect, index) => {
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor("#1f2933").text(`${index + 1}. ${defect.title || defect.type}`);
      doc.fillColor("#48545d").text(`Severity: ${defect.severity}`);
      doc.text(`Confidence: ${Math.round((defect.confidence || 0) * 100)}%`);
      if (defect.notes) {
        doc.text(`Notes: ${defect.notes}`);
      }
    });

    doc.addPage();
    doc.fontSize(13).fillColor("#1f2933").text("Recommendations");
    (inspection.recommendations?.length
      ? inspection.recommendations
      : ["Review all flagged items and schedule remediation."])
      .forEach((item) => doc.fontSize(11).fillColor("#48545d").text(`- ${item}`));
  }, "inspection-report");
}

module.exports = {
  generatePropertyInvestmentPdf,
  generateInspectionPdf,
};

