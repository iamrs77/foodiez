let jwt = require('jsonwebtoken');
const Role = require('../models/role');
require('dotenv').config();
const User = require('../models/user');

function authenticateVendorToken (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1]
    if(token == null){
        return res.status(401).send({error: 'no access'})
    }
    jwt.verify(token,  process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if(err){
            return res.status(403).send({error: 'no access'})
        }
        let foundRole = await Role.findById(user.roleId);
        if(foundRole && foundRole.roleName === 'vendor'){
            const foundUser = await User.findById(user._id);
            if(foundUser){
                req.user = user;
                next();
            } else {
                return res.status(403).send({error: 'no access'})
            }
        } else {
            return res.status(403).send({error: 'no access'})
        }
        
    })

}

module.exports = authenticateVendorToken;