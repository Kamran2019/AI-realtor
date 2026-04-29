const env = require("../config/env");
const passwordResetEmail = require("../templates/emails/passwordResetEmail");
const verificationEmail = require("../templates/emails/verificationEmail");
const ApiError = require("../utils/ApiError");

const SAFE_EMAIL_ERROR = "Unable to send email right now. Please try again later.";

const testOutbox = [];
let transporter = null;

const buildAppUrl = (path, token) => {
  const url = new URL(path, env.APP_BASE_URL);

  url.searchParams.set("token", token);

  return url.toString();
};

const requireSmtpConfig = () => {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_FROM) {
    throw new ApiError(500, SAFE_EMAIL_ERROR);
  }
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  requireSmtpConfig();

  let nodemailer;

  try {
    nodemailer = require("nodemailer");
  } catch (error) {
    throw new ApiError(500, SAFE_EMAIL_ERROR);
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
          }
        }
      : {})
  });

  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const message = {
    from: env.SMTP_FROM || "AI Realtor <no-reply@ai-realtor.local>",
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
    return await getTransporter().sendMail(message);
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
