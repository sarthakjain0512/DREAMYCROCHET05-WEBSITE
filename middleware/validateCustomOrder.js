// middleware/validateCustomOrder.js
// DreamyCrochet05
// Validates custom order submissions before controller

module.exports = (req, res, next) => {

  const {
    customerName,
    email,
    phone,
    occasion,
    message
  } = req.body;

  // Required fields
  if (
    !customerName ||
    !email ||
    !phone ||
    !occasion ||
    !message
  ) {
    return res.status(400).json({
      error:
        'Missing required fields: customerName, email, phone, occasion, message'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email address'
    });
  }

  // Phone validation
  const phoneDigits = phone.replace(/\D/g, '');

  if (phoneDigits.length < 10) {
    return res.status(400).json({
      error: 'Invalid phone number'
    });
  }

  // Maximum 5 images
  if (req.files && req.files.length > 5) {
    return res.status(400).json({
      error: 'Maximum 5 reference images allowed'
    });
  }

  next();

};