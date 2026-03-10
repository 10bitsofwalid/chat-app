import Group from "../models/Group.js";
import { v2 as cloudinary } from "cloudinary";
import { getIo, userSocketMap } from "../lib/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, memberIds, description } = req.body;
        const adminId = req.user._id;

        if (!name || !memberIds || memberIds.length === 0) {
            return res.json({ success: false, message: "Group name and at least one member are required" });
        }

        let avatar = "";
        if (req.body.avatar) {
            try {
                const uploaded = await cloudinary.uploader.upload(req.body.avatar, { folder: "group_avatars" });
                avatar = uploaded.secure_url;
            } catch (e) {
                console.log("Group avatar upload failed:", e.message);
            }
        }

        const members = [...new Set([adminId.toString(), ...memberIds])].map(id => id);
        const group = new Group({ name, avatar, description, members, adminId });
        await group.save();
        await group.populate("members", "fullName profilePic email");

        // Notify all members about the new group via socket
        const io = getIo();
        if (io) {
            members.forEach(memberId => {
                const socketId = userSocketMap[memberId.toString()];
                if (socketId) {
                    io.to(socketId).emit("groupCreated", group);
                }
            });
        }

        res.json({ success: true, group });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get all groups for the logged-in user
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId }).populate("members", "fullName profilePic email");
        res.json({ success: true, groups });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Update group name/avatar/description (admin only)
export const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.json({ success: false, message: "Group not found" });
        if (group.adminId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Only the admin can update group details" });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (req.body.avatar) {
            const uploaded = await cloudinary.uploader.upload(req.body.avatar, { folder: "group_avatars" });
            group.avatar = uploaded.secure_url;
        }

        await group.save();
        await group.populate("members", "fullName profilePic email");

        const io = getIo();
        if (io) {
            group.members.forEach(member => {
                const socketId = userSocketMap[member._id.toString()];
                if (socketId) io.to(socketId).emit("groupUpdated", group);
            });
        }

        res.json({ success: true, group });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Add member to group (admin only)
export const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: newMemberId } = req.body;
        const adminId = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.json({ success: false, message: "Group not found" });
        if (group.adminId.toString() !== adminId.toString()) {
            return res.json({ success: false, message: "Only the admin can add members" });
        }
        if (group.members.includes(newMemberId)) {
            return res.json({ success: false, message: "User is already a member" });
        }

        group.members.push(newMemberId);
        await group.save();
        await group.populate("members", "fullName profilePic email");

        const io = getIo();
        if (io) {
            group.members.forEach(member => {
                const socketId = userSocketMap[member._id.toString()];
                if (socketId) io.to(socketId).emit("groupUpdated", group);
            });
        }

        res.json({ success: true, group });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Remove member from group (admin only)
export const removeMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: removedMemberId } = req.body;
        const adminId = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.json({ success: false, message: "Group not found" });
        if (group.adminId.toString() !== adminId.toString()) {
            return res.json({ success: false, message: "Only the admin can remove members" });
        }
        if (removedMemberId === adminId.toString()) {
            return res.json({ success: false, message: "Admin cannot remove themselves" });
        }

        group.members = group.members.filter(m => m.toString() !== removedMemberId);
        await group.save();
        await group.populate("members", "fullName profilePic email");

        const io = getIo();
        if (io) {
            // Notify the removed user
            const removedSocketId = userSocketMap[removedMemberId];
            if (removedSocketId) io.to(removedSocketId).emit("removedFromGroup", { groupId: id });

            group.members.forEach(member => {
                const socketId = userSocketMap[member._id.toString()];
                if (socketId) io.to(socketId).emit("groupUpdated", group);
            });
        }

        res.json({ success: true, group });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Leave group (member)
export const leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.json({ success: false, message: "Group not found" });

        group.members = group.members.filter(m => m.toString() !== userId.toString());

        // If admin leaves, assign a new admin (first remaining member)
        if (group.adminId.toString() === userId.toString() && group.members.length > 0) {
            group.adminId = group.members[0];
        }

        if (group.members.length === 0) {
            await Group.findByIdAndDelete(id);
            return res.json({ success: true, message: "Group deleted" });
        }

        await group.save();
        res.json({ success: true, group });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const senderId = req.user._id;
        const { text, image, audio } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.json({ success: false, message: "Group not found" });
        if (!group.members.includes(senderId)) {
            return res.json({ success: false, message: "Not a member of this group" });
        }

        // Import Message model here to avoid circular deps
        const { default: Message } = await import("../models/Message.js");

        let imageUrl = "";
        if (image) {
            const uploaded = await cloudinary.uploader.upload(image);
            imageUrl = uploaded.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId: groupId, // Store group ID as receiverId
            text,
            image: imageUrl,
            audio
        });
        await newMessage.save();

        // Emit to all group members who are online
        const io = getIo();
        if (io) {
            group.members.forEach(memberId => {
                if (memberId.toString() === senderId.toString()) return;
                const socketId = userSocketMap[memberId.toString()];
                if (socketId) {
                    io.to(socketId).emit("newGroupMessage", { ...newMessage.toObject(), groupId });
                }
            });
        }

        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get group messages
export const getGroupMessages = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;

        const group = await Group.findById(groupId);
        if (!group) return res.json({ success: false, message: "Group not found" });
        if (!group.members.includes(userId)) {
            return res.json({ success: false, message: "Not a member of this group" });
        }

        const { default: Message } = await import("../models/Message.js");
        const messages = await Message.find({ receiverId: groupId, deletedBy: { $ne: userId } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("senderId", "fullName profilePic")
            .populate("replyTo", "text image senderId");

        res.json({ success: true, messages: messages.reverse(), hasMore: messages.length === limit });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
