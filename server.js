const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/chatapp");

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed });
  await user.save();
  res.json({ message: "تم إنشاء الحساب" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "المستخدم غير موجود" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "كلمة المرور خطأ" });

  const token = jwt.sign({ id: user._id }, "SECRET_KEY");
  res.json({ token, username: user.username });
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("message", (msg) => {
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});