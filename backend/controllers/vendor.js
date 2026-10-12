const Vendor = require('../models/vendor');
const User = require('../models/user');

exports.createVendor = async (req, res) => {
    let _vendor = (req.body);
    let vendor = await Vendor.findOne({name: req.body.name});
    if(vendor){
        return res.status(400).send({error: "Business with this name already exists"})
    }else{
        if(_vendor.name && _vendor.foodType && _vendor.minPrice && _vendor.location){
            let newVendor = Vendor(req.body);
            newVendor.userId = req.user._id;
            await Vendor.create(newVendor, (err, data) => {
                if(err){
                    res.status(500).send(err);
                }else{
                    res.status(200).send(data);
                }
            })
        } else {
            return res.status(400).send({error: "Some Error occured, please try again"})
        }
    }
}

exports.updateVendor = async(req, res) => {
    const id = req.params.id;
    await Vendor.findByIdAndUpdate(id, {
        name: req.body.name ? req.body.name : null,
        location: req.body.location ? req.body.location : null,
        foodType: req.body.foodType ? req.body.foodType : null,
        minPrice: req.body.minPrice ? req.body.minPrice: null
    }, (err, data) => {
        if(err){
            return res.status(400).send(err);
        }else{
            res.status(201).send(data);
        }
    })
}

exports.getAllVendors = async(req, res) => {
    await Vendor.find({}, (err, tasks) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(tasks);
        }
    })
}

exports.getAllUserVendors = async(req, res) => {
    let _userId = req.user._id;
    await Vendor.find({userId: _userId}, (err, tasks) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(tasks);
        }
    })
}