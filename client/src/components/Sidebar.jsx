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
          <img src={assets.logo} alt="logo" className="max-w-40" />
          <div className="relative py-2 group">
            <img src={assets.menu_icon} alt="menu" className="max-h-5 cursor-pointer dark:invert opacity-70 hover:opacity-100 transition-opacity" />
            <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-lg dark:shadow-none text-[#0F172A] dark:text-[#F8FAFC] hidden group-hover:block transition-all">
              <p onClick={() => navigate("/profile")} className="cursor-pointer text-sm hover:text-[#6366F1] transition-colors">Edit Profile</p>
              <hr className="my-2 border-t border-[#E2E8F0] dark:border-[#334155]"></hr>
              <p onClick={() => logout()} className="cursor-pointer text-sm text-[#EF4444] hover:text-[#B91C1C] transition-colors">Logout</p>
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