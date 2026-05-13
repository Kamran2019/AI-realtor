const { z } = require("zod");

const env = require("../../config/env");
const { defectSeverities, defectTypes } = require("../../models/Inspection");
const ApiError = require("../../utils/ApiError");
const {
  INVALID_RESPONSE_MESSAGE,
  detectDefectsWithHttp
} = require("./providers/httpDefectDetection.provider");
const { detectDefectsWithStub } = require("./providers/stubDefectDetection.provider");

const detectionBoxSchema = z
  .object({
    x: z.number().finite().min(0),
    y: z.number().finite().min(0),
    w: z.number().finite().positive(),
    h: z.number().finite().positive()
  })
  .strict();

const providerDetectionSchema = z
  .object({
    type: z.enum(defectTypes),
    severity: z.enum(defectSeverities),
    confidence: z.number().min(0).max(1),
    box: detectionBoxSchema.optional().nullable(),
    notes: z.string().trim().max(3000).optional().nullable().default("")
  })
  .strict();

const providerResultSchema = z
  .object({
    modelVersion: z.string().trim().min(1),
    provider: z.literal("stub"),
    detections: z.array(providerDetectionSchema)
  })
  .strict();

const httpProviderResultSchema = z
  .object({
    success: z.literal(true),
    provider: z.string().trim().min(1),
    modelVersion: z.string().trim().min(1),
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

const normalizeDetections = ({ imageUrl, modelVersion, detections, source }) =>
  detections.map((detection) => ({
    type: detection.type,
    source,
    severity: detection.severity,
    confidence: detection.confidence,
    notes: detection.notes || "",
    imageUrl,
    box: normalizeBox(detection.box),
    modelVersion
  }));

const callProvider = async (input) => {
  if (env.AI_PROVIDER === "stub") {
    return {
      result: await detectDefectsWithStub(input),
      schema: providerResultSchema,
      source: "ai_stub"
    };
  }

  if (env.AI_PROVIDER === "http") {
    return {
      result: await detectDefectsWithHttp(input),
      schema: httpProviderResultSchema,
      source: "ai_microservice"
    };
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

  const parsedResult = providerResult.schema.safeParse(providerResult.result);

  if (!parsedResult.success) {
    if (env.AI_PROVIDER === "http") {
      throw new ApiError(502, INVALID_RESPONSE_MESSAGE);
    }

    throw new ApiError(502, "AI defect detection failed.");
  }

  const normalizedResult = parsedResult.data;

  return {
    modelVersion: normalizedResult.modelVersion,
    provider: env.AI_PROVIDER,
    detections: normalizeDetections({
      imageUrl: input.imageUrl,
      modelVersion: normalizedResult.modelVersion,
      detections: normalizedResult.detections,
      source: providerResult.source
    })
  };
};

module.exports = {
  runDefectDetection
};
