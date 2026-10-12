const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const cors = require('cors');
const port = process.env.PORT || 5000;
let dbconnection = require('./helpers/dbConnection')

dbconnection();

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" )
    next();
})

app.use('/api/v1/fooditem', require("./routes/food"));
app.use('/api/v1/user', require('./routes/userAuth'));
app.use('/api/v1/vendor', require('./routes/vendor'));
app.use('/api/v1/role', require('./routes/roles'));
app.use('/api/v1/cart', require('./routes/cart'));

app.listen(port, () => {
    console.log(`listening at port: ${port}`)
})