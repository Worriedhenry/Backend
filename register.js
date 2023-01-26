const mongose=require('mongoose')
// const encryption=require('mongoose-encryption')
const passportlocal=require("passport-local-mongoose")
let userSchema=new mongose.Schema({
    _id:mongose.Schema.Types.ObjectId,
    username:{
        type:String,
        required: [true, 'Please Enter Name 1'] 
    },
    Password:{
        type:String,
        required: [true, 'Please Enter Password']
    },
    Comm:[String],
    Friends:[String],
    Notifications:[{
        msg:String,
        format:String,
        from:String,
        for:String    
        }]
})
userSchema.plugin(passportlocal)
module.exports=mongose.model('UsersCord',userSchema)