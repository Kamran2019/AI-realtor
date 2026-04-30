const env = require("../config/env");
const passwordResetEmail = require("../templates/emails/passwordResetEmail");
const verificationEmail = require("../templates/emails/verificationEmail");
const ApiError = require("../utils/ApiError");

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
    throw new Error("Brevo email request failed.");
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

const getTestOutbox = () => testOutbox;

const clearTestOutbox = () => {
  testOutbox.splice(0, testOutbox.length);
};

module.exports = {
  clearTestOutbox,
  getTestOutbox,
  sendPasswordResetEmail,
  sendVerificationEmail
};
