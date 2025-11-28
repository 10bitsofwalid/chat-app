import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { Socket } from "dgram";
import { disconnect } from "process";



//express app and HTTP server
const app = express();
const server = http.createServer(app)

export const io = new Server(server, {
    cors: {origin: '*'}
})

//store online users

export const userSocketMap = {}; // {userId: socketId}

//socket.io connection handler

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    //emit online user to all connected user
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on("disconnect", () =>{
        console.log("user disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })

})

//middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());


//route setup
app.use("/api/status", (req, res)=> res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//connect to db
await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log("server is running on PORT: " +PORT));