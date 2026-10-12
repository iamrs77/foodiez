let express = require('express');
const { createRole } = require('../controllers/role');
const authenticateAdminToken = require('../helpers/authenticateAdminToken');

let router = express.Router();

router.post('/createRole', authenticateAdminToken, createRole)

module.exports = router