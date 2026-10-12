let express = require('express');
const { addToCart, getUserCart, removeFromCart, placeOrder, getOrderHistory } = require('../controllers/cart');
const authenticateUserToken = require('../helpers/authenticateUserToken');

const router = express.Router();

router.get('/getAllForUser',authenticateUserToken, getUserCart);
router.post('/addToCart', authenticateUserToken, addToCart)
router.delete('/removeFromCart/:fooditemId', authenticateUserToken, removeFromCart)
router.patch('/placeOrder', authenticateUserToken, placeOrder)
router.get('/getOrderHistory', authenticateUserToken, getOrderHistory)

module.exports = router