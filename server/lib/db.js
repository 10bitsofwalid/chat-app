import mongoose from "mongoose";

//function to connect the database

export const connectDB = async() =>{
    try{

        mongoose.connection.on('connected', ()=> console.log('Database Connected'));
        
        // Remove trailing slash if it exists from the environment variable 
        const baseUri = process.env.MONGODB_URI.endsWith('/') 
            ? process.env.MONGODB_URI.slice(0, -1) 
            : process.env.MONGODB_URI;

        await mongoose.connect(`${baseUri}/chat-app`)
    }catch(error){
        console.log("Database connection error: ", error);
    }
}