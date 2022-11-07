const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const bookModel = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    author: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        required: true
    },

    ISBN: {
        type: String,
        required: true,
        unique: true

    },
    category: {
        type: String,
        required: true
    },
    reviews: {
        type: Number,
        default: 0,
    },
    deletedAt: {
        type: Date,
        required: false,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    releasedAt: {
        type: String,
        required: true,
     },
    
     price:{
        type: Number,
        required:true
     },


     biblography:{
        type:String
     },
     bookNumber:{
        type:Number,
        required:true
     }



},
    { timestamps: true })

module.exports = mongoose.model("book", bookModel)
