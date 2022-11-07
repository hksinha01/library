const express = require('express');
const bcrypt = require('bcrypt');
const path = require("path");
const app = express();
const hbs = require('hbs')
const jwt = require("jsonwebtoken");
const cookieParser= require("cookie-parser")


app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({extended:false}))

const port = process.env.PORT||3000

require("./db/conn")
const userModel = require("./models/userModel");
const bookModel = require("./models/bookModel");

const static_path = path.join(__dirname,"../public")
const template_path = path.join(__dirname,"../templates/views")
const partial_path = path.join(__dirname,"../templates/partial")


app.use(express.static(static_path))
app.set("view engine","hbs")
app.set("views",template_path)
hbs.registerPartials(partial_path)


const isValid = (value) => {
    {
        if (typeof value === "undefined" || value === null)
            return false

        if (typeof value === "string" && value.trim().length === 0)
            return false
    }
    return true
}

//API'S
//------------------------------------------------get api----------------------------------------------------
app.get('/index',async (req,res)=>{
    let data = await bookModel.find({isDeleted:false})
    let count = await bookModel.find({isDeleted:false}).count()
    

   res.render('index',{userData:data,count :count})
  
 })


app.get('/register',(req,res)=>{
    res.render("register");
 })

 app.get('/login',(req,res)=>{
    res.render("login");
 })
 
app.get("/add-books",(req,res)=>{
    res.render("add-books")
})

app.get("/edit-books",(req,res)=>{
    res.render("edit-books")
})

app.get("/bookInfo",async(req,res)=>{
    console.log(req.query)
    res.render("bookInfo")
})

