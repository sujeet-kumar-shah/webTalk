var express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const {v4: uuidv4} = require('uuid');
const port = process.env.PORT || 8080;
app.get('/',(req,res)=>{
   res.sendFile(__dirname+'/index.html')
})


app.get('/chat.html', function(req, res){
   res.sendFile(__dirname+'/chat.html');});
users = [];
io.on('connection', function(socket){
   console.log('A user connected');
   socket.on('setUsername', function(data){
      console.log(data);
      if(users.indexOf(data) > -1){
         socket.emit('userExists', data + ' username is taken! Try some other username.');
      } else {
         users.push(data);
         socket.emit('userSet', {username: data});
      }
   });
   socket.on('msg', function(data){
      //Send message to everyone
      io.sockets.emit('newmsg', data);
   })
});

//videocall
app.set('view engine','ejs');
app.use(express.static('public'));

app.get('/views/video.ejs',(req,res)=>{
res.redirect(`/${uuidv4()}`)
})

app.get('/:room',(req,res)=>{
   res.render('video',{roomId:req.params.room})
})

io.on('connection',(socket)=>{
   socket.on('join-room',(roomId,userId)=>{
      socket.join(roomId);
      socket.broadcast.emit('user-connected',userId);
      socket.on('disconnect',()=>{
         socket.broadcast.emit('user-disconnected',userId)
      })
   })
})

http.app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
