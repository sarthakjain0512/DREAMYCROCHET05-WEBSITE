// middleware/validateCustomOrder.js
// Validation for custom order submission payloads
module.exports = (req, res, next) => {
  const { customerName, email, phone, occasion, message } = req.body;
  if (!customerName || !email || !phone || !occasion || !message) {
    return res.status(400).json({ error: 'Missing required fields: customerName, email, phone, occasion, message' });
  }
  // Simple email format check
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  // Phone number basic check (digits, optional +, length)
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  if (phoneDigits.length < 6) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  // Limit reference images (handled in controller, but also enforce here if files provided)
  const uploadedFiles = req.files || [];
  if (uploadedFiles.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 reference images are allowed' });
  }
  next();
};
