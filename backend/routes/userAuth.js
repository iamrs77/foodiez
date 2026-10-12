let express = require('express');
let {createUser, signIn} = require('../controllers/userAuth');
let router = express.Router();

router.post('/register' ,createUser);
router.post('/signIn', signIn);

module.exports = router;