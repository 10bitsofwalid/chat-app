import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    createGroup,
    getUserGroups,
    updateGroup,
    addMember,
    removeMember,
    leaveGroup,
    sendGroupMessage,
    getGroupMessages
} from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/create", protectRoute, createGroup);
groupRouter.get("/", protectRoute, getUserGroups);
groupRouter.put("/:id", protectRoute, updateGroup);
groupRouter.post("/:id/add-member", protectRoute, addMember);
groupRouter.post("/:id/remove-member", protectRoute, removeMember);
groupRouter.post("/:id/leave", protectRoute, leaveGroup);
groupRouter.post("/:id/message", protectRoute, sendGroupMessage);
groupRouter.get("/:id/messages", protectRoute, getGroupMessages);

export default groupRouter;
