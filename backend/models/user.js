let mongoose = require('mongoose');
let bcrypt = require('bcrypt');

let userSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    firstName: {
        type: String,
        trim: true,
        maxlength: 20,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: 20,
        required: true
    },
    roleId: {
        type: String,
        default: null
    },
    password: {
        type: String,
        required: true
    },
    passwordConfirm: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
})

userSchema.pre('save', function(next) {
    let user = this;
    user.email = user.email.toLowerCase();
    bcrypt.hash(user.password, 10, (err, hash) => {
        if(err){
            return err;
        }
        user.password = hash;
        user.passwordConfirm = hash;
        //next means move to next middleware if any
        next();
    })
})

userSchema.methods = {
    authenticate: function (password, callback) {
        bcrypt.compare(password, this.password, (err, res) => {
            callback({res: res})
        });
    }
}


module.exports = mongoose.model('User', userSchema);