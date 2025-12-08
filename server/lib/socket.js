import { Server } from "socket.io";

let io;
export const userSocketMap = {}; // { userId: socketId }

export const initSocket = (server) => {
    io = new Server(server, { cors: { origin: '*' } });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query?.userId || socket.handshake.auth?.userId;
        console.log("User connected", userId);

        if (userId) userSocketMap[userId] = socket.id;

        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        socket.on("disconnect", () => {
            console.log("user disconnected", userId);
            if (userId) delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });
    });

    return io;
};

export const getIo = () => io;
