const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed", 422, errors.array()));
  }
  next();
}

module.exports = validate;

