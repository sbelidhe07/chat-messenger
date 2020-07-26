const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
const slimauth = require('slimauth');
slimauth.setOptions(
    {
        'loginPageURL': '/login',              // URL to redirect unauthorized requests
        'privateURLArray': [                        // An array of routes that require authorization
            '/chat',
            '/index',
            '/video',
            '/close'
        ]
    });
app.use(slimauth.requestAuthenticator);

// Set static folder
/********************************** GET ************************************/
  
  router.get('/',(req, res) => {
    res.sendFile(__dirname + "/public/login.html");
  });
  
  
  router.get('/signup',(req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
  });
  
  
  router.get('/login',(req, res) => {
    res.sendFile(__dirname + "/public/login.html");
  });

 router.get('/close',(req, res) => {
    res.sendFile(__dirname + "/private/close.html");
  });

 router.get('/video',(req, res) => {
    res.sendFile(__dirname + "/private/video.html");
  });
  
 router.get('/chat',(req, res) => {
    res.sendFile(__dirname + "/private/chat.html");
  });

  router.get('/index/:user',(req, res) => {
       res.sendFile(__dirname + "/private/index.html");
  });
  
  
  router.get('/logout', (req, res) => {
      slimauth.deauthenticate(req.userID);
      res.redirect('/login');
      console.log('User logged out:', req.userID);
  });
  

/*********************************** POST *************************************/
 router.post('/signup',(req, res) => {
   var email=req.body.email;
   var password=req.body.password;
 
   slimauth.createUser(email, password)
             .then(
                 //  success
                 () => {
                       res.redirect('/login');
                       console.log('User account created for',email )
                 },
                 // fail
                 (err) => {
                     res.send(err.message);
                 }
             )
 });
 
 router.post('/login', (req, res) => {
 
     let email = req.body['email'];
     let password = req.body['password'];
 
     // valiate password and log the user in for next 30 days
     slimauth.authenticate(email, password, res)
         .then(
             // success
             () => {
                 res.redirect("/index/"+email);
                 console.log('User logged in:', email);
             },
             // fail
             (err) => { res.send(err.message); }
         )
 });
 

router.post('/close', (req, res) => {
     let password = req.body.password;
 
     // valiate the current password and remove user account
     slimauth.deleteUser(req.userID, password)
         .then(
             // success
             () => {
                 res.redirect('/login');
                 console.log('Account', req.userID, 'was closed');
             },
             // fail
             (err) => { res.end(err.message); }
         )
 });





const botName = 'Chat App Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room,myCache);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Chat App!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room,myCache)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id,myCache);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id,myCache);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room,myCache)
      });
    }
  });
});

app.use("/",router);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

