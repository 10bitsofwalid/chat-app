import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { getIo, userSocketMap } from "../lib/socket.js";

//get all user except the logged in user

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        //unseen message counts and last message
        const unseenMessages = {}
        const lastMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const unseen = await Message.find({ senderId: user._id, receiverId: userId, seen: false, deletedBy: { $ne: userId } })
            if (unseen.length > 0) {
                unseenMessages[user._id] = unseen.length;
            }

            const lastMsg = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: user._id },
                    { senderId: user._id, receiverId: userId },
                ],
                deletedBy: { $ne: userId }
            }).sort({ createdAt: -1 });

            if (lastMsg) {
                lastMessages[user._id] = lastMsg;
            }
        })
        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages, lastMessages })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//get all messages for selected users

export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
            deletedBy: { $ne: myId }
        }).populate("replyTo", "text image senderId deletedBy");

        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });
        res.json({ success: true, messages })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//mark message as seen by message id

export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true })
        res.json({ success: true })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//send text

export const sendMessage = async (req, res) => {
    try {
        const { text, image, replyTo } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            replyTo: replyTo || null
        })

        await newMessage.populate("replyTo", "text image senderId deletedBy");

        //emit the new message to the receiver's socket

        const receiverSocketId = userSocketMap[receiverId];
        const io = getIo();
        if (io && receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.json({ success: true, newMessage });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// React to a message

export const reactToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.json({ success: false, message: "Message not found" });

        const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId.toString());
        if (existingReactionIndex !== -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            message.reactions.push({ userId, emoji });
        }
        await message.save();

        const io = getIo();
        if (io) {
            const receiverSocketId = userSocketMap[message.receiverId];
            const senderSocketId = userSocketMap[message.senderId];
            const updatedReactions = { messageId: id, reactions: message.reactions };
            if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", updatedReactions);
            if (senderSocketId && senderSocketId !== receiverSocketId) io.to(senderSocketId).emit("messageReaction", updatedReactions);
        }

        res.json({ success: true, reactions: message.reactions });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Delete or unsend a message

export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // "me" or "everyone"
        const userId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.json({ success: false, message: "Message not found" });

        if (type === "everyone" && message.senderId.toString() === userId.toString()) {
            await Message.findByIdAndDelete(id);
            const io = getIo();
            if (io) {
                const receiverSocketId = userSocketMap[message.receiverId];
                const senderSocketId = userSocketMap[message.senderId];
                if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", { id, type: "everyone" });
                if (senderSocketId && senderSocketId !== receiverSocketId) io.to(senderSocketId).emit("messageDeleted", { id, type: "everyone" });
            }
        } else {
            if (!message.deletedBy.includes(userId)) {
                message.deletedBy.push(userId);
                await message.save();
            }
            const io = getIo();
            if (io) {
                const mySocketId = userSocketMap[userId];
                if (mySocketId) io.to(mySocketId).emit("messageDeleted", { id, type: "me" });
            }
        }
        res.json({ success: true, messageId: id });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}