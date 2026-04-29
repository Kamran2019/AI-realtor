const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const verificationEmail = ({ name, verificationUrl }) => {
  const safeName = escapeHtml(name || "there");
  const safeVerificationUrl = escapeHtml(verificationUrl);

  return {
    subject: "Verify your AI Realtor email",
    text: `Hi ${name || "there"},\n\nVerify your AI Realtor account by opening this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    html: `
      <div>
        <p>Hi ${safeName},</p>
        <p>Verify your AI Realtor account by opening this link:</p>
        <p><a href="${safeVerificationUrl}">Verify email</a></p>
        <p>This link expires in 24 hours.</p>
      </div>
    `
  };
};

module.exports = verificationEmail;
