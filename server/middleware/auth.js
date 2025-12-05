import User from "../models/User.js";
import jwt from "jsonwebtoken";

//middleware to protect route

export const protectRoute = async (req, res, next) =>{
    try {
        const token = req.headers.token;

        if(!token) return res.status(401).json({success: false, message: "No token provided"});

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password");

        if(!user) return res.status(404).json({success: false, message: "user not found"});

        req.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({success: false, message: error.message});
    }
}