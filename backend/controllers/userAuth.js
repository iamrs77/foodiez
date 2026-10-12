const User = require('../models/user');
let Role = require('../models/role');
let jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function isEmailValid(email) {
    if (!email)
        return false;

    if(email.length>254)
        return false;

    if(!emailRegex.test(email))
        return false;

    let parts = email.split("@");
    if(parts[0].length>64)
        return false;

    let domainParts = parts[1].split(".");
    if(domainParts.some(function(part) { return part.length>63; }))
        return false;

    return true;
}

exports.createUser = async (req, res) => {
    let _email = req.body.email.toLowerCase();
    let _role = req.body.role ? req.body.role.toLowerCase() : '';
    delete req.body['role']

    const user = await User.findOne({ email: _email });
    if(user){
        return (res.status(400).send({error: 'User already exists with this email id'}));
    }else {
        
        if(_email && isEmailValid(_email)){
            if(req.body.password !== req.body.passwordConfirm){
                let err = new Error('Passwords do not Match');
                return (res.status(400).send({error: err.message}));
            }
            if(_email && req.body.password && req.body.passwordConfirm && req.body.firstName && req.body.lastName){
                let user = new User(req.body)
                let role = await Role.findOne({roleName: _role});
                if(role){
                    user.roleId = role._id;
                    await User.create(user, async (err, data) => {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            let foundRole = await Role.findById(user.roleId);
                            const payload = {
                                _id: data._id,
                                email: data.email,
                                roleId: data.roleId,
                                roleName: foundRole.roleName
                            }
                            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 24*60*60})
                            res.setHeader('Set-Cookie', `jwt=${accessToken}`, {maxAge: 24 * 60 * 60 * 1000})
                            res.status(201).send({data, accessToken});
                        }
                    })
                } else {
                    return res.status(400).send({error: 'No such role exists'});
                }
            } else {
                let err = new Error('Please Enter All the Details');
                return (res.status(400).send({error: err.message}));
            }
        } else {
            let err = new Error('Email is invalid');
            return (res.status(400).send({error: err.message}));
        }
    }
}

exports.signIn = async (req, res) => {
    const {email, password} = req.body;
    if(email && password) {
        const user = await User.findOne({email});
        if(!user){
            return (res.status(400).send({error: 'User with this email does not exist'}));
        }

        user.authenticate(password, async (data) => {
            if(!data.res){
                return (res.status(400).send({error: 'Email and password do not match'}));
            }
            let foundRole = await Role.findById(user.roleId);
            const payload = {
                _id: user._id,
                email: user.email,
                roleId: user.roleId,
                roleName: foundRole.roleName,
            }
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: 24*60*60})
            return res.status(200).json({accessToken});
        });

    } else {
        return (res.status(400).send({error: 'Please enter valid email and password'}));
    }
}