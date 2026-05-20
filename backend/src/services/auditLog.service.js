const mongoose = require("mongoose");
const { z } = require("zod");

const AuditLog = require("../models/AuditLog");

const SENSITIVE_META_KEYS = [
  "password",
  "passwordhash",
  "token",
  "refresh",
  "secret",
  "authorization",
  "cookie",
  "card",
  "cvv",
  "cvc"
];

const objectIdStringSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid actorUserId");
const listAuditLogsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().trim().min(1).max(120).optional(),
    status: z.enum(["success", "failure"]).optional(),
    actorUserId: objectIdStringSchema.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional()
  })
  .superRefine((value, ctx) => {
    if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
      ctx.addIssue({
        code: "custom",
        message: "fromDate must be before toDate",
        path: ["fromDate"]
      });
    }
  });

const normalizeActorRole = (user) => {
  if (!user) {
    return "anonymous";
  }

  if (["admin", "sub_admin", "user"].includes(user.role)) {
    return user.role;
  }

  return "system";
};

const looksSensitive = (key) => {
  const normalizedKey = String(key || "").toLowerCase();

  return SENSITIVE_META_KEYS.some((needle) => normalizedKey.includes(needle));
};

const sanitizeMeta = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMeta);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce((result, [key, nestedValue]) => {
      if (looksSensitive(key)) {
        return result;
      }

      result[key] = sanitizeMeta(nestedValue);
      return result;
    }, {});
  }

  return value;
};

const recordAudit = async ({ action, actorUserId = null, actorRole = "anonymous", entityType = null, entityId = null, status = "success", meta = null, ipAddress = null, userAgent = null }) => {
  try {
    await AuditLog.create({
      action,
      actorUserId: actorUserId && mongoose.Types.ObjectId.isValid(actorUserId) ? actorUserId : null,
      actorRole,
      entityType,
      entityId,
      status,
      ipAddress,
      userAgent,
      meta: sanitizeMeta(meta)
    });
  } catch (error) {
    // Audit logging should never block business actions.
  }
};

const recordAuditForRequest = async (req, payload) =>
  recordAudit({
    actorRole: normalizeActorRole(req.user),
    actorUserId: req.user?._id || null,
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
    ...payload
  });

const listAuditLogs = async (query) => {
  const { page, limit, action, actorUserId, fromDate, status, toDate } = listAuditLogsSchema.parse(query);
  const filter = {};

  if (action) {
    filter.action = action;
  }

  if (status) {
    filter.status = status;
  }

  if (actorUserId) {
    filter.actorUserId = actorUserId;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};

    if (fromDate) {
      filter.createdAt.$gte = fromDate;
    }

    if (toDate) {
      filter.createdAt.$lte = toDate;
    }
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter)
  ]);

  return {
    logs: logs.map((entry) => entry.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

module.exports = {
  listAuditLogs,
  listAuditLogsSchema,
  normalizeActorRole,
  recordAudit,
  recordAuditForRequest,
  sanitizeMeta
};
