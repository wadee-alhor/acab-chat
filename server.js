const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {

    socket.on("join-room", (room, username) => {
        socket.join(room);
        socket.to(room).emit("message", username + " joined the room");
    });

    socket.on("send-message", (data) => {
        io.to(data.room).emit("message", data.username + ": " + data.message);
    });

    socket.on("voice-signal", (data) => {
        socket.to(data.room).emit("voice-signal", data.signal);
    });

});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Server running on port " + PORT));