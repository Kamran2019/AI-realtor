const Inspection = require("../models/Inspection");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const storageService = require("./storage.service");

const NOT_FOUND_MESSAGE = "Inspection not found.";
const ROOM_NOT_FOUND_MESSAGE = "Room not found.";
const DEFECT_NOT_FOUND_MESSAGE = "Defect not found.";
const FORBIDDEN_MESSAGE = "You do not have permission to perform this action.";

const allowedStatusTransitions = {
  draft: ["in_progress", "archived"],
  in_progress: ["completed", "archived"],
  completed: ["archived"],
  archived: []
};

const managerRoles = new Set(["admin", "sub_admin"]);

const toJSON = (document) => document.toJSON();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const idsEqual = (left, right) => {
  if (!left || !right) {
    return false;
  }

  return left.toString() === right.toString();
};

const isManager = (actor) => managerRoles.has(actor.role);

const canAccessInspection = (inspection, actor) => {
  if (isManager(actor)) {
    return (
      idsEqual(inspection.ownerUserId, actor._id) ||
      idsEqual(inspection.createdByUserId, actor._id) ||
      idsEqual(inspection.assignedToUserId, actor._id)
    );
  }

  return idsEqual(inspection.createdByUserId, actor._id) || idsEqual(inspection.assignedToUserId, actor._id);
};

const assertCanAccessInspection = (inspection, actor) => {
  if (!canAccessInspection(inspection, actor)) {
    throw new ApiError(403, FORBIDDEN_MESSAGE);
  }
};

const buildAccessFilter = (actor) => ({
  $or: [
    { ownerUserId: actor._id },
    { createdByUserId: actor._id },
    { assignedToUserId: actor._id }
  ]
});

const endOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const buildInspectionFilter = ({ actor, createdFrom, createdTo, search, status }) => {
  const filter = buildAccessFilter(actor);

  if (status) {
    filter.status = status;
  }

  if (createdFrom || createdTo) {
    filter.createdAt = {
      ...(createdFrom ? { $gte: createdFrom } : {}),
      ...(createdTo ? { $lte: endOfDay(createdTo) } : {})
    };
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");

    filter.$and = [
      {
        $or: [
          { "propertyRef.address": pattern },
          { "propertyRef.postcode": pattern },
          { "client.name": pattern },
          { "client.email": pattern },
          { "client.phone": pattern }
        ]
      }
    ];
  }

  return filter;
};

const populateInspection = (query) => query.populate("assignedToUserId", "name email role status");

const loadInspection = async (id) => {
  const inspection = await Inspection.findById(id);

  if (!inspection) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  return inspection;
};

const getAccessibleInspectionDocument = async ({ actor, id }) => {
  const inspection = await loadInspection(id);

  assertCanAccessInspection(inspection, actor);

  return inspection;
};

const ensureAssignableUser = async (assignedToUserId) => {
  if (!assignedToUserId) {
    return;
  }

  const user = await User.findById(assignedToUserId);

  if (!user) {
    throw new ApiError(404, "Assigned user not found.");
  }
};

const ensureCanAssign = (actor) => {
  if (!isManager(actor)) {
    throw new ApiError(403, "Users cannot assign inspections.");
  }
};

const applyNullableNestedUpdates = (document, path, updates) => {
  for (const [field, value] of Object.entries(updates || {})) {
    document.set(`${path}.${field}`, value === undefined ? document.get(`${path}.${field}`) : value);
  }
};

const recalculateInspectionSummary = (inspection) => {
  const summary = {
    high: 0,
    low: 0,
    medium: 0,
    totalDefects: 0
  };

  inspection.rooms.forEach((room) => {
    room.defects.forEach((defect) => {
      summary.totalDefects += 1;

      if (defect.severity === "high") {
        summary.high += 1;
      } else if (defect.severity === "medium") {
        summary.medium += 1;
      } else if (defect.severity === "low") {
        summary.low += 1;
      }
    });
  });

  inspection.summary.totalDefects = summary.totalDefects;
  inspection.summary.high = summary.high;
  inspection.summary.medium = summary.medium;
  inspection.summary.low = summary.low;

  return summary;
};

const listInspections = async ({ actor, createdFrom, createdTo, limit, page, search, status }) => {
  const filter = buildInspectionFilter({ actor, createdFrom, createdTo, search, status });
  const skip = (page - 1) * limit;
  const [inspections, total] = await Promise.all([
    populateInspection(Inspection.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit)),
    Inspection.countDocuments(filter)
  ]);

  return {
    inspections: inspections.map(toJSON),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

const createInspection = async ({ actor, payload }) => {
  if (payload.assignedToUserId) {
    ensureCanAssign(actor);
    await ensureAssignableUser(payload.assignedToUserId);
  }

  const inspection = await Inspection.create({
    assignedToUserId: payload.assignedToUserId || null,
    capturedAt: payload.capturedAt || null,
    client: payload.client || {},
    createdByUserId: actor._id,
    geo: payload.geo || {},
    ownerUserId: actor._id,
    propertyRef: payload.propertyRef,
    recommendations: payload.recommendations || [],
    summary: payload.summary || {}
  });

  return toJSON(inspection);
};

const getInspectionById = async ({ actor, id }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });
  await inspection.populate("assignedToUserId", "name email role status");

  return toJSON(inspection);
};

