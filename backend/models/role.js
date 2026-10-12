const mongoose = require('mongoose');

let roleSchema = mongoose.Schema({
    roleName: {
        type: String,
    }
},{
    timestamps: true
})

module.exports = mongoose.model('roles', roleSchema);