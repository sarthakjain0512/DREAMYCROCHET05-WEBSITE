const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const CustomOrder = require('../models/CustomOrder');
const { uploadImage } = require('../utils/imageHelper');
const { getLocalDB, saveLocalDB, isMongoDBConnected } = require('../utils/localDbHelper');

// Configure Nodemailer using EMAIL and EMAIL_PASSWORD env keys
let useEmail = false;
let transporter = null;
if (process.env.EMAIL && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  useEmail = true;
  console.log('📧 Nodemailer Gmail configuration loaded successfully.');
} else {
  console.log('⚠️ Gmail configuration missing. Custom order emails will be logged locally to "inbox_logs.txt".');
}

const mapOrderToFrontend = (o) => {
  return {
    id: o._id || o.id,
    name: o.customerName,
    email: o.email,
    phone: o.phone,
    instagram: o.instagramUsername,
    occasion: o.occasion,
    desc: o.message,
    refPhoto: o.referencePhoto,
    status: o.status,
    date: o.createdAt
  };
};

const getCustomOrders = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const orders = await CustomOrder.find({}).sort({ createdAt: -1 });
      const mapped = orders.map(mapOrderToFrontend);
      return res.json(mapped);
    } else {
      const db = getLocalDB();
      const ordersCopy = [...db.orders].reverse();
      return res.json(ordersCopy);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const submitCustomOrder = async (req, res) => {
  const { name, email, phone, instagram, occasion, desc, refPhoto } = req.body;

  if (!name || !email || !phone || !occasion || !desc) {
    return res.status(400).json({ error: 'Missing required customer order fields' });
  }

  try {
    const uploadedUrl = await uploadImage(refPhoto, 'orders');

    let savedOrder;
    if (isMongoDBConnected()) {
      const o = new CustomOrder({
        customerName: name,
        email,
        phone,
        instagramUsername: instagram || '',
        occasion,
        message: desc,
        referencePhoto: uploadedUrl,
        status: 'New'
      });
      await o.save();
      savedOrder = mapOrderToFrontend(o);
    } else {
      const db = getLocalDB();
      savedOrder = {
        id: 'order-' + Date.now(),
        name,
        email,
        phone,
        instagram: instagram || '',
        occasion,
        desc,
        refPhoto: uploadedUrl,
        status: 'New',
        date: new Date()
      };
      db.orders.push(savedOrder);
      saveLocalDB();
    }

    // Format email content
    const emailSubject = `🌸 New Custom Order Inspiration from ${name}!`;
    const formattedDate = new Date(savedOrder.date || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const refPhotoLink = uploadedUrl ? `<a href="${uploadedUrl}" target="_blank">View Reference Image</a>` : 'None';
    const emailBodyHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #4A3321; max-width: 600px; border: 1px solid #B58A6A; border-radius: 15px; padding: 20px; background-color: #FFF8EE;">
        <h2 style="color: #B58A6A; border-bottom: 2px solid #FADADD; padding-bottom: 10px; margin-top: 0;">New Custom Order Request</h2>
        <p>A new design inspiration has been submitted by a customer:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 150px;">Customer Name:</td>
            <td style="padding: 6px 0;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Email Address:</td>
            <td style="padding: 6px 0;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Phone Number:</td>
            <td style="padding: 6px 0;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Instagram:</td>
            <td style="padding: 6px 0;">${instagram ? `<a href="https://instagram.com/${instagram.replace('@','').trim()}">${instagram}</a>` : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Occasion:</td>
            <td style="padding: 6px 0;">${occasion}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Description:</td>
            <td style="padding: 6px 0; white-space: pre-wrap;">${desc}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Date Received:</td>
            <td style="padding: 6px 0;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Uploaded Image:</td>
            <td style="padding: 6px 0;">${refPhotoLink}</td>
          </tr>
        </table>
        
        ${uploadedUrl ? `
        <div style="margin-top: 20px; text-align: center;">
          <p style="font-weight: bold; margin-bottom: 10px;">Reference Photo Preview:</p>
          <img src="${uploadedUrl}" alt="Reference Image" style="max-width: 100%; max-height: 300px; border-radius: 10px; border: 1px solid #B58A6A;" />
        </div>
        ` : ''}
        
        <div style="margin-top: 20px; border-top: 1px solid #FADADD; padding-top: 10px; font-size: 11px; color: #B58A6A; text-align: center;">
          DreamyCrochet05 - Handcrafted by Mom, Stitched with Love 🌸
        </div>
      </div>
    `;

    if (useEmail) {
      const receiver = process.env.EMAIL;
      const mailOptions = {
        from: `"DreamyCrochet05 Alerts" <${process.env.EMAIL}>`,
        to: receiver,
        subject: emailSubject,
        html: emailBodyHTML
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('❌ Nodemailer failed to send email:', error.message);
        } else {
          console.log('📧 Nodemailer sent email successfully:', info.response);
        }
      });
    } else {
      // Log local fallback inbox file
      const logFilePath = path.join(__dirname, '..', 'inbox_logs.txt');
      const logContent = `
======================================================
${emailSubject}
DATE: ${formattedDate}
------------------------------------------------------
Customer Name: ${name}
Email: ${email}
Phone: ${phone}
Instagram: ${instagram}
Occasion: ${occasion}
Description: ${desc}
Reference Photo URL: ${uploadedUrl || 'None'}
======================================================
\n`;
      fs.appendFileSync(logFilePath, logContent, 'utf-8');
      console.log('📧 Custom order logged locally to inbox_logs.txt.');
    }

    return res.status(201).json(savedOrder);
  } catch (err) {
    console.error('❌ Error saving custom order request:', err);
    return res.status(500).json({ error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['New', 'Contacted', 'Accepted', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid order status value' });
  }

  try {
    if (isMongoDBConnected()) {
      const o = await CustomOrder.findByIdAndUpdate(id, { status }, { new: true });
      if (!o) return res.status(404).json({ error: 'Order not found' });
      return res.json(mapOrderToFrontend(o));
    } else {
      const db = getLocalDB();
      const idx = db.orders.findIndex(ord => ord.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Order not found' });
      
      db.orders[idx].status = status;
      saveLocalDB();
      return res.json(db.orders[idx]);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteCustomOrder = async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoDBConnected()) {
      const o = await CustomOrder.findByIdAndDelete(id);
      if (!o) return res.status(404).json({ error: 'Order not found' });
      return res.json({ success: true });
    } else {
      const db = getLocalDB();
      const idx = db.orders.findIndex(ord => ord.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Order not found' });
      
      db.orders.splice(idx, 1);
      saveLocalDB();
      return res.json({ success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCustomOrders,
  submitCustomOrder,
  updateOrderStatus,
  deleteCustomOrder
};
