const express = require('express');
const app = express();
const session=require('express-session')
var http = require('http');
var server = http.createServer(app);
const cors=require("cors")

const io = require('socket.io')(server, { cors: { origin: '*' } });

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
        socket.to(`${data.comm}&General`).emit('New User Joined',{name:data.naam})
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





server.listen(3030);
const express=require('express')
const mongoose=require('mongoose')
require('dotenv').config()
const cors=require('cors')
const app=express()
var http = require('http');
const Users=require("./users")
const Register=require("./register")
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
        socket.to(`${data.comm}&General`).emit('New User Joined',{name:data.naam})
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
app.post("/create",async (req,res)=>{
    console.log(req.body)
    const data =new Users({
        _id:new mongoose.Types.ObjectId,
        name:req.body.name,
        type:req.body.type,
        Admin:req.body.Admin,
        rooms:[],
        Users:[req.body.Admin]
    })
    data.save()
    res.status(200).send("Done")
})
app.post("/createe",async (req,res)=>{
    const data= await Users.find({name: {"$regex": req.body.name, "$options": "i"}})
    res.status(200).send({data:data})
}) 
app.post("/join",async (req,res)=>{ 
    let result = await Users.findOne({name:req.body.comm})
    console.log(result,req.body.comm)
    let r=await Register.updateOne({name:result.Admin},{$push:{"Notifications":req.body.name+' has requested to join'+req.body.comm}})
    res.status(200).send("OK")     
}) 

app.post('/comm',async (req,res)=>{
    const data=await Register.findOne({name:req.body.name})
    const result = await Users.findOne({name:req.body.comm})
    if(result===null){
        return res.send({error:199,comm:data.Comm})
    }
    console.log(data,result,req.body.comm)
    if (result===undefined || result===null){
        res.send({comm:data.Comm,room:[],error:200})
        return
    }
    res.status(200).send({comm:data.Comm,room:result.rooms,error:200})
})
app.post("/reg",async (req,res)=>{
    console.log(req.body)
    if(req.body.Name==="" || req.body.Password===""){
         return res.send({error:202})
    }
    if(req.body.Password!==req.body.RePassword){
        return res.send({error:203})
    }
    let result = await Register.findOne({name:req.body.Name})
    console.log(result)
    if(result!==null){   
        
    }
    else{
        console.log("hi")
    const data = new Register({
        _id:new mongoose.Types.ObjectId,
        name:req.body.Name,
        Password:req.body.Password,
        comm:[],
        Notifications:[]
    })
    data.save()
    return res.send({error:200})
}
})
app.post("/login",async (req,res)=>{
    console.log(req.body,"HI")
    if(req.body.name==="" || req.body.password===""){
        return res.send({error:202});
    }
    let result = await Register.findOne({name:req.body.name})
    console.log(result) 
    if(!result || result===null){
        return res.send({error:400}) 
    }  
    if(req.body.password!==result.Password){
        return res.status(200).send({error:203})
    }
    return res.send({error:200})
})
//===============================================Home====================================================
server.listen(3001,()=>{
    console.log("server running")
})

