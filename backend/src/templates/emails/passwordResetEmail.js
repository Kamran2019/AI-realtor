const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const passwordResetEmail = ({ name, resetUrl }) => {
  const safeName = escapeHtml(name || "there");
  const safeResetUrl = escapeHtml(resetUrl);

  return {
    subject: "Reset your AI Realtor password",
    text: `Hi ${name || "there"},\n\nReset your AI Realtor password by opening this link:\n${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div>
        <p>Hi ${safeName},</p>
        <p>Reset your AI Realtor password by opening this link:</p>
        <p><a href="${safeResetUrl}">Reset password</a></p>
        <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `
  };
};

module.exports = passwordResetEmail;
