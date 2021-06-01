const express = require("express");
const router = express.Router();
const {Product} = require("../models/product");
const {Category} = require("../models/category");
const mongoose = require("mongoose");
const multer = require("multer");

const FILE_TYPE_MAP = {
    'image/png' : 'png',
    'image/jpeg' : 'jpeg',
    'image/jpg' : 'jpg'
}

const storage = multer.diskStorage({
    destination: function(req, file, callBack){
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');
        if(isValid){
            uploadError = null
        }
        callBack(uploadError, 'public/uploads')
    },
    filename: function(req, file, callBack){
        const fileName = file.originalname.split(' ').join('-'); // replace('','-') da olurdu.
        const extension = FILE_TYPE_MAP[file.mimetype]
        callBack(null, `${fileName}-${Date.now()}.${extension}`)
    }
});
const uploadOptions = multer({storage : storage});

router.get(`/`, async (req, res)=>{
    let filter = {};
    if(req.query.categories){
        filter = {category : req.query.categories.split(",")};
    }
    const productList = await Product.find(filter).populate('category');
    if(!productList){
        res.status(500).json({
            success:false
        });
    }
    res.send(productList);
});

router.get(`/:id`, async (req, res)=>{
    const product = await Product.findById(req.params.id).populate('category');
    if(!product){
        res.status(500).json({
            success:false
        });
    }
    res.send(product);
});

router.post(`/`, uploadOptions.single('image') , async (req, res)=>{ // single'ın içindeki 'image',frontend'deki kulanılacağı input'un name değeridir.
    const category = await Category.findById(req.body.category);
    if(!category){
        return res.status(400).send("Invalid category")
    }
    const file = req.file;
    if(!file){
        return res.status(400).send("No image in the request")
    }
    const fileName = req.file.filename; // filename, yukarıdaki multer storage variablesi içindeki tanımlanan filename formatıdır.
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    let product = new Product({
        name:req.body.name,
        description:req.body.description,
        richDescription:req.body.richDescription,
        image:`${basePath}${fileName}`, // http://localhost:3000/public/uploads/image-24342343
        brand:req.body.brand,
        price:req.body.price,
        category:req.body.category,
        countInStock:req.body.countInStock,
        rating:req.body.rating,
        numReviews:req.body.numReviews,
        isFeatured:req.body.isFeatured
    });
    product = await product.save();
    if(!product){
        return res.status(500).send("The product cant be created...")
    }
    res.send(product);
});

router.put('/:id', uploadOptions.single('image') , async (req,res)=>{
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send("Invalid productID")
    }
    const category = await Category.findById(req.body.category);
    if(!category){
        return res.status(400).send("Invalid category")
    }

    const product = await Product.findById(req.params.id);
    if(!product){
        return res.status(400).send("Invalid product")
    }

    const file = req.file;
    let imagePath;

    if(file){
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    } else {
        imagePath = product.image
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name:req.body.name,
            description:req.body.description,
            richDescription:req.body.richDescription,
            image:imagePath,
            brand:req.body.brand,
            price:req.body.price,
            category:req.body.category,
            countInStock:req.body.countInStock,
            rating:req.body.rating,
            numReviews:req.body.numReviews,
            isFeatured:req.body.isFeatured
        },
        {
            new:true
        }
    )

    if(!updatedProduct){
        return res.status(500).send("The product cant be updated...");
    }

    res.send(updatedProduct);
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10) , async (req,res)=>{ // Arrayin içerisindeki 10 değeri,en fazla 10 resim yüklensin demek
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send("Invalid productID")
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    if(files){
        files.map(file => {
            imagesPaths.push(`${basePath}${file.filename}`)
        })
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        {
            new:true
        }
    );

    if(!updatedProduct){
        return res.status(500).send("The product cant be updated...");
    }

    res.send(updatedProduct);
});

router.delete('/:id', (req,res)=>{
    Product.findByIdAndRemove(req.params.id)
    .then(product=>{
        if(product){
            return res.status(200).json({
                success:true,
                message: "The product is deleted..."
            })
        } else {
            return res.status(404).json({
                success:false,
                message: "Product not found"
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

router.get(`/get/count`, async (req, res)=>{
    const productCount = await Product.countDocuments((count)=> count)
    if(!productCount){
        res.status(500).json({
            success:false
        });
    }
    res.send({productCount});
});

router.get(`/get/featured/:count`, async (req, res)=>{
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({isFeatured:true}).limit(+count);
    if(!products){
        res.status(500).json({
            success:false
        });
    }
    res.send(products);
});

module.exports = router;