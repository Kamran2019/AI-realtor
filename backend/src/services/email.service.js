const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter =
      env.smtpHost && env.smtpUser
        ? nodemailer.createTransport({
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpPort === 465,
            auth: {
              user: env.smtpUser,
              pass: env.smtpPass,
            },
          })
        : nodemailer.createTransport({
            jsonTransport: true,
          });
  }

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const info = await getTransporter().sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html,
    text,
  });

  return info;
}

async function sendVerificationEmail(user, token) {
  const url = `${env.clientUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: "Verify your email",
    text: `Verify your email by opening ${url}`,
    html: `<p>Verify your email by opening <a href="${url}">${url}</a>.</p>`,
  });
}

async function sendPasswordResetEmail(user, token) {
  const url = `${env.clientUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `Reset your password by opening ${url}`,
    html: `<p>Reset your password by opening <a href="${url}">${url}</a>.</p>`,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};

