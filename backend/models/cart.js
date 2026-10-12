const mongoose = require('mongoose');

let cartItemSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    foodItem: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'FoodItem'
    },
    status: {
        type: String,
        default: 'pending'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('CartItem', cartItemSchema)