app.get("/deleteBooks",(req,res)=>{
    res.render("deleteBooks")
})
//-------------------------------------------------Authentication--------------------------------------------
const authentication=(req,res,next)=>{
    try{
    let token=req.cookies.Authentication
    let errors=[]
    if(!token){
        res.status(400)
        errors.push({text:"please enter token"})
    }

    let decodeToken=jwt.verify(token,"Testing")
    
    if(!decodeToken){
        res.status(400)
        errors.push({text:"Authentication Failed"})
    }
    
    req['userId']= decodeToken.userId

    next()
    }
    catch(err){
    return res.status(500).send({status:false,msg:err.message})
    }    
}
//------------------------------------------------post api-------------------------------------------------
 app.post('/register',async(req,res)=>{
    try {
       let body = req.body
       let errors = [];
       const { username,email,phone,password } = body
 
       
       
       if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email))) {
          res.status(400)
          errors.push({text:'Email Id is Invalid'})
 
       }
 
       if (!(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(phone))) {
          res.status(400)
          errors.push({text:'Mobile Number is Invalid '})
 
       }
       if(password.length<8 ||password.length>15){
        res.status(400)
          errors.push({text:'Password length must be in between 8 - 15'})
       }
       if(errors.length>0){
          return res.render("register",{
              errors:errors,
              title:'Error',
              username:username,
              email:email,
              password:password,
              phone:phone
          })
      }
      else{
       // generate salt to hash password
       const salt = await bcrypt.genSalt(10);
       // now we set user password to hashed password
       body.password = await bcrypt.hash(body.password, salt);
 
       const output = await userModel.create(body)
       return res.status(201).render("login")
      }
   }
   catch (error) {
    let errors = [];
    errors.push[{text:"Server error"}]
    return res.render("register",{
       errors:errors,
       title:'Error'
    });
   } 
  })

  app.post('/login',async(req,res)=>{
    try{
        let body = req.body;
        let errors = [];
       const { email, password } = body;
 
       if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email))) {
          res.status(400)
          errors.push({text:'Email Id is Invalid'})
       }
 
       const user = await userModel.findOne({ email });
 
       if (user) {
          
           const validPassword = await bcrypt.compare(password, user.password);
           if (!validPassword) {
             res.status(400)
             errors.push({text:'Password is Invalid'})
             }
       } else {
          res.status(400)
          errors.push({text:"User does not exist"})
        }
 
        if(errors.length>0){
          res.render("login",{
              errors:errors,
              title:'Error',
              email:email,
              password:password
          })
      }
      
 
       const token = jwt.sign({
           userid: user._id.toString(),
       },"Testing")

       console.log(token)
       res.user = user;
       
       res.setHeader("Authentication", token) 
       
       res.cookie("Authentication",token,{httpOnly:true,maxAge:9000000})
       res.cookie("user",user,{httpOnly:true,maxAge:9000000})
       // Setting key Value pair of Token
       //req.setHeader("Authentication", token)
       return res.status(200).render("index")
   }
   catch (error) {
    let errors = [];
    console.log((error.message))
    errors.push[{text:"Server error"}]
    return res.render("login",{
       errors:errors,
       title:'Error'
    });
  }
 })

 app.post("/add-books",authentication,async(req,res)=>{
    try {
        let body = req.body
        let errors = [];
        
        
        if(req.cookies.user.isAdmin=='false'){
            res.status(403)
            errors.push({text:"You don't have admin access"})
        }

        if (!body) {
            res.status(400)
            errors.push({text:'Invalid request parameters, please provide valid book details'})
           }

        const { title, excerpt,ISBN, category, releasedAt,price,author,bookNumber } = body


        if (!isValid(price)) {
            res.status(400)
            errors.push({text:'BAD REQUEST, please provide Price'})
            
        }

        if (!isValid(author)) {
            res.status(400)
            errors.push({text:'Please provide Author Name'})           
        }
       
        if (!isValid(title)) {
            res.status(400)
            errors.push({text:'Please provide title'})
            }
        if (!isValid(bookNumber)) {
                res.status(400)
                errors.push({text:'Please provide Book Number'})
            }

        let isUsedTitle = await bookModel.findOne({ title:title, isDeleted: false ,bookNumber:bookNumber})

        if (isUsedTitle) {
            res.status(400)
            errors.push({text:`This title=>${title} or book number=>${bookNumber} is already used`})
            }

        if (!isValid(excerpt)) {
            res.status(400)
            errors.push({text:'Please provide exceprt'})
                }

        if (!isValid(ISBN)) {
            res.status(400)
            errors.push({text:'Please provide ISBN'})
         }

        if (!/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/g.test(ISBN)) {
            res.status(400)
            errors.push({text:'Enter a valid format of ISBNs'})
             }



        let isUsedISBN = await bookModel.findOne({ ISBN })

        if (isUsedISBN) {
            res.status(400)
            errors.push({text:`This ISBN=>${ISBN} is already used`})
       }

        if (!isValid(category)) {
            res.status(400)
            errors.push({text:'Please provide category'})
       }


        if (!isValid(releasedAt)) {
            res.status(400)
            errors.push({text:'Please provide releasedAt details'})
       }

       if(errors.length>0){
        res.render("add-books",{
            errors:errors,
            title:'Error',
        })
    }

        else {
            let bookDetails = await bookModel.create(body)
            res.status(201)
            res.render('index')   
        }
    }

    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: err.message })
    }
 })

 app.post("/edit-books",authentication,async(req,res)=>{
    
        try {
            const data = req.body 
            let errors=[]
            const { title, excerpt, releasedAt, ISBN,bookNumber,author,price,category } = data

            if (!data) {
                res.status(400)
                errors.push({text:'Pass Data to Update'})
            }

            if(req.cookies.user.isAdmin=='false'){
                res.status(403)
                errors.push({text:"You don't have admin access"})
            }
    

            if(!isValid(bookNumber)){
                res.status(400)
                errors.push({text:'Pass Book Number'})
          
            }
    
    
            let validBody = await bookModel.findOne({ bookNumber: bookNumber, isDeleted: false })
            if (!validBody) {
                res.status(404)
                errors.push({text:'This book doesnot exists'})
            }

            if (title) {
    
                if (!isValid(title)) {
                    res.status(400)
                    errors.push({text:'please enter valid title'})
                
                }
                const duplicateTitle = await bookModel.findOne({ title: title, isDeleted: false })
    
                if (duplicateTitle) {
                    res.status(400)
                    errors.push({text:'title already exist'})
                   }
            }
    
            if(excerpt){
                if (!isValid(excerpt)) {
                    res.status(400)
                    errors.push({text:'please enter valid excerpt'})
              }
    
            }

            if(author){
                if (!isValid(author)) {
                    res.status(400)
                    errors.push({text:'please enter valid author'})
              }
    
            }

            if(price){
                if (!isValid(price)) {
                    res.status(400)
                    errors.push({text:'please enter valid price'})
              }
    
            }

            if(category){
                if (!isValid(category)) {
                    res.status(400)
                    errors.push({text:'please enter valid category'})
              }
    
            }
    
            if (releasedAt) {
                if (!isValid(releasedAt)) {
                    res.status(400)
                    errors.push({text:'please enter valid releasedAt'})
               }
    
            }
    
    
            if (ISBN) {
    
                if (!isValid(ISBN)) {
                    res.status(400)
                    errors.push({text:`please enter ISBN` })
               }
                if (!/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/g.test(ISBN)) {
                    res.status(400)
                    errors.push({text:`enter a valid format of ISBN` })
                }
    
                const duplicateISBN = await bookModel.findOne({ ISBN: ISBN, isDeleted: false })
    
                if (duplicateISBN) {
                    res.status(400)
                    errors.push({text:`ISBN already exist ` })
              }        
            }

            if(errors.length>0){
                return res.render("edit-books",{
                    errors:errors,
                    title:'Error',
                })
            } 
            const updatedData = await bookModel.findOneAndUpdate({bookNumber: bookNumber, isDeleted: false }, data, { new: true })
    
            if (!updatedData) {
                res.status(404)
                errors.push({text:`No such data found ` })
             }

            
    
            res.status(201)
           return res.render('index')   
        }
        catch (error) {
            return res.status(500).send({ status: false, msg: error.message })
        }
    }
    
)

app.post("/deleteBooks",authentication,async(req,res)=>{
    try{
        let body = req.body
        let errors= []
        if(req.cookies.user.isAdmin=='false'){
            res.status(403)
            errors.push({text:"You don't have admin access"})
        }

        if(!body){
            res.status(400)
            errors.push({text:'Pass BookNumber to delete'})
        }
        let {bookNumber} = body 

        if(!bookNumber){
            res.status(400)
            errors.push({text:'Pass BookNumber to delete'})
        }

        const data = await bookModel.findOne({bookNumber:bookNumber,isDeleted:false})
        if(!data){
            res.status(400)
            errors.push({text:'This Book doesnt exists'})
        }
        if(errors.length>0){
            return res.render("deleteBooks",{
                errors:errors,
                title:'Error',
            })
        } 
        else {
        const deleted = await bookModel.updateOne({bookNumber:bookNumber,isDeleted:false},{$set:{isDeleted:true,deletedAt:Date.now(),new:true}})
            res.status(200)
            res.render("deleteBooks")
        }

    }
    catch(error){
        return res.status(500).send({status:false,error:error.message})
    }

})





app.listen(port,()=>{
    console.log(`Server is runningg at port no ${port}`);
})

