let express = require('express');
let {getAllFoodItems, addFoodItem, updateFoodItem, deleteFoodItem, getFoodItems} = require('../controllers/food');
const authenticateToken = require('../helpers/authenticateToken');
const authenticateUserToken = require('../helpers/authenticateUserToken');
const authenticateVendorToken = require('../helpers/authenticateVendorToken');
let router = express.Router();

router.get('/getAll', authenticateUserToken ,getAllFoodItems)
router.get('/get/:vendorId', authenticateToken ,getFoodItems)
router.get('/getAllForVendor', authenticateVendorToken ,getAllFoodItems)
router.post('/add/:vendorId', authenticateVendorToken ,addFoodItem)
router.patch('/update/:id', authenticateVendorToken, updateFoodItem);
router.delete('/delete/:id', authenticateVendorToken, deleteFoodItem);

module.exports = router;