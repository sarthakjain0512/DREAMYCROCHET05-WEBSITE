// services/emailService.js
// ─────────────────────────────────────────────────────────────────────────────
// DreamyCrochet05 — Email Notification Service (Nodemailer)
//
// Sends a beautifully formatted Gmail notification to the shop owner
// whenever a customer submits a new custom crochet inquiry.
//
// Subject: 🌷 New Crochet Inquiry — DreamyCrochet05
//
// ⚙️ Setup: Add these to your .env file:
//   EMAIL=your_gmail@gmail.com
//   EMAIL_PASSWORD=your_16_char_gmail_app_password
//
// 📌 Gmail App Password (NOT your regular password):
//   Google Account → Security → 2-Step Verification → App Passwords
// ─────────────────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ─── Initialize Nodemailer Transporter ───────────────────────────────────────
let transporter = null;
let emailEnabled = false;

const emailAddress = process.env.EMAIL || process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (emailAddress && emailPassword && !emailAddress.includes('your_email@gmail.com') && !emailPassword.includes('your_gmail_app_password')) {
  transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: emailAddress,
    pass: emailPassword
  }
});


  emailEnabled = true;
  console.log('📧 [EmailService] Gmail Nodemailer configured successfully.');
} else {
  console.log('⚠️  [EmailService] EMAIL/EMAIL_USER or EMAIL_PASSWORD not configured in .env — emails will be logged locally to inbox_logs.txt.');
}

// ─── Helper: Format Date for India Timezone ──────────────────────────────────
function formatDate(dateObj) {
  return new Date(dateObj).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
}

