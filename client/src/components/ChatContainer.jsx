import React, {useContext, useEffect, useRef, useState} from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils.js'
import { ChatContext } from '../../context/ChatContext.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const ChatContainer = () => {

    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, typingUsers, sendTypingEvent } = useContext(ChatContext)
    const { authUser, onlineUsers } = useContext(AuthContext)

    const scrollEnd = useRef()
    const typingTimeoutRef = useRef(null)

    const [input, setInput] = useState('');

    const handleInputChange = (e) => {
        setInput(e.target.value);
        
        sendTypingEvent(selectedUser._id, true);
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingEvent(selectedUser._id, false);
        }, 2000);
    }

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if(input.trim() === "") return null;
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTypingEvent(selectedUser._id, false);
        
        await sendMessage({text: input.trim()});
        setInput("")
    }

    //handle sending image
    const handleSendImage = async (e)=>{
        const file = e.target.files[0];
        if(!file || !file.type.startsWith("image/")){
            toast.error("select an image file")
            return;
        }

        const reader = new FileReader();
        
        reader.onloadend = async ()=>{
            await sendMessage({image: reader.result})
            e.target.value = ""
        }
        reader.readAsDataURL(file)

    }

    useEffect(()=>{
        if(selectedUser){
            getMessages(selectedUser._id)
        }
    }, [selectedUser])

    useEffect(() => {
        if(scrollEnd.current && messages){
            scrollEnd.current.scrollIntoView({behavior:"smooth"})
        }
    }, [messages])

    return selectedUser ? (
    <div className='h-full flex flex-col relative bg-transparent overflow-hidden'>
        {/*---header-----*/}
        <div className='flex-none flex items-center gap-4 py-4 px-6 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B]'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-10 h-10 object-cover rounded-full shadow-sm" />
        <p className= 'flex-1 text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2'>
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>}
        </p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden w-6 cursor-pointer opacity-70 hover:opacity-100 transition-opacity dark:invert' />
        <img src={assets.help_icon} alt="" className='max-md:hidden w-6 opacity-60 hover:opacity-100 cursor-pointer transition-opacity dark:invert' />
        </div>
        
        {/*---chat area-----*/}
        <div className='flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#FFFFFF] dark:bg-[#1E293B]'>
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 justify-end animate-message-pop ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
                    {msg.image?(
                        <img src={msg.image} alt="" className='max-w-[230px] border border-[#E2E8F0] dark:border-[#334155] shadow-sm rounded-2xl overflow-hidden mb-1 transform transition hover:scale-[1.01] cursor-pointer' />
                    ):(
                        <p className={`p-3 max-w-[75%] md:text-sm md:max-w-[65%] font-normal rounded-2xl mb-1 shadow-sm break-words ${msg.senderId === authUser._id ? 'bg-[#6366F1] text-white rounded-br-sm' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#1F2937] dark:text-[#F1F5F9] rounded-bl-sm'}`}>{msg.text}</p>
                    )}
                    <div className="text-center text-[10px] min-w-10">
                        <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt=""  className='w-6 h-6 object-cover rounded-full mx-auto mb-1 shadow-sm opacity-90'/>
                        <p className='text-[#64748B] dark:text-[#94A3B8]'>{formatMessageTime(msg.createdAt)}</p>
                    </div>
                </div>
            ))}
            
            {typingUsers.includes(selectedUser._id) && (
                <div className="flex items-end gap-2">
                    <div className="bg-[#F1F5F9] dark:bg-[#334155] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl rounded-bl-sm p-4 w-fit shadow-sm">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-[#94A3B8] dark:bg-[#64748B] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-[#94A3B8] dark:bg-[#64748B] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-[#94A3B8] dark:bg-[#64748B] rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={scrollEnd}></div>
        </div>

        {/* bottom area */}
        <div className='flex-none p-4 bg-[#FFFFFF] dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155]'>
            <div className='mx-auto flex items-center gap-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] px-4 py-2 rounded-full focus-within:ring-2 focus-within:ring-[#6366F1] transition-all'>
                <input onChange={handleInputChange} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder="Type a message..." className='flex-1 text-sm bg-transparent border-none outline-none text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#64748B] py-1.5' />
                <input onChange={handleSendImage} type="file" id='image' accept='image/*, image/png, image/jpeg, image/jpg' hidden />
                <label htmlFor="image" className="hover:scale-110 transition-transform cursor-pointer opacity-70 hover:opacity-100 flex items-center justify-center p-2">
                    <img src={assets.gallery_icon} alt="" className="w-5 dark:invert" />
                </label>
                <div onClick={handleSendMessage} className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-[#22D3EE] to-[#6366F1] hover:opacity-90 rounded-full cursor-pointer transition-all transform hover:scale-[1.02] shadow-sm flex-shrink-0">
                    <img src={assets.send_button} alt="" className="w-4 ml-1 invert"/>
                </div>
            </div>
        </div>

    </div>
    ) : (
        <div className='w-full h-full flex flex-col items-center justify-center gap-6 text-[#64748B] dark:text-[#94A3B8] bg-[#FFFFFF] dark:bg-[#1E293B] max-md:hidden rounded-r-3xl overflow-hidden relative'>
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/5 to-[#8B5CF6]/5 z-0"></div>
            <div className='relative z-10 flex flex-col items-center animate-pulse'>
                <div className='w-24 h-24 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center mb-6 shadow-sm'>
                    <img src={assets.logo_icon} className='w-12 opacity-80' alt="" />
                </div>
                <h2 className='text-3xl font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-2'>Welcome to Your Chats</h2>
                <p className='text-[#64748B] dark:text-[#94A3B8] text-center max-w-sm'>Select a conversation from the sidebar or search for a user to start chatting.</p>
            </div>
        </div>
    )
}

export default ChatContainer