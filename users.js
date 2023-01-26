const { default: mongoose } = require('mongoose')
const mongose=require('mongoose')
// const encryption=require('mongoose-encryption')
const passportlocal=require("passport-local-mongoose")
let userSchema=new mongose.Schema({
    _id:mongose.Schema.Types.ObjectId,
    username:{
        type:String,
        required: [true, 'Please Enter Name']
    },
    type:{
        type:String,
        required: [true, 'Please Enter Phone'],
        min:5000000000,
        max:10000000000
    },
    Admin:{
        type:String
    },
    ChatRooms:[String],
    VoiceRooms:[String],
    VedioRooms:[String],
    Users:[String]
})
// userSchema.plugin(encryption,{ secret: process.env.SECRET, excludeFromEncryption: ['Phone','name'] })
userSchema.plugin(passportlocal)
module.exports=mongose.model('Communities',userSchema)