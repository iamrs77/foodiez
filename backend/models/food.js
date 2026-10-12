const mongoose = require("mongoose");

let foodItemSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    rating: { 
        type: Number,
        default: 0,
    },
    foodType: { 
        type: String,
        required: true,
    },
    cost: { 
        type: Number,
        required: true,
    },
    vendorId: {
        type: String,
        required: true,
    },
},{
    timestamps: true,
});

module.exports = mongoose.model("FoodItem", foodItemSchema);
