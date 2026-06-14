const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const authAdmin = require('../middleware/authMiddleware');

router.get('/', getSettings);
router.put('/', authAdmin, updateSettings);

module.exports = router;
