const express = require("express");
const router = express.Router();
const {User} = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get(`/`, async (req, res)=>{
    const userList = await User.find().select("-passwordHash"); //passwordHash değeri hariç çağırıyor
    if(!userList){
        res.status(500).json({
            success:false
        });
    }
    res.send(userList);
});

router.get('/:id', async (req,res)=>{
    const user = await User.findById(req.params.id).select("-passwordHash");
    if(!user){
        res.status(500).json({
            success:false,
            message:"There isnt the user you requested..."
        });
    }
    res.status(200).send(user);
})

router.put("/:id", async (req,res)=>{
    const userExist = await User.findById(req.params.id);
    let newPassword;
    if(req.body.password){
        newPassword = bcrypt.hashSync(req.body.password, 10) // 10 değerini biz rastgele verdik. bcrypt hashSync fonksiyonunu 2. parametresi Number değer alır
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name:req.body.name,
            email:req.body.email,
            passwordHash: newPassword,
            phone:req.body.phone,
            isAdmin:req.body.isAdmin,
            street:req.body.street,
            apartment:req.body.apartment,
            zip:req.body.zip,
            city:req.body.city,
            country:req.body.country
        },
        {new:true}
    )
    if(!user){
        return res.status(400).send("The user cant be updated...");
    }

    res.send(user);
})

router.post('/', async (req,res)=>{
    let user = new User({
        name:req.body.name,
        email:req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10 ), // Bu 10 değerini aynı kullanmalırız diğer kullandığımız yerlerde. Yada başka bi rakam olacak ama aynı olacak
        phone:req.body.phone,
        isAdmin:req.body.isAdmin,
        street:req.body.street,
        apartment:req.body.apartment,
        zip:req.body.zip,
        city:req.body.city,
        country:req.body.country
    });
    user = await user.save();
    if(!user){
        return res.status(400).send("The user cant be created...");
    }
    res.send(user);
})

router.post('/register', async (req,res)=>{
    let user = new User({
        name:req.body.name,
        email:req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10 ),
        phone:req.body.phone,
        isAdmin:req.body.isAdmin,
        street:req.body.street,
        apartment:req.body.apartment,
        zip:req.body.zip,
        city:req.body.city,
        country:req.body.country
    });
    user = await user.save();
    if(!user){
        return res.status(400).send("The user cant be created...");
    }
    res.send(user);
})

router.post('/login', async (req,res) => {
    const user = await User.findOne({
        email: req.body.email
    })
    const secret = process.env.SECRET_WORDS_FOR_LOGIN;
    if(!user){
        return res.status(400).send("The user not found...")
    }
    if(user && bcrypt.compareSync( req.body.password, user.passwordHash )){
        const token = jwt.sign({
            userId : user.id,
            isAdmin: user.isAdmin // isAdmin ve userId değerlerini token'a payload olarak yükledik
        }, secret , {expiresIn:'1d'}) // Token ın süresini 1 gün olarak belirledik. 1w Olsaydı bir hafta olurdu

        res.status(200).send({user:user.email, token:token})
    } else {
        res.status(400).send("Password is wrong")
    }
})

router.get(`/get/count`, async (req, res)=>{
    const userCount = await User.countDocuments((count)=> count)
    if(!userCount){
        res.status(500).json({
            success:false
        });
    }
    res.send({userCount: userCount});
});

router.delete('/:id', (req,res)=>{
    User.findByIdAndRemove(req.params.id)
    .then(user=>{
        if(user){
            return res.status(200).json({
                success:true,
                message: "The user is deleted..."
            })
        } else {
            return res.status(404).json({
                success:false,
                message: "User not found"
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

module.exports = router;