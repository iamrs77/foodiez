const FoodItem = require('../models/food');
const Vendor = require('../models/vendor');

exports.getAllFoodItems = async(req, res) => {
    await FoodItem.find({}, (err, tasks) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(tasks);
        }
    })
}

exports.getFoodItems = async(req, res) => {
    await FoodItem.find({vendorId: req.params.vendorId}, (err, tasks) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(tasks);
        }
    })
}

exports.addFoodItem = async(req, res) => {
    let _name = req.body.name? req.body.name : '';
    let _vendor = await Vendor.findOne({_id: req.params.vendorId, userId: req.user._id})
    if(_vendor){
        let foodItem = await FoodItem.findOne({name: _name, vendorId: _vendor._id})
        if(foodItem){
            res.status(400).send({error: 'this food item already exists, add a new one'});
        } else {
            const foodItem = new FoodItem(req.body);
            foodItem.vendorId = _vendor._id;
            await FoodItem.create(foodItem, (err, data) => {
                if(err){
                    res.status(500).send(err);
                } else {
                    res.status(201).send(data);
                }
            })
        }
    } else {
        return res.status(400).send({error: 'Vendor does not exist, Create vendor before adding item'});
    }
}

exports.updateFoodItem = async(req, res) => {
    const id = req.params.id;
    await FoodItem.findByIdAndUpdate(id, {
        name: req.body.name ? req.body.name : null,
        description: req.body.description ? req.body.description : null,
        foodType: req.body.foodType ? req.body.foodType : null,
        cost: req.body.cost ? req.body.cost: null
    }, (err, data) => {
        if(err){
            return res.status(400).send(err);
        }else{
            res.status(201).send(data);
        }
    })
}

exports.deleteFoodItem = async(req, res) => {
    const id = req.params.id;
    await FoodItem.findByIdAndRemove(id, (err, data) => {
        if (err){
            res.status(500).send(err);
        } else{
            res.status(200).send(data);
            //data is deleted task
        }
    });
}