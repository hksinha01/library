const mongoose = require('mongoose');


mongoose.connect("mongodb://localhost:27017/library", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )