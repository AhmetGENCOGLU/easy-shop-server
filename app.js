const express = require("express");
const app = express();
require("dotenv/config");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/errorHandler");

app.use(cors());
app.options('*', cors());

const api = process.env.API_URL;


const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

//middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads')); //Resimlerin urllerini yazınca browserda görüntülemek için.

//routers
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

mongoose.connect( process.env.CONNECTION_STRING, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
.then(()=>{
    console.log("Database connection is ready...")
})
.catch(err => console.log(err));

//Development
// app.listen(3000, () => {
//     console.log("Server is running at Localhost:3000");
// });

//Production
var server = app.listen(process.env.PORT || 8080 ,()=>{
    var port = server.address().port;
    console.log(`Express is working on port: ${port}`);
});