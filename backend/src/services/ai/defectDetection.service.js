const { z } = require("zod");

const env = require("../../config/env");
const { defectSeverities, defectTypes } = require("../../models/Inspection");
const ApiError = require("../../utils/ApiError");
const { detectDefectsWithStub } = require("./providers/stubDefectDetection.provider");

const detectionBoxSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    w: z.number().finite(),
    h: z.number().finite()
  })
  .strict();

const providerDetectionSchema = z
  .object({
    type: z.enum(defectTypes),
    severity: z.enum(defectSeverities),
    confidence: z.number().min(0).max(1),
    box: detectionBoxSchema.optional().nullable(),
    notes: z.string().trim().max(3000).optional().default("")
  })
  .strict();

const providerResultSchema = z
  .object({
    modelVersion: z.string().trim().min(1),
    provider: z.literal("stub"),
    detections: z.array(providerDetectionSchema)
  })
  .strict();

const normalizeBox = (box) => {
  if (!box) {
    return null;
  }

  return {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h
  };
};

const normalizeDetections = ({ imageUrl, modelVersion, detections }) =>
  detections.map((detection) => ({
    type: detection.type,
    source: "ai_stub",
    severity: detection.severity,
    confidence: detection.confidence,
    notes: detection.notes || "",
    imageUrl,
    box: normalizeBox(detection.box),
    modelVersion
  }));

const callProvider = async (input) => {
  if (env.AI_PROVIDER === "stub") {
    return detectDefectsWithStub(input);
  }

  throw new ApiError(500, "Unsupported AI provider configured.");
};

const runDefectDetection = async (input) => {
  let providerResult;

  try {
    providerResult = await callProvider(input);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "AI defect detection failed.");
  }

  const parsedResult = providerResultSchema.safeParse(providerResult);

  if (!parsedResult.success) {
    throw new ApiError(502, "AI defect detection failed.");
  }

  const normalizedResult = parsedResult.data;

  return {
    modelVersion: normalizedResult.modelVersion,
    provider: normalizedResult.provider,
    detections: normalizeDetections({
      imageUrl: input.imageUrl,
      modelVersion: normalizedResult.modelVersion,
      detections: normalizedResult.detections
    })
  };
};

module.exports = {
  runDefectDetection
};
