let express = require('express');
let {createVendor, updateVendor, getAllVendors, getAllUserVendors} = require('../controllers/vendor');
const authenticateUserToken = require('../helpers/authenticateUserToken');
const authenticateVendorToken = require('../helpers/authenticateVendorToken');
let router = express.Router();

router.post('/create', authenticateVendorToken ,createVendor);
router.patch('/update/:id', authenticateVendorToken ,updateVendor);
router.get('/all', authenticateUserToken ,getAllVendors);
router.get('/allVendorsOfUser', authenticateVendorToken, getAllUserVendors)

module.exports = router;