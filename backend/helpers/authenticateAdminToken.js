const jwt = require('jsonwebtoken');
const Role = require('../models/role');
let dotenv = require('dotenv');
const User = require('../models/user');
dotenv.config();

let authenticateAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if(token == null){
        return res.status(401).send({error: 'no access'})
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async(err, user) => {
        if(err){
            return res.status(403).send({error: 'no access'})
        }
        let foundRole = await Role.findById(user.roleId);
        if(foundRole && foundRole.roleName === 'admin'){
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

module.exports = authenticateAdminToken;