const env = require("../config/env");
const passwordResetEmail = require("../templates/emails/passwordResetEmail");
const verificationEmail = require("../templates/emails/verificationEmail");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

const SAFE_EMAIL_ERROR = "Unable to send email right now. Please try again later.";
const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

const testOutbox = [];

const buildAppUrl = (path, token) => {
  const url = new URL(path, env.APP_BASE_URL);

  url.searchParams.set("token", token);

  return url.toString();
};

const requireBrevoConfig = () => {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    throw new ApiError(500, SAFE_EMAIL_ERROR);
  }

  if (env.BREVO_API_KEY.startsWith("xsmtpsib")) {
    logger.error("BREVO_API_KEY is an SMTP key. Use a Brevo v3 API key for REST API email.");
    throw new ApiError(500, SAFE_EMAIL_ERROR);
  }
};

const buildSender = () => ({
  email: env.BREVO_SENDER_EMAIL,
  ...(env.BREVO_SENDER_NAME ? { name: env.BREVO_SENDER_NAME } : {})
});

const sendBrevoMail = async ({ to, subject, text, html }) => {
  requireBrevoConfig();

  const response = await fetch(BREVO_SEND_EMAIL_URL, {
    body: JSON.stringify({
      htmlContent: html,
      sender: buildSender(),
      subject,
      textContent: text,
      to: [{ email: to }]
    }),
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const responseBody = await response.text();

    logger.error("Brevo email request failed.", {
      body: responseBody,
      status: response.status,
      statusText: response.statusText
    });

    throw new Error(`Brevo email request failed with status ${response.status}.`);
  }

  return response.json();
};

const sendMail = async ({ to, subject, text, html }) => {
  const message = {
    from: env.BREVO_SENDER_EMAIL
      ? `${env.BREVO_SENDER_NAME || "AI Realtor"} <${env.BREVO_SENDER_EMAIL}>`
      : "AI Realtor <no-reply@ai-realtor.local>",
    to,
    subject,
    text,
    html
  };

  if (env.NODE_ENV === "test") {
    testOutbox.push(message);
    return {
      messageId: `test-${testOutbox.length}`
    };
  }

  try {
    return await sendBrevoMail({ html, subject, text, to });
  } catch (error) {
    logger.error(error.message);
    throw new ApiError(500, SAFE_EMAIL_ERROR);
  }
};

const sendVerificationEmail = async ({ user, token }) => {
  const verificationUrl = buildAppUrl("/verify-email", token);
  const content = verificationEmail({
    name: user.name,
    verificationUrl
  });

  return sendMail({
    to: user.email,
    ...content
  });
};

const sendPasswordResetEmail = async ({ user, token }) => {
  const resetUrl = buildAppUrl("/reset-password", token);
  const content = passwordResetEmail({
    name: user.name,
    resetUrl
  });

  return sendMail({
    to: user.email,
    ...content
  });
};

const getPropertyAddress = (property) =>
  [
    property.address?.line1,
    property.address?.city,
    property.address?.postcode
  ]
    .filter(Boolean)
    .join(", ") || "a property";

const sendAlertNotificationEmail = async ({ alertRule, property, user }) => {
  const propertyUrl = property._id
    ? new URL(`/properties/${property._id.toString()}`, env.APP_BASE_URL).toString()
    : env.APP_BASE_URL;
  const address = getPropertyAddress(property);
  const score =
    property.scoring?.total === null || property.scoring?.total === undefined
      ? "Unscored"
      : property.scoring.total;
  const subject = `AI Realtor alert: ${alertRule.name}`;
  const text = [
    `Hi ${user.name},`,
    "",
    `${address} matched your alert "${alertRule.name}".`,
    `Score: ${score}`,
    `View property: ${propertyUrl}`
  ].join("\n");
  const html = `
    <p>Hi ${user.name},</p>
    <p><strong>${address}</strong> matched your alert <strong>${alertRule.name}</strong>.</p>
    <p>Score: ${score}</p>
    <p><a href="${propertyUrl}">View property</a></p>
  `;

  return sendMail({
    html,
    subject,
    text,
    to: user.email
  });
};

const getTestOutbox = () => testOutbox;

const clearTestOutbox = () => {
  testOutbox.splice(0, testOutbox.length);
};

module.exports = {
  clearTestOutbox,
  getTestOutbox,
  sendAlertNotificationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
};
