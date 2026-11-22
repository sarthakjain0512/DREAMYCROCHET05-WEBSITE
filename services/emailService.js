// services/emailService.js
// ─────────────────────────────────────────────────────────────────────────────
// DreamyCrochet05 — Email Notification Service (Brevo REST API)
//
// Sends transactional emails using Brevo REST API:
// 1. Admin notifications for new custom order inquiries.
// 2. Customer thank-you acknowledgement emails.
//
// ⚙️ Setup: Add this to your .env file:
//   BREVO_API_KEY=your_brevo_v3_api_key
// ─────────────────────────────────────────────────────────────────────────────
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// ─── Brevo REST API Configuration ───────────────────────────────────────────
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = 'DreamyCrochet05';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'exploringindia0512@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'exploringindia0512@gmail.com';

if (process.env.BREVO_API_KEY) {
  console.log('📧 [EmailService] Brevo REST API configured successfully.');
} else {
  console.warn('⚠️  [EmailService] BREVO_API_KEY not configured in .env — emails will be logged locally to inbox_logs.txt.');
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
 * Sends a notification email to the admin for a new custom order inquiry via Brevo REST API.
 * @param {Object} order - The saved CustomOrder document from MongoDB
 * @param {string[]} imageUrls - Array of Cloudinary image URLs for reference images
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendInquiryEmail(order, imageUrls = []) {
  console.log("🚀 sendInquiryEmail() called");

  const htmlBody = buildEmailHTML(order, imageUrls);

  if (!process.env.BREVO_API_KEY) {
    console.warn("⚠️ [EmailService] BREVO_API_KEY not configured — logging inquiry to file.");
    logToFile(order, imageUrls);
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [
      {
        email: ADMIN_EMAIL,
        name: "DreamyCrochet05 Admin"
      }
    ],
    subject: "🌷 New Crochet Inquiry — DreamyCrochet05",
    htmlContent: htmlBody
  };

  if (order.email) {
    payload.replyTo = {
      email: order.email,
      name: order.customerName || "Customer"
    };
  }

  try {
    console.log("📨 Sending admin notification email via Brevo REST API...");
    const response = await axios.post(
      BREVO_API_URL,
      payload,
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log("==================================");
    console.log("✅ ADMIN EMAIL SENT VIA BREVO API");
    if (response.data && response.data.messageId) {
      console.log("Message ID:", response.data.messageId);
    }
    console.log("==================================");

    return { success: true, messageId: response.data?.messageId };
  } catch (err) {
    const errorDetails = err.response
      ? { status: err.response.status, data: err.response.data }
      : { message: err.message };
    console.error("❌ Brevo API admin notification failed:", JSON.stringify(errorDetails));
    logToFile(order, imageUrls);
    return { success: false, error: err.response?.data?.message || err.message };
  }
}

// ─── Build Customer Acknowledgement HTML Email Body ──────────────────────────
function buildCustomerAcknowledgementHTML(order) {
  const customerName = (order.customerName || 'there').trim();

  return `
  <div style="font-family: 'Georgia', serif; line-height: 1.8; color: #4A3321; max-width: 600px; margin: 0 auto; border: 1px solid #FADADD; border-radius: 20px; overflow: hidden; background: #FFF8EE;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #B58A6A 0%, #FADADD 100%); padding: 32px 24px 24px; text-align: center;">
      <p style="font-size: 34px; margin: 0; line-height: 1;">🌸</p>
      <h1 style="margin: 10px 0 4px; font-size: 22px; color: #ffffff; font-weight: bold; letter-spacing: 0.5px;">DreamyCrochet05</h1>
      <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-style: italic;">Handcrafted by Mom, Stitched with Love</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 28px; background: #ffffff;">
      <p style="font-size: 16px; font-weight: bold; color: #4A3321; margin: 0 0 16px;">
        Hi ${customerName}! 💗
      </p>

      <p style="font-size: 14px; color: #4A3321; margin: 0 0 16px; line-height: 1.7;">
        Thank you so much for reaching out to <strong>DreamyCrochet05</strong>!
      </p>

      <div style="background: #FFF8EE; border-left: 4px solid #B58A6A; border-radius: 4px 12px 12px 4px; padding: 16px 20px; margin: 20px 0;">
        <p style="font-size: 14px; color: #4A3321; margin: 0; line-height: 1.7;">
          We've successfully received your custom crochet inquiry and are excited to bring your creative idea to life. 🌷
        </p>
      </div>

      <p style="font-size: 14px; color: #4A3321; margin: 0 0 16px; line-height: 1.7;">
        Our team will review your requirements and get back to you within 24 hours to discuss the design, colors, pricing, and other details.
      </p>

      <p style="font-size: 14px; color: #4A3321; margin: 0 0 24px; line-height: 1.7;">
        Thank you for supporting handmade creations. Every stitch is made with love! 🧶
      </p>

      <div style="border-top: 1px dashed #FADADD; padding-top: 18px; margin-top: 24px;">
        <p style="margin: 0; font-size: 14px; color: #4A3321; font-weight: bold;">
          With love,<br>
          <span style="color: #B58A6A;">Team DreamyCrochet05 🌸</span>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #F5E6D3; padding: 18px 24px; text-align: center; border-top: 1px solid #FADADD;">
      <p style="margin: 0; font-size: 11px; color: #B58A6A; font-weight: 600;">
        🌷 DreamyCrochet05 — Handcrafted by Mom, Stitched with Love 🌷
      </p>
      <p style="margin: 4px 0 0; font-size: 10px; color: #8A6D55;">
        This is an automated confirmation sent to ${order.email || 'your email'}.
      </p>
    </div>
  </div>`;
}

// ─── Customer Acknowledgement Email ──────────────────────────────────────────
/**
 * Sends a customer acknowledgement email confirming their custom order inquiry via Brevo REST API.
 * @param {Object} order - The mapped CustomOrder object containing customer details
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendCustomerAcknowledgementEmail(order) {
  console.log("💌 sendCustomerAcknowledgementEmail() called for:", order?.email);

  if (!order || !order.email) {
    console.warn("⚠️ [EmailService] Cannot send acknowledgement: missing customer email.");
    return { success: false, error: 'Missing customer email' };
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn("⚠️ [EmailService] BREVO_API_KEY not configured — skipping customer acknowledgement email.");
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  const customerName = (order.customerName || 'there').trim();
  const htmlBody = buildCustomerAcknowledgementHTML(order);
  const textBody = `Hi ${customerName}! 💗

Thank you so much for reaching out to DreamyCrochet05!

We've successfully received your custom crochet inquiry and are excited to bring your creative idea to life. 🌷

Our team will review your requirements and get back to you within 24 hours to discuss the design, colors, pricing, and other details.

Thank you for supporting handmade creations. Every stitch is made with love! 🧶

With love,
Team DreamyCrochet05 🌸`;

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [
      {
        email: order.email,
        name: customerName
      }
    ],
    subject: "🌸 Thank You for Choosing DreamyCrochet05!",
    htmlContent: htmlBody,
    textContent: textBody
  };

  try {
    console.log("📨 Sending customer acknowledgement email via Brevo REST API...");
    const response = await axios.post(
      BREVO_API_URL,
      payload,
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log("==================================");
    console.log("✅ CUSTOMER ACKNOWLEDGEMENT SENT VIA BREVO API");
    if (response.data && response.data.messageId) {
      console.log("Message ID:", response.data.messageId);
    }
    console.log("==================================");

    return { success: true, messageId: response.data?.messageId };
  } catch (err) {
    const errorDetails = err.response
      ? { status: err.response.status, data: err.response.data }
      : { message: err.message };
    console.error("❌ Brevo API customer acknowledgement failed:", JSON.stringify(errorDetails));
    return { success: false, error: err.response?.data?.message || err.message };
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

module.exports = {
  sendInquiryEmail,
  sendCustomerAcknowledgementEmail
};
