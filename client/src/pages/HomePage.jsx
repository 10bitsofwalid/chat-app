import React, { useContext } from "react";
import Sidebar from "../components/Sidebar.jsx";
import GroupChatContainer from "../components/GroupChatContainer.jsx";
import ChatContainer from "../components/ChatContainer.jsx";
import RightSidebar from "../components/RightSidebar.jsx";
import { ChatContext } from "../../context/ChatContext.jsx";

const HomePage = () => {
  const { selectedUser, selectedGroup } = useContext(ChatContext)
  const isChatOpen = selectedUser || selectedGroup;

  return (
    <div className="w-full h-screen sm:px-[5%] sm:py-[4%] lg:px-[10%] lg:py-[5%] flex items-center justify-center p-0 sm:p-4">
      <div
        className={`w-full h-full bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5F5] dark:border-[#334155] shadow-lg sm:rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_2fr] lg:grid-cols-[1fr_2.5fr_1.2fr] relative`}>

        <Sidebar />
        <div className={`h-full flex flex-col ${isChatOpen ? 'flex' : 'hidden md:flex'}`}>
          {selectedGroup ? <GroupChatContainer /> : <ChatContainer />}
        </div>
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;                                                                       
