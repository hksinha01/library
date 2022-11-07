const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true

        },
        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            match: /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/]
        },
        password: {
            type: String,
            required: true,
            min:8,
            max:15
        },
        isAdmin:{
            type:String,
            default:false
        },
        isDeleted:{
            type:String,
            default:false
        },

    },
    { timestamps: true });

module.exports = mongoose.model("User", userSchema)