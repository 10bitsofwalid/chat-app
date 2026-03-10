import express from "express";
import { protectRoute } from "../middleware/auth.js"
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, reactToMessage, deleteMessage, editMessage, toggleStarMessage, forwardMessages } from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.put("/edit/:id", protectRoute, editMessage);
messageRouter.post("/star/:id", protectRoute, toggleStarMessage);
messageRouter.post("/react/:id", protectRoute, reactToMessage);
messageRouter.post("/delete/:id", protectRoute, deleteMessage);
messageRouter.post("/forward", protectRoute, forwardMessages);

export default messageRouter;