import React, { useContext } from "react";
import Sidebar from "../components/Sidebar.jsx";
import ChatContainer from "../components/ChatContainer.jsx";
import RightSidebar from "../components/RightSidebar.jsx";
import { ChatContext } from "../../context/ChatContext.jsx";

const HomePage = () => {
  const {selectedUser} = useContext(ChatContext)
  return (
    <div className="w-full h-screen sm:px-[10%] sm:py-[4%] lg:px-[15%] lg:py-[5%] flex items-center justify-center">
      <div
        className={`w-full h-full bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5F5] dark:border-[#334155] shadow-lg rounded-3xl overflow-hidden grid grid-cols-1 relative ${ selectedUser ? "md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]" : "md:grid-cols-2" }`}>
        
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;                                                                       
