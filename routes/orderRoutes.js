const express = require('express');
const router = express.Router();
const { getCustomOrders, submitCustomOrder, updateOrderStatus, deleteCustomOrder } = require('../controllers/orderController');
const authAdmin = require('../middleware/authMiddleware');

router.get('/', authAdmin, getCustomOrders);
router.post('/', submitCustomOrder);
router.put('/:id/status', authAdmin, updateOrderStatus);
router.delete('/:id', authAdmin, deleteCustomOrder);

module.exports = router;
