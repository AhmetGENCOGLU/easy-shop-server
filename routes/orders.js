const express = require("express");
const router = express.Router();
const {Order} = require("../models/order");
const {OrderItem} = require("../models/orderItem");

router.get(`/`, async (req, res)=>{
    const orderList = await Order.find().populate('user'); //veritebanından çağırılan veride User'ı açık bir şekilde gelsin.
    if(!orderList){
        res.status(500).json({
            success:false
        });
    }
    res.send(orderList);
});

router.get(`/:id`, async (req, res)=>{
    const order = await Order.findById(req.params.id)
    .populate('user')
    .populate({
        path: 'orderItems', populate:{
            path:'product',populate:'category'
        }
    }); //OrderItems veritabanında Array olarak kayıtlı olduğu için onu populate etmek için bu şekilde yazdık.Hatta gelen product değerinin category değerini de açık çağırdık
    if(!order){
        res.status(500).json({
            success:false
        });
    }
    res.send(order);
});

router.put('/:id', async (req,res)=>{
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status:req.body.status
        },
        {
            new:true
        }
    )

    if(!order){
        return res.status(400).send("The order cant be updated...");
    }

    res.send(order);
})

router.post('/', async (req,res)=>{
    const orderItemIDs = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))
    const orderItemIDsResolved = await orderItemIDs;

    const totalPrices = await Promise.all(orderItemIDsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product','price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }))

    const calculatedTotalPrice = totalPrices.reduce((a,b) => a + b , 0); // Reduce fonksiyonundaki 0 değeri initial değer

    let order = new Order({
        orderItems:orderItemIDsResolved,
        shippingAddress1:req.body.shippingAddress1,
        shippingAddress2:req.body.shippingAddress2,
        city:req.body.city,
        zip:req.body.zip,
        country:req.body.country,
        phone:req.body.phone,
        status:req.body.status,
        totalPrice:calculatedTotalPrice,
        user:req.body.user
    });
    order = await order.save();

    if(!order){
        return res.status(400).send("The order cant be created...");
    }

    res.send(order);
})

router.delete('/:id', (req,res)=>{
    Order.findByIdAndRemove(req.params.id)
    .then(async order=>{
        if(order){
            await order.orderItems.map(async orderItem =>{
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({
                success:true,
                message: "The order is deleted..."
            })
        } else {
            return res.status(404).json({
                success:false,
                message: "Order not found"
            });
        }
    })
    .catch(error => {
        return res.status(400).json({
            success:false,
            error:error
        })
    })
})

router.get('/get/totalsales', async (req, res)=> {
    const totalSales= await Order.aggregate([ // aggregate gruplandırır
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}} // id zorunlu o yüzden null diye belirttik
    ])

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales}) // Gelen totalSales verisinde _id değeri de vardı bu yüzden pop ile sadece sondaki total sales değerini aldık
})

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Order.countDocuments((count) => count)

    if(!orderCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid}).populate({ 
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} 
        }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})

module.exports = router;