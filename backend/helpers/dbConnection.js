const mongoose = require('mongoose')
const dotenv = require('dotenv');
dotenv.config();

const dbConnection = () => {
    mongoose.set("useFindAndModify", false);

    const url = process.env.DB_CONNECT;
    mongoose.connect(url, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

    const db = mongoose.connection;

    db.once('open', () => {
        console.log("Connected to Database");
    })
}

module.exports = dbConnection;