const updateInspection = async ({ actor, id, updates }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });

  if (Object.prototype.hasOwnProperty.call(updates, "assignedToUserId")) {
    ensureCanAssign(actor);
    await ensureAssignableUser(updates.assignedToUserId);
    inspection.assignedToUserId = updates.assignedToUserId || null;
  }

  if (updates.propertyRef) {
    applyNullableNestedUpdates(inspection, "propertyRef", updates.propertyRef);
  }

  if (updates.client) {
    applyNullableNestedUpdates(inspection, "client", updates.client);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "capturedAt")) {
    inspection.capturedAt = updates.capturedAt || null;
  }

  if (updates.geo) {
    applyNullableNestedUpdates(inspection, "geo", updates.geo);
  }

  if (updates.summary) {
    applyNullableNestedUpdates(inspection, "summary", updates.summary);
  }

  if (updates.recommendations) {
    inspection.recommendations = updates.recommendations;
  }

  await inspection.save();
  await inspection.populate("assignedToUserId", "name email role status");

  return toJSON(inspection);
};

const addRoom = async ({ actor, id, payload }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });

  inspection.rooms.push({
    name: payload.name,
    notes: payload.notes || ""
  });

  await inspection.save();

  return toJSON(inspection);
};

const getRoom = (inspection, roomId) => {
  const room = inspection.rooms.id(roomId);

  if (!room) {
    throw new ApiError(404, ROOM_NOT_FOUND_MESSAGE);
  }

  return room;
};

const updateRoom = async ({ actor, id, roomId, updates }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });
  const room = getRoom(inspection, roomId);

  if (Object.prototype.hasOwnProperty.call(updates, "name")) {
    room.name = updates.name;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "notes")) {
    room.notes = updates.notes || "";
  }

  await inspection.save();

  return toJSON(inspection);
};

const uploadRoomImage = async ({ actor, file, id, roomId }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });
  const room = getRoom(inspection, roomId);
  const storedImage = await storageService.storeInspectionImage({
    file,
    inspectionId: inspection._id.toString()
  });

  room.mediaUrls.push(storedImage.url);
  await inspection.save();

  return {
    image: storedImage,
    inspection: toJSON(inspection)
  };
};

const normalizeBox = (box) => {
  if (!box) {
    return null;
  }

  return {
    x: box.x ?? null,
    y: box.y ?? null,
    w: box.w ?? null,
    h: box.h ?? null
  };
};

const addManualDefect = async ({ actor, id, payload, roomId }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });
  const room = getRoom(inspection, roomId);

  room.defects.push({
    box: normalizeBox(payload.box),
    confidence: null,
    imageUrl: payload.imageUrl || null,
    notes: payload.notes || "",
    reviewedAt: new Date(),
    reviewedByUserId: actor._id,
    severity: payload.severity,
    source: "manual",
    type: payload.type
  });

  recalculateInspectionSummary(inspection);
  await inspection.save();

  return toJSON(inspection);
};

const getDefect = (room, defectId) => {
  const defect = room.defects.id(defectId);

  if (!defect) {
    throw new ApiError(404, DEFECT_NOT_FOUND_MESSAGE);
  }

  return defect;
};

const updateDefect = async ({ actor, defectId, id, roomId, updates }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });
  const room = getRoom(inspection, roomId);
  const defect = getDefect(room, defectId);

  if (Object.prototype.hasOwnProperty.call(updates, "type")) {
    defect.type = updates.type;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "severity")) {
    defect.severity = updates.severity;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "notes")) {
    defect.notes = updates.notes || "";
  }

  if (Object.prototype.hasOwnProperty.call(updates, "imageUrl")) {
    defect.imageUrl = updates.imageUrl || null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "box")) {
    defect.box = normalizeBox(updates.box);
  }

  defect.reviewedByUserId = actor._id;
  defect.reviewedAt = new Date();

  recalculateInspectionSummary(inspection);
  await inspection.save();

  return toJSON(inspection);
};

const deleteDefect = async ({ actor, defectId, id, roomId }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });
  const room = getRoom(inspection, roomId);
  const defect = getDefect(room, defectId);

  defect.deleteOne();
  recalculateInspectionSummary(inspection);
  await inspection.save();

  return toJSON(inspection);
};

const changeInspectionStatus = async ({ actor, id, status }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });
  const allowedNextStatuses = allowedStatusTransitions[inspection.status] || [];

  if (!allowedNextStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status transition from ${inspection.status} to ${status}.`);
  }

  inspection.status = status;
  await inspection.save();

  return toJSON(inspection);
};

const deleteInspection = async ({ actor, id }) => {
  const inspection = await getAccessibleInspectionDocument({ actor, id });

  if (actor.role !== "admin") {
    throw new ApiError(403, "Only admins can permanently delete inspections.");
  }

  await inspection.deleteOne();

  return { id };
};

const assertCanAccessInspectionById = async ({ actor, id }) => {
  const inspection = await loadInspection(id);

  assertCanAccessInspection(inspection, actor);
};

module.exports = {
  addManualDefect,
  addRoom,
  assertCanAccessInspectionById,
  changeInspectionStatus,
  deleteDefect,
  deleteInspection,
  getInspectionById,
  listInspections,
  recalculateInspectionSummary,
  updateDefect,
  updateInspection,
  updateRoom,
  uploadRoomImage,
  createInspection
};
