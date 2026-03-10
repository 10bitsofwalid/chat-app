import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, },
    image: { type: String, },
    audio: { type: String, },
    seen: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    isForwarded: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String
    }]
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;