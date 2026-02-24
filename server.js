const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let onlineUsers = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected: ' + socket.id);

  socket.on('new user', (username) => {
    if (!username || onlineUsers.includes(username)) {
      socket.emit('username taken');
      return;
    }

    socket.username = username;
    onlineUsers.push(username);
    io.emit('update users', onlineUsers);
  });

  socket.on('chat message', (msg) => {
    if (!socket.username) return;

    io.emit('chat message', {
      user: socket.username,
      msg: msg
    });
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      onlineUsers = onlineUsers.filter(u => u !== socket.username);
      io.emit('update users', onlineUsers);
    }

    console.log('User disconnected: ' + socket.id);
  });
});

/* ✅ مهم للاستضافة */
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});