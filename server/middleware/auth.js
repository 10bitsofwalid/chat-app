import User from "../models/User";
import jwt from "jsonwebtoken";

//,iddleware to protect route

export const protectRoute = async (req, resizeBy, next) =>{
    try {
        const token = req.heades.token;

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password");

        if(!user) return res.json({success: false, message: "user not found"});

        req.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}