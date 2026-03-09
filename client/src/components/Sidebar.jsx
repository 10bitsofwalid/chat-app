import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';


const Sidebar = () => {
  const {getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages} = useContext(ChatContext)

  const {logout, onlineUsers, authUser} = useContext(AuthContext)

  const [input, setInput] = useState('');

  const navigate = useNavigate();

  const filteredUsers = input ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

  useEffect(() =>{
    if(authUser) getUsers();
  }, [onlineUsers, getUsers, authUser])


  return (
    <div className={`bg-[#F1F5F9] dark:bg-[#020617] border-r border-[#E2E8F0] dark:border-[#334155] h-full p-4 md:p-6 flex flex-col overflow-hidden text-[#0F172A] dark:text-[#F8FAFC] transition-all duration-300 ${selectedUser ? "max-md:hidden" : ''}`}>
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={assets.logo_icon} alt="logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">Your Chats</span>
          </div>
          <div className="relative group">
            <button
              title="Menu"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-[#334155] hover:bg-[#6366F1] border border-[#E2E8F0] dark:border-[#475569] transition-all duration-200 hover:scale-110 hover:shadow-sm cursor-pointer"
            >
              <img src={assets.menu_icon} alt="menu" className="w-4 h-4 dark:invert group-hover:invert transition-all" />
            </button>
            <div className="absolute top-full right-0 z-20 w-36 py-2 mt-1 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-lg dark:shadow-none text-[#0F172A] dark:text-[#F8FAFC] hidden group-hover:block">
              <p onClick={() => navigate("/profile")} className="px-4 py-2 cursor-pointer text-sm hover:bg-[#F1F5F9] dark:hover:bg-[#334155] hover:text-[#6366F1] transition-colors rounded-lg mx-1">Edit Profile</p>
              <hr className="my-1 border-t border-[#E2E8F0] dark:border-[#334155]"></hr>
              <p onClick={() => logout()} className="px-4 py-2 cursor-pointer text-sm text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#450A0A]/40 transition-colors rounded-lg mx-1">Logout</p>
            </div>
          </div>
        </div>
        <div className='bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full flex items-center gap-3 py-3 px-4 mt-6 focus-within:ring-2 focus-within:ring-[#6366F1] transition-all shadow-sm dark:shadow-none'>
          <img src={assets.search_icon} alt="search" className='w-4 opacity-50 dark:invert' />
          <input onChange={(e)=> setInput(e.target.value)} type="text" className='bg-transparent border-none outline-none text-[#0F172A] dark:text-[#F8FAFC] text-sm placeholder-[#94A3B8] dark:placeholder-[#64748B] flex-1' placeholder='Search User...'/>
        </div>
      </div>
      <div className='flex flex-col gap-1 mt-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#E2E8F0] dark:scrollbar-thumb-[#334155] scrollbar-track-transparent'>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index)=>(
            <div onClick={()=>{setSelectedUser(user); setUnseenMessages(prev=>({...prev, [user._id]:0}))}} key={index} className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white dark:hover:bg-[#1E293B] ${selectedUser?._id === user._id ? 'bg-white dark:bg-[#1E293B] border border-[#6366F1]/30 shadow-sm' : 'border border-transparent'}`}>
              <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-12 h-12 object-cover rounded-full shadow-sm' />
              <div className ='flex flex-col leading-5'>
                <p className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">{user.fullName}</p>
                {
                  onlineUsers.includes(user._id)
                  ? <span className= 'text-[#22C55E] text-xs flex items-center gap-1'><span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full"></span>Online</span>
                  : <span className='text-[#94A3B8] dark:text-[#64748B] text-xs'>Offline</span>
                }
              </div>
              {unseenMessages[user._id] > 0 && <p className='absolute top-4 right-4 text-[10px] font-bold h-5 w-5 flex justify-center items-center rounded-full bg-gradient-to-r from-[#22D3EE] to-[#6366F1] shadow-sm text-white'>{unseenMessages[user._id]}</p>}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm">
             <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;