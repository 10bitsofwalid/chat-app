import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: "" },
    description: { type: String, default: "" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isGroup: { type: Boolean, default: true }
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);

export default Group;
