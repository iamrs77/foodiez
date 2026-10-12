let mongoose = require('mongoose');

let vendorSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    foodType: {
        type: String,
        required: true
    },
    rating: {
        type: String,
    },
    minPrice: {
        type: Number,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    userId: {
        type: String,
        required: true
    },
    rating: {
        type: String,
    },
    deliveryTime: {
        type: String,
        required: true
    }
},{
    timestamps: true
})

module.exports = mongoose.model('Vendor', vendorSchema);