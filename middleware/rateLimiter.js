// middleware/rateLimiter.js
// Simple in-memory rate limiting middleware (no external dependencies)
// options: { windowMs, maxRequests, message }
module.exports = function (options) {
  const windowMs = options.windowMs || 60 * 1000; // default 1 minute
  const maxRequests = options.maxRequests || 5; // default 5 requests per window
  const message = options.message || 'Too many requests, please try again later.';
  const ipMap = new Map(); // { ip: { count, firstRequestTimestamp } }

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    let entry = ipMap.get(ip);
    if (!entry) {
      entry = { count: 1, first: now };
      ipMap.set(ip, entry);
    } else {
      if (now - entry.first > windowMs) {
        // reset window
        entry.count = 1;
        entry.first = now;
      } else {
        entry.count++;
      }
    }
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: message });
    }
    next();
  };
};
