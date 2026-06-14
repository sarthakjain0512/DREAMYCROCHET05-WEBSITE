// middleware/validateAdminLogin.js
// Simple validation for admin login payload
module.exports = (req, res, next) => {
  let { email, password } = req.body;
  if (email) email = email.trim();
  if (password) password = password.trim();
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  // Email format validation
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  next();
};
