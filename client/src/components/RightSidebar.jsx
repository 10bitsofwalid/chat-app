import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const RightSidebar = () => {
    
    const {selectedUser, messages} = useContext(ChatContext)
    const {logout, onlineUsers} = useContext(AuthContext)
    const [msgImages, setMsgImages] = useState([])

    //get all the images from the messages and set them to state
    useEffect(()=>{
        setMsgImages(
            messages.filter(msg => msg.image).map(msg=>msg.image)
        )
    }, [messages])

    return selectedUser && (
    <div className={`bg-[#F1F5F9] dark:bg-[#020617] border-l border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] w-full relative overflow-y-scroll scrollbar-thin scrollbar-thumb-[#E2E8F0] dark:scrollbar-thumb-[#334155] scrollbar-track-transparent transition-all duration-300 ${selectedUser ? "max-md:hidden" : ""}`}>
        <div className='pt-16 flex flex-col items-center gap-3 text-sm font-light mx-auto'>
        <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-24 h-24 object-cover shadow-sm rounded-full border border-[#E2E8F0] dark:border-[#334155]'/>
        <h1 className='px-10 text-xl font-semibold mx-auto flex items-center justify-center gap-2'>
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && <span className='w-2.5 h-2.5 rounded-full bg-[#22C55E]'></span>}
        </h1>
        <p className='px-10 text-center text-[#64748B] dark:text-[#94A3B8] mx-auto'>{selectedUser.bio}</p>
        </div>

        <hr className="border-[#E2E8F0] dark:border-[#334155] my-6 mx-5"/>

        <div className="px-5 text-sm pb-24">
            <p className='font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-3'>Media</p>
            <div className='mt-2 max-h-[250px] overflow-y-auto grid grid-cols-2 gap-3 opacity-90 pr-2 scrollbar-thin scrollbar-thumb-[#E2E8F0] dark:scrollbar-thumb-[#334155] scrollbar-track-transparent'>
                {msgImages.map((url, index) => (
                    <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded-lg overflow-hidden transform transition hover:scale-[1.02] shadow-sm border border-[#E2E8F0] dark:border-[#334155]'>
                        <img src={url} alt="" className='w-full h-24 object-cover' />
                    </div>
                ))}
            </div>
        </div>
        <button onClick={()=> logout()} className='absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#E2E8F0] dark:bg-[#334155] hover:bg-[#CBD5F5] dark:hover:bg-[#475569] border border-transparent text-[#1F2937] dark:text-[#E2E8F0] text-sm font-medium py-2.5 px-16 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm'>
            Logout
        </button>
    </div>
    )
}

export default RightSidebar