// ─── Build Pretty HTML Email Body ────────────────────────────────────────────
function buildEmailHTML(order, imageUrls) {
  const instaLink = order.instagramUsername
    ? `<a href="https://instagram.com/${order.instagramUsername.replace('@', '').trim()}" style="color:#B58A6A;">${order.instagramUsername}</a>`
    : 'N/A';

  const imageSection = imageUrls && imageUrls.length > 0
    ? imageUrls.map((url, idx) => {
        return `
          <div style="display: inline-block; margin-right: 15px; margin-bottom: 15px; text-align: center; vertical-align: top;">
            <a href="${url}" target="_blank" style="text-decoration: none;">
              <img src="${url}" alt="Reference ${idx + 1}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #B58A6A; display: block; margin-bottom: 4px;">
              <span style="font-size: 11px; color: #B58A6A; font-weight: bold; display: block;">Image ${idx + 1} 🔗</span>
            </a>
          </div>`;
      }).join('')
    : `<span style="font-size: 13px; color: #999; font-style: italic;">No reference images uploaded.</span>`;

  return `
  <div style="font-family: 'Georgia', serif; line-height: 1.7; color: #4A3321; max-width: 620px; margin: 0 auto; border: 1px solid #FADADD; border-radius: 20px; overflow: hidden; background: #FFF8EE;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #B58A6A 0%, #FADADD 100%); padding: 30px 30px 20px; text-align: center;">
      <p style="font-size: 32px; margin: 0; letter-spacing: 2px;">🌷</p>
      <h1 style="margin: 8px 0 4px; font-size: 22px; color: #fff; font-weight: bold; letter-spacing: 1px;">New Crochet Inquiry</h1>
      <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 13px; font-style: italic;">DreamyCrochet05 — Handcrafted by Mom</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 30px;">
      <p style="font-size: 14px; color: #4A3321; margin: 0 0 20px;">
        A new custom crochet inquiry has been submitted! 🌸 Here are the full details:
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="background: #FADADD30;">
          <td style="padding: 10px 12px; font-weight: bold; width: 160px; border-radius: 8px 0 0 8px;">👤 Customer Name</td>
          <td style="padding: 10px 12px; font-weight: 600; font-size: 15px; color: #4A3321;">${order.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; font-weight: bold;">📧 Email</td>
          <td style="padding: 10px 12px;"><a href="mailto:${order.email}" style="color: #B58A6A;">${order.email}</a></td>
        </tr>
        <tr style="background: #FADADD30;">
          <td style="padding: 10px 12px; font-weight: bold;">📱 Phone</td>
          <td style="padding: 10px 12px;"><a href="tel:${order.phone}" style="color: #B58A6A;">${order.phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; font-weight: bold;">📸 Instagram</td>
          <td style="padding: 10px 12px;">${instaLink}</td>
        </tr>
        <tr style="background: #FADADD30;">
          <td style="padding: 10px 12px; font-weight: bold;">🎀 Occasion</td>
          <td style="padding: 10px 12px; font-weight: 600; color: #B58A6A;">${order.occasion}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; font-weight: bold; vertical-align: top;">💬 Message</td>
          <td style="padding: 10px 12px; white-space: pre-wrap; line-height: 1.6;">${order.message}</td>
        </tr>
        <tr style="background: #FADADD30;">
          <td style="padding: 10px 12px; font-weight: bold;">🕐 Submitted At</td>
          <td style="padding: 10px 12px; font-size: 12px;">${formatDate(order.createdAt || new Date())}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; font-weight: bold; vertical-align: top;">🖼️ Reference Images</td>
          <td style="padding: 10px 12px; line-height: 1;">
            ${imageSection}
          </td>
        </tr>
      </table>

      <!-- Quick Action Buttons -->
      <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="mailto:${order.email}" style="display: inline-block; padding: 10px 20px; background: #B58A6A; color: white; border-radius: 50px; text-decoration: none; font-size: 12px; font-weight: bold;">
          ✉️ Reply via Email
        </a>
        <a href="https://wa.me/${order.phone.replace(/[^0-9]/g, '')}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; border-radius: 50px; text-decoration: none; font-size: 12px; font-weight: bold;">
          💬 Open WhatsApp
        </a>
        ${order.instagramUsername ? `<a href="https://instagram.com/${order.instagramUsername.replace('@', '').trim()}" style="display: inline-block; padding: 10px 20px; background: #E1306C; color: white; border-radius: 50px; text-decoration: none; font-size: 12px; font-weight: bold;">📸 Open Instagram</a>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #F5E6D3; padding: 16px 30px; text-align: center; border-top: 1px solid #FADADD;">
      <p style="margin: 0; font-size: 11px; color: #B58A6A;">
        🌷 DreamyCrochet05 — Handcrafted by Mom, Stitched with Love 🌷
      </p>
      <p style="margin: 4px 0 0; font-size: 10px; color: #B58A6A80;">
        This email was automatically sent from your website inquiry form.
      </p>
    </div>
  </div>`;
}

// ─── Main: Send Email Function ────────────────────────────────────────────────
/**
 * Sends a notification email to the admin for a new custom order inquiry.
 * @param {Object} order - The saved CustomOrder document from MongoDB
 * @param {string[]} imageUrls - Array of Cloudinary image URLs for reference images
 */
async function sendInquiryEmail(order, imageUrls = []) {

    console.log("🚀 sendInquiryEmail() called");

    const subject = '🌷 New Crochet Inquiry — DreamyCrochet05';

  
  const htmlBody = buildEmailHTML(order, imageUrls);

  if (!emailEnabled || !transporter) {
    return logToFile(order, imageUrls);
  }

  const mailOptions = {
    from: `"DreamyCrochet05 Inquiries" <${emailAddress}>`,
    to: emailAddress,
    subject,
    html: htmlBody
  };

  try {

    console.log("📨 About to send email...");

    const info = await transporter.sendMail(mailOptions);

    console.log("==================================");
    console.log("EMAIL SENT");
    console.log(info);
    console.log("Accepted:", info.accepted);
console.log("Rejected:", info.rejected);
console.log("Message ID:", info.messageId);
    console.log("==================================");

}

catch(err){

    console.log("❌ EMAIL FAILED");

    console.error(err);

    console.error("Message:", err.message);

    console.error("Code:", err.code);

    console.error("Response:", err.response);

    logToFile(order,imageUrls);

}

}

// ─── Local Fallback Logger ────────────────────────────────────────────────────
function logToFile(order, imageUrls = []) {
  const logPath = path.join(__dirname, '..', 'inbox_logs.txt');
  const separator = '='.repeat(60);
  const logEntry = `
${separator}
🌷 NEW CROCHET INQUIRY — DreamyCrochet05
DATE: ${formatDate(order.createdAt || new Date())}
${separator}
Customer Name : ${order.customerName}
Email         : ${order.email}
Phone         : ${order.phone}
Instagram     : ${order.instagramUsername || 'N/A'}
Occasion      : ${order.occasion}
Message       : ${order.message}
Images        : ${imageUrls.length > 0 ? imageUrls.join(', ') : 'None'}
${separator}
`;
  try {
    fs.appendFileSync(logPath, logEntry, 'utf-8');
    console.log('📝 [EmailService] Inquiry logged to inbox_logs.txt (email not configured).');
  } catch (e) {
    console.error('[EmailService] Could not write to inbox_logs.txt:', e.message);
  }
}

module.exports = { sendInquiryEmail };
