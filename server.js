const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express();
const Server = http.createServer(app);
const io = socketio(Server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const admin = 'ChatApp@admin'

//run when client conection
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //welcome current user
        socket.emit('message', formatMessage(admin, `Welcome to Chat app`));

        //brodcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(admin, `${user.username} has joined the chat`));

        //send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //listen for chatmessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username ,msg));
    });

    //runs when client disconnects
    socket.on('disconnect', () =>{
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage(admin, `${user.username}  has left the chat`));

            //send user and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = 3000 || process.env.PORT;

Server.listen(PORT, () => console.log(`Server is running ${PORT}`))
