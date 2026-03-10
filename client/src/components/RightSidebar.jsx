import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const RightSidebar = () => {

    const { selectedUser, messages, selectedGroup, groupMessages } = useContext(ChatContext)
    const { logout, onlineUsers } = useContext(AuthContext)
    const [msgImages, setMsgImages] = useState([])
    const [msgLinks, setMsgLinks] = useState([])

    const currentMessages = selectedGroup ? groupMessages : messages;

    //get all the images and links from the messages and set them to state
    useEffect(() => {
        setMsgImages(
            currentMessages.filter(msg => msg.image).map(msg => msg.image)
        )

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = [];
        currentMessages.forEach(msg => {
            if (msg.text) {
                const matches = msg.text.match(urlRegex);
                if (matches) {
                    links.push(...matches);
                }
            }
        });
        setMsgLinks(links);
    }, [currentMessages])

    const isSelectionActive = selectedUser || selectedGroup;

    return isSelectionActive && (
        <div className={`bg-[#F1F5F9] dark:bg-[#020617] border-l border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] w-full relative overflow-y-scroll scrollbar-thin scrollbar-thumb-[#E2E8F0] dark:scrollbar-thumb-[#334155] scrollbar-track-transparent transition-all duration-300 ${isSelectionActive ? "max-md:hidden" : ""}`}>
            <div className='pt-16 flex flex-col items-center gap-3 text-sm font-light mx-auto px-4'>
                <div className='relative'>
                    <img src={(selectedGroup ? selectedGroup.avatar : selectedUser.profilePic) || assets.avatar_icon} alt="" className='w-24 h-24 object-cover shadow-sm rounded-full border border-[#E2E8F0] dark:border-[#334155]' />
                    {selectedUser && onlineUsers.includes(selectedUser._id) && <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#22C55E] rounded-full border-2 border-[#F1F5F9] dark:border-[#020617]"></span>}
                </div>
                <h1 className='px-4 text-xl font-semibold text-center flex items-center justify-center gap-2'>
                    {selectedGroup ? selectedGroup.name : selectedUser.fullName}
                </h1>
                <p className='px-4 text-center text-[#64748B] dark:text-[#94A3B8] text-xs leading-relaxed'>
                    {selectedGroup ? `${selectedGroup.members?.length} members • ${selectedGroup.description || 'No description'}` : selectedUser.bio}
                </p>
            </div>

            <hr className="border-[#E2E8F0] dark:border-[#334155] my-6 mx-5" />

            <div className="px-5 text-sm pb-24">
                <p className='font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-3'>Media</p>
                {msgImages.length > 0 ? (
                    <div className='mt-2 max-h-[180px] overflow-y-auto grid grid-cols-2 gap-3 opacity-90 pr-2 scrollbar-thin scrollbar-thumb-[#E2E8F0] dark:scrollbar-thumb-[#334155] scrollbar-track-transparent'>
                        {msgImages.map((url, index) => (
                            <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded-lg overflow-hidden transform transition hover:scale-[1.02] shadow-sm border border-[#E2E8F0] dark:border-[#334155]'>
                                <img src={url} alt="" className='w-full h-24 object-cover' />
                            </div>
                        ))}
                    </div>
                ) : <p className='text-xs text-[#64748B] dark:text-[#94A3B8]'>No media shared yet.</p>}

                <p className='font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-3 mt-6'>Links</p>
                {msgLinks.length > 0 ? (
                    <div className='mt-2 max-h-[180px] overflow-y-auto flex flex-col gap-2 pr-2 scrollbar-thin scrollbar-thumb-[#E2E8F0] dark:scrollbar-thumb-[#334155] scrollbar-track-transparent'>
                        {msgLinks.map((url, index) => (
                            <a key={index} href={url} target="_blank" rel="noopener noreferrer" className='truncate text-xs text-[#6366F1] hover:underline bg-white dark:bg-[#1E293B] p-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155]'>
                                {url}
                            </a>
                        ))}
                    </div>
                ) : <p className='text-xs text-[#64748B] dark:text-[#94A3B8]'>No links shared yet.</p>}
            </div>
            <button onClick={() => logout()} className='absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#E2E8F0] dark:bg-[#334155] hover:bg-[#CBD5F5] dark:hover:bg-[#475569] border border-transparent text-[#1F2937] dark:text-[#E2E8F0] text-sm font-medium py-2.5 px-16 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm'>
                Logout
            </button>
        </div>
    )
}

export default RightSidebar
