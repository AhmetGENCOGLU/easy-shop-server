const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/errorHandler");
require('dotenv/config');
const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

//middleware
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads')); //Resimlerin urllerini yazınca browserda görüntülemek için.

//routers
app.use(`/products`, productsRoutes);
app.use(`/categories`, categoriesRoutes);
app.use(`/users`, usersRoutes);
app.use(`/orders`, ordersRoutes);

mongoose.connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, dbName:'easy_shop_database' }
);
const connection = mongoose.connection;
connection.once("open", () => {
    console.log("connected database."); 
    //users collection değişince çalışacak.   
    const userCollection = connection.collection("users");
    const changeUserCollection = userCollection.watch();
    changeUserCollection.on("change", change => console.log({userCollectionChanged : change}));
    //products collection değişince çalışacak.   
    const productCollection = connection.collection("products");
    const changeProductCollection = productCollection.watch();
    changeProductCollection.on("change", change => console.log({productCollectionChanged : change}));
    //orders collection değişince çalışacak.   
    const orderCollection = connection.collection("orders");
    const changeOrderCollection = orderCollection.watch();
    changeOrderCollection.on("change", change => console.log({orderCollectionChanged : change}));
    //orderitems collection değişince çalışacak.   
    const orderItemCollection = connection.collection("orderitems");
    const changeOrderItemCollection = orderItemCollection.watch();
    changeOrderItemCollection.on("change", change => console.log({orderItemCollectionChanged : change}));
    //categories collection değişince çalışacak.   
    const categoryCollection = connection.collection("categories");
    const changeCategoryCollection = categoryCollection.watch();
    changeCategoryCollection.on("change", change => console.log({categoryCollectionChanged : change}));
});


var server = app.listen(process.env.PORT, '192.168.0.10' ,()=>{ //ReactNative ile Backend arasında network error olduğu için ip adresini belirttik. Ve frontenddeki axios dosyasına baseURL i de ip şeklinde yazdık
    var port = server.address().port;
    console.log(`Express is working on port: ${port}`);
});