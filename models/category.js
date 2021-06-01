const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    icon:{
        type:String
    },
    color:{
        type:String
    }
});

//Veritabanındaki _id değerine ek olarak id değeri de ekledik. API ı id olarak çağırmak için
categorySchema.virtual('id').get(function(){
    return this._id.toHexString();
})

categorySchema.set('toJSON', {
    virtuals :true
})

exports.Category = mongoose.model("Category", categorySchema);