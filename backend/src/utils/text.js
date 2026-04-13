const sanitizeHtml = require("sanitize-html");

function sanitizeText(value = "") {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

module.exports = {
  sanitizeText,
};

