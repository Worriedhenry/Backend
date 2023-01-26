var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');
var app = express();

const mongoose=require('mongoose')
const cors=require("cors")
// mongoose.set('strictQuery', false);
var httpServer = http.createServer(app);
const io = require('socket.io')(httpServer, { cors: { origin: '*' } });
app.use(cors)


// your express configuration here


mongoose.connect('mongodb+srv://Ankit_Sharma:mongodb%4022062022@cluster0.bliuxbu.mongodb.net/Cord?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

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




app.get('/', function (req, res) {
    res.header('Content-type', 'text/html');
    return res.end('<h1>Hello, Secure World!</h1>');
});

// For http
httpServer.listen(8080);
// For https

