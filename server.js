const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// 🔌 MongoDB kapcsolat (Render ENV-ből jön)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("DB connected"))
    .catch(err => console.log("DB error:", err));

// 📄 üzenet séma
const messageSchema = new mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// 🌐 statikus frontend
app.use(express.static("public"));

// 💬 socket logika
io.on("connection", async (socket) => {
    console.log("User connected");

    // régi üzenetek küldése
    const messages = await Message.find().sort({ createdAt: 1 }).limit(50);
    socket.emit("load messages", messages);

    // új üzenet
    socket.on("chat message", async (msg) => {
        const newMsg = new Message({ text: msg });
        await newMsg.save();

        io.emit("chat message", newMsg);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});