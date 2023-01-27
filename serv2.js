const express=require('express')
const mongoose=require('mongoose')
require('dotenv').config()
const cors=require('cors')
const app=express()
var http = require('http');
const Users=require("./users")
const Register=require("./register")
const bcrypt = require('bcrypt');
const saltRounds = 5;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
var server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb+srv://Ankit_Sharma:mongodb%4022062022@cluster0.bliuxbu.mongodb.net/Cord?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
//================================================Login==================================================\
var currUser={comm:"null",name:"null"}
io.on('connection', (socket) => {
    socket.on("AssignUser",(data)=>{
        var destination=socket.id
        var size=io.sockets.adapter.sids.get(socket.id).size
        let set=io.sockets.adapter.sids.get(socket.id)
        const myArr = Array.from(set)
        for(let i=1;i<size;i++){
            socket.leave(myArr[i])
        }
       socket.join(`${data.comm}&General`)
        // socket.to(`${data.comm}&General`).emit('New User Joined',{name:data.naam})
        currUser.comm=data.comm
        currUser.name=data.naam
    })
    socket.emit('me',socket.id)
    socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})
    socket.on('send', (data) => {  
        const destination=`${data.comm}&${data.room}`
        socket.to(destination).emit('recieve', data);
    });
    socket.on("EmitRefresh",()=>{ 
        // console.log("okee")
        socket.emit("refresh")
        socket.broadcast.emit("refresh")
        // socket.emit("UpdateNotis")
    }) 
    socket.on("RoomChange",(data)=>{
        var obj={
            messages:`${data.name} has left the chat`,from:("ChatBot"),class:"left","time":data.time
		}
        var destination=`${data.comm}&${data.prev}`
        socket.to(destination).emit('recieve',obj);
        socket.leave(destination)
        destination=`${data.comm}&${data.room}`
        socket.join(destination)
        obj.messages=`${data.name} has joined the chat`
        socket.to(destination).emit('recieve',obj);
    })
    socket.on("liked",(data)=>{
        socket.in(`${data.comm}&${data.room}`).emit("Update Like",{likes:data.likes,id:data.id})
    })
    socket.on('disconnect', () => {
        // console.log('User disconnected');
        
    }); 
});
app.get("/",(req,res)=>{ 
    res.send("omk")
})
app.get("/",(req,res)=>{
    res.send("hello working")
})
app.post("/create",async (req,res)=>{
    // console.log(req.body)
    let result=await Users.findOne({username:req.body.name})
    if (result!==null){
        return res.status(200).send({error:1001})
    }
    const data =new Users({
        _id:new mongoose.Types.ObjectId,
        username:req.body.name,
        type:req.body.type,
        Admin:req.body.Admin,
        ChatRooms:["General"],
        VoiceRooms:[],
        VedioRooms:[],
        Users:[req.body.Admin]
    })
    let rr=await Register.updateOne({username:req.body.Admin},{$push:{Comm:req.body.name}})
    // console.log(rr)
    data.save()
    res.status(200).send({error:200})
})
app.post("/createe",async (req,res)=>{  
    const data= await Users.find({username: {"$regex": req.body.name, "$options": "i"}})
    res.status(200).send({data:data})
}) 
app.post("/test",async (req,res)=>{ 
    let result = await Register.findOne({name:"Ankit"})
    res.status(200).send("ok")
})
app.post("/isadmin",async (req,res)=>{
    let rr=await Users.findOne({username:req.body.comm})
    if(rr===null){
        return res.send({error:404})
    }
    // console.log(rr.Admin,rr,req.body)
    if(rr.Admin===req.body.user){
        return res.send({error:200})
    }
    res.send({error:202})
})
async function notifyUser(msg,user){
    let a=await Register.updateOne({username:user},{$push:{Notifications:{
        msg:msg,
        format:"notification",
        from:"ChatBot",
        for:null
    }}})
}
app.post("/GenerateRooms",async (req,res)=>{
    let result = await Users.findOne({username:req.body.username})
    let Rooms=[]
    // console.log(result)
    if(req.body.Class=="ChatRooms"){ Rooms=result.ChatRooms}
    if(req.body.Class=="VoiceRooms"){Rooms=result.VoiceRooms}
    if(req.body.Class=="VedioRooms"){Rooms=result.VedioRooms}
    // console.log(Rooms.includes(req.body.RoomName,0))
    // return res.send({error:200})
    if(Rooms.includes(req.body.RoomName,0)){
        return res.send({error:301})
    }
    else{
        // let r=await Users.updateOne({username:req.body.username},{$push:{ChatRooms:req.body.RoomName}})
        // console.log(r)
        result.Users.forEach(element => {
            notifyUser(`A new Room ${req.body.RoomName} is created in ${req.body.username} by ${result.Admin}`,element)
        });
        return res.send({error:200})
    }
})
app.post("/join",async (req,res)=>{ 
    let result = await Users.findOne({username:req.body.comm})
    // console.log(result,req.body.comm)
    if((result.Users).includes(req.body.name)){
        return res.send({error:302})
    }
    let r=await Register.updateOne({username:result.Admin},{$push:{Notifications:{
        msg:req.body.name+' has requested to join '+req.body.comm,
        format:"request",
        from:req.body.name,
        for:req.body.comm
    }}})
    res.status(200).send("OK")
})  
app.post("/CommReqAccept",async (req,res)=>{
    // console.log(req.body)
    let rr=await Register.updateOne({username:req.body.from},{$push:{Comm:req.body.for}})
    let rrr=await Users.updateOne({username:req.body.for},{$push:{Users:req.body.from}})
    let r=await Register.updateOne({username:req.body.Admin},{$pull:{Notifications:{_id:req.body.id}}})
    res.send("ok") 
})
app.post("/CommReqReject",async (req,res)=>{
    // console.log(req.body)
    let r=await Register.updateOne({username:req.body.Admin},{$pull:{Notifications:{_id:req.body.id}}})
    if(req.body.type==="request"){
    let rr=await Register.updateOne({username:req.body.from},{$push:{Notifications:{
        msg:"Request Rejected for "+req.body.for,
        format:"notification"
    }}})}
    // console.log(r,rr)
    res.send("ok")
})
app.post('/notifications',async (req,res)=>{
    const array= await Register.findOne({username:req.body.name})
    if(array.Notifications.length===0){
        // console.log("okay")
        return res.send({error:202})
    }
    // console.log(array.Notifications)
    res.status(200).send({error:200,array:array.Notifications})
})
app.post('/comm',async (req,res)=>{
    const data=await Register.findOne({username:req.body.name})
    const result = await Users.findOne({username:req.body.comm})
    if(result===null){
        return res.send({error:199,comm:data.Comm})
    }
    console.log(data,result,req.body.comm)
    if (result===undefined || result===null){
        res.send({comm:data.Comm,room:[],error:200})
        return
    }
    res.status(200).send({comm:data.Comm,room:result.ChatRooms,error:200})
})
app.post("/reg",async (req,res)=>{ 
    // console.log(req.body)
    if(req.body.Name==="" || req.body.Password===""){ 
        return res.send({error:202})
    }
    if(req.body.Password!==req.body.RePassword){
        return res.send({error:203})
    }
    let result = await Register.findOne({username:req.body.Name})
    // console.log(result)
    if(result!==null){   
        res.send({error:200})
    } 
    else{
        bcrypt.hash(req.body.Password, saltRounds, function(err, hash) {
            var data = new Register({
                _id:new mongoose.Types.ObjectId,
                username:req.body.Name,
                Password:hash,
                comm:[],
                Friends:[],
                Notifications:[]
            })
            data.save()
        });
        // console.log("hi")
        // return res.send({error:403})
        return res.send({error:200})
} 
})
app.post("/LeaveConformed",async (req,res)=>{
    let comm=await Users.findOne({username:req.body.comm})
    if (comm.Admin!==req.body.user){
        let end=await Users.updateOne({username:req.body.comm},{$pull:{Users:req.body.user}})
        let end2=await Register.updateOne({username:req.body.user},{$pull:{Comm:req.body.comm}})
        return res.send({error:200})
    }
    return res.send({error:404})
})
app.post("/login",async (req,res)=>{
    // console.log(req.body,"HI")
    if(req.body.name==="" || req.body.password===""){
        return res.send({error:202});
    }
    let result = await Register.findOne({username:req.body.name})
    // console.log(result) 
    if(!result || result===null){
        return res.send({error:400}) 
    }   
    const match = await bcrypt.compare(req.body.password,result.Password)
    if(match){
        return res.send({error:200})
    }
    return res.status(200).send({error:203})
    
})
//===============================================Home====================================================
server.listen(3001,()=>{
    console.log("server running")
})

