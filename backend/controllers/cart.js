let CartItem = require('../models/cart');
const user = require('../models/user');

exports.getUserCart = async(req, res) => {
    try {
        let userId = req.user._id;
        await CartItem.find({userId: userId, status: 'pending'}).populate("foodItem").exec((err, data) =>{
            if(err){
                res.status(500).send(err);
            } else {
                let cartitems = data.map(item => {
                    return item.foodItem
                })
                res.status(200).send(cartitems);
            }
        })
    } catch(err) {
        console.log(er)
    }
}

exports.addToCart = async (req, res) => {
    let _userId = req.user._id;
    let newCartItem = new CartItem(req.body);
    newCartItem.userId = _userId;
    await CartItem.create(newCartItem, (err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
}

exports.removeFromCart = async (req, res) => {
    let foodItemId = req.params.fooditemId;
    await CartItem.findOne({foodItem: foodItemId, status: 'pending'}, (err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            data?.remove()
            res.status(201).send(data);
        }
    })
}

exports.placeOrder = async(req, res) => {
    await CartItem.updateMany({userId: req.user._id, status: 'pending'}, {$set : { status : 'placed'}}, (err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
}

exports.getOrderHistory = async (req, res) => {
    await CartItem.find({userId: req.user._id, status: 'placed'}).limit(10).sort({createdAt: -1}).populate("foodItem").exec((err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
}