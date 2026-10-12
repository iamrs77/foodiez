const Role = require('../models/role');

exports.createRole = async(req, res) => {
    let _role = await Role.findOne({roleName: req.body.rolename})
    if(_role){
        return res.status(400).send({error: 'Role already exists'});
    }else{
        await Role.create(req.body, (err, data) => {
            if(err){
                res.status(400).send(err);
            } else {
                res.status(400).send(data);
            }
        })
    }
}