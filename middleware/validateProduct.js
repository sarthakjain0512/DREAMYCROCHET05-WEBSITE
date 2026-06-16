// middleware/validateProduct.js
// Validation for product create/update payloads with trimming and price checks
module.exports = (req, res, next) => {
  let { title, price, category, description, imagesBase64, imageBase64 } = req.body;
  // Trim inputs if they are strings
  if (typeof title === 'string') title = title.trim();
  if (typeof price === 'string') price = price.trim();
  if (typeof category === 'string') category = category.trim();
  if (typeof description === 'string') description = description.trim();

  if (!title) {
    return res.status(400).json({ error: 'Product title is required' });
  }
  if (!price) {
    return res.status(400).json({ error: 'Product price is required' });
  }
  // Accept prices like ₹250, Rs.250, ₹ 250 or just 250
const cleanedPrice = String(price).replace(/[^\d.]/g, '');

const priceNum = Number(cleanedPrice);

if (isNaN(priceNum) || priceNum <= 0) {
  return res.status(400).json({
    error: 'Product price must be a positive number'
  });
}

// Store the cleaned numeric value
req.body.price = priceNum;
  // category optional but ensure if provided it's a string
  if (category && typeof category !== 'string') {
    return res.status(400).json({ error: 'Product category must be a string' });
  }
  if (!description) {
    return res.status(400).json({ error: 'Product description is required' });
  }
  // At least one image required: either base64 list, a single base64, or uploaded file (handled earlier)
  const hasImagesArray = Array.isArray(imagesBase64) && imagesBase64.length > 0;
  const hasSingleBase64 = typeof imageBase64 === 'string' && imageBase64.startsWith('data:image');
  if (!hasImagesArray && !hasSingleBase64 && !req.file) {
    return res.status(400).json({ error: 'At least one product image is required' });
  }
  // Attach trimmed values back to req.body for downstream handlers
  req.body.title = title;
req.body.price = priceNum;
  if (category) req.body.category = category;
  req.body.description = description;
  next();
};
