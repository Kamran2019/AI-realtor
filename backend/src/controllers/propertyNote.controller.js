const {
  noteBodySchema,
  noteIdParamsSchema,
  propertyIdParamsSchema
} = require("../validators/bookmarkNote.validator");
const propertyNoteService = require("../services/propertyNote.service");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: issue.message
  }));

const parseRequest = (schema, value) => {
  const parsedValue = schema.safeParse(value);

  if (!parsedValue.success) {
    throw new ApiError(400, "Validation failed", formatValidationIssues(parsedValue.error.issues));
  }

  return parsedValue.data;
};

const listNotes = asyncHandler(async (req, res) => {
  const { propertyId } = parseRequest(propertyIdParamsSchema, req.params);
  const notes = await propertyNoteService.listNotes({
    propertyId,
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Notes loaded.",
    data: {
      notes
    }
  });
});

const createNote = asyncHandler(async (req, res) => {
  const { propertyId } = parseRequest(propertyIdParamsSchema, req.params);
  const { text } = parseRequest(noteBodySchema, req.body);
  const note = await propertyNoteService.createNote({
    propertyId,
    text,
    user: req.user
  });

  sendResponse(res, 201, {
    success: true,
    message: "Note created.",
    data: {
      note
    }
  });
});

const updateNote = asyncHandler(async (req, res) => {
  const { id } = parseRequest(noteIdParamsSchema, req.params);
  const { text } = parseRequest(noteBodySchema, req.body);
  const note = await propertyNoteService.updateNote({
    id,
    text,
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Note updated.",
    data: {
      note
    }
  });
});

const deleteNote = asyncHandler(async (req, res) => {
  const { id } = parseRequest(noteIdParamsSchema, req.params);
  const result = await propertyNoteService.deleteNote({
    id,
    user: req.user
  });

  sendResponse(res, 200, {
    success: true,
    message: "Note deleted.",
    data: result
  });
});

module.exports = {
  createNote,
  deleteNote,
  listNotes,
  updateNote
};
