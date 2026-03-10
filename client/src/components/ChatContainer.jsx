import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils.js'
import { ChatContext } from '../../context/ChatContext.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

// Subtle notification sound using Web Audio API (no external file needed)
const playNotificationSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) { /* audio context not available */ }
}

const ChatContainer = () => {

    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, typingUsers, sendTypingEvent, reactToMessage, deleteMessage } = useContext(ChatContext)
    const { authUser, onlineUsers } = useContext(AuthContext)

    const scrollEnd = useRef()
    const chatAreaRef = useRef()
    const typingTimeoutRef = useRef(null)
    const prevMsgCount = useRef(0)

    const [input, setInput] = useState('');
    const [lightboxImg, setLightboxImg] = useState(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const [replyMsg, setReplyMsg] = useState(null);
    const [reactingTo, setReactingTo] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
    const ALL_EMOJIS = ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😋', '😎', '😢', '😭', '😡', '👍', '👎', '👏', '🙏', '🔥', '✨', '💯', '🤔', '👀', '🎉', '💔', '❤️'];

    const MAX_CHARS = 1000;

    const renderMessageText = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 break-all">{part}</a>
            }
            return part;
        });
    }

    const handleInputChange = (e) => {
        if (e.target.value.length > MAX_CHARS) return;
        setInput(e.target.value);
        sendTypingEvent(selectedUser._id, true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingEvent(selectedUser._id, false);
        }, 2000);
    }

    // Warn about unsent drafts and handle global shortcuts
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (input.trim().length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowSearch(false);
                setSearchQuery('');
                setReplyMsg(null);
                setReactingTo(null);
                setDeleteTarget(null);
                setLightboxImg(null);
                setShowEmojiPicker(false);
            }
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setShowSearch(true);
            }
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                setShowEmojiPicker(prev => !prev);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [input]);

    const handleEmojiClick = (emoji) => {
        if (input.length + emoji.length <= MAX_CHARS) {
            setInput(prev => prev + emoji);
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return null;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTypingEvent(selectedUser._id, false);
        await sendMessage({ text: input.trim(), replyTo: replyMsg ? replyMsg._id : null });
        setInput("");
        setReplyMsg(null);
    }

    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file")
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            await sendMessage({ image: reader.result, replyTo: replyMsg ? replyMsg._id : null });
            e.target.value = "";
            setReplyMsg(null);
        }
        reader.readAsDataURL(file)
    }

    // Scroll tracking
    const handleScroll = () => {
        if (!chatAreaRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 60;
        setIsAtBottom(atBottom);
        setShowScrollBtn(!atBottom);
    };

    const scrollToBottom = () => {
        scrollEnd.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
            prevMsgCount.current = 0;
            const mutedUsers = JSON.parse(localStorage.getItem('mutedUsers') || '[]');
            setIsMuted(mutedUsers.includes(selectedUser._id));
        }
    }, [selectedUser])

    const toggleMute = () => {
        const mutedUsers = JSON.parse(localStorage.getItem('mutedUsers') || '[]');
        let newMutedUsers;
        if (isMuted) {
            newMutedUsers = mutedUsers.filter(id => id !== selectedUser._id);
        } else {
            newMutedUsers = [...mutedUsers, selectedUser._id];
        }
        localStorage.setItem('mutedUsers', JSON.stringify(newMutedUsers));
        setIsMuted(!isMuted);
        toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted');
    }

    useEffect(() => {
        if (!messages || messages.length === 0) return;
        const newMsgCount = messages.length;
        const lastMsg = messages[newMsgCount - 1];

        // Play notification for incoming messages
        if (newMsgCount > prevMsgCount.current && prevMsgCount.current > 0) {
            if (lastMsg?.senderId !== authUser._id) {
                const mutedUsers = JSON.parse(localStorage.getItem('mutedUsers') || '[]');
                if (!mutedUsers.includes(lastMsg?.senderId)) {
                    playNotificationSound();
                }
            }
        }
        prevMsgCount.current = newMsgCount;

        // Auto scroll only if user is near bottom
        if (isAtBottom && scrollEnd.current) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages])

    return selectedUser ? (
        <div className='h-full flex flex-col relative bg-transparent overflow-hidden'>
            {/* Lightbox */}
            {lightboxImg && (
                <div
                    className="lightbox-overlay"
                    onClick={() => setLightboxImg(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <img src={lightboxImg} alt="Full size" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
                        <button
                            onClick={() => setLightboxImg(null)}
                            className="absolute -top-4 -right-4 w-9 h-9 flex items-center justify-center bg-white text-[#0F172A] rounded-full shadow-lg hover:scale-110 transition-transform text-sm font-bold"
                        >✕</button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="lightbox-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-xl max-w-sm w-full border border-[#E2E8F0] dark:border-[#334155]" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-white">Delete Message</h3>
                        <div className="flex flex-col gap-2">
                            {deleteTarget.senderId === authUser._id && (
                                <button onClick={() => { deleteMessage(deleteTarget._id, "everyone"); setDeleteTarget(null) }} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl transition-colors font-medium">Delete for everyone</button>
                            )}
                            <button onClick={() => { deleteMessage(deleteTarget._id, "me"); setDeleteTarget(null) }} className="bg-[#F1F5F9] dark:bg-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#475569] text-[#0F172A] dark:text-white py-2 rounded-xl transition-colors font-medium">Delete for me</button>
                            <button onClick={() => setDeleteTarget(null)} className="text-[#64748B] hover:text-[#0F172A] dark:hover:text-white py-2 mt-2 font-medium">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/*---header-----*/}
            <div className='flex-none flex items-center gap-4 py-4 px-6 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B]'>
                <div className="relative">
                    <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-10 h-10 object-cover rounded-full shadow-sm" />
                    {onlineUsers.includes(selectedUser._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white dark:border-[#1E293B]"></span>
                    )}
                </div>
                <div className='flex-1'>
                    <p className='text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]'>{selectedUser.fullName}</p>
                    <p className='text-xs text-[#64748B] dark:text-[#94A3B8]'>
                        {typingUsers.includes(selectedUser._id)
                            ? <span className="text-[#6366F1] font-medium italic">{selectedUser.fullName.split(' ')[0]} is typing...</span>
                            : onlineUsers.includes(selectedUser._id) ? 'Active now' : 'Offline'
                        }
                    </p>
                </div>
                <img onClick={() => setShowSearch(!showSearch)} src={assets.search_icon} alt="Search" className='w-5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity dark:invert' title="Search" />
                <button onClick={toggleMute} className='text-xl opacity-60 hover:opacity-100 cursor-pointer transition-opacity' title={isMuted ? "Unmute Notifications" : "Mute Notifications"}>
                    {isMuted ? '🔕' : '🔔'}
                </button>
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden w-5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity dark:invert' />
                <img src={assets.help_icon} alt="" className='max-md:hidden w-5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity dark:invert' />
            </div>

            {showSearch && (
                <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-2 border-b border-[#E2E8F0] dark:border-[#334155] animate-message-pop shadow-inner z-10">
                    <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] outline-none focus-within:ring-2 focus-within:ring-[#6366F1]">
                        <img src={assets.search_icon} alt="" className="w-4 opacity-50 dark:invert" />
                        <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search in this conversation..." className="flex-1 bg-transparent border-none outline-none text-sm text-[#0F172A] dark:text-[#F8FAFC]" />
                        <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white ml-2 bg-[#F1F5F9] dark:bg-[#334155] px-2 py-1 rounded-lg">Close</button>
                    </div>
                </div>
            )}

            {/*---chat area-----*/}
            <div
                ref={chatAreaRef}
                onScroll={handleScroll}
                className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FFFFFF] dark:bg-[#1E293B]'
                onClick={() => setReactingTo(null)}
            >
                {(searchQuery ? messages.filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase())) : messages).map((msg, index) => (
                    <div key={index} className={`msg-bubble-wrap group flex items-end gap-2 relative justify-end animate-message-pop ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
                        {/* Action Menu & Emoji Picker Container */}
                        <div className="relative self-center mb-6">
                            {/* Action Menu */}
                            <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-[#334155] border border-[#E2E8F0] dark:border-[#475569] rounded-full p-1 shadow-md z-10`}>
                                <button onClick={() => setReplyMsg(msg)} className="p-1 hover:bg-[#F1F5F9] dark:hover:bg-[#475569] rounded-full text-xs" title="Reply">↩️</button>
                                <button onClick={(e) => { e.stopPropagation(); setReactingTo(reactingTo === msg._id ? null : msg._id) }} className="p-1 hover:bg-[#F1F5F9] dark:hover:bg-[#475569] rounded-full text-sm" title="React">😊</button>
                                <button onClick={() => setDeleteTarget(msg)} className="p-1 hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D] rounded-full text-xs text-red-500" title="Delete">🗑️</button>
                            </div>

                            {/* Emoji Picker */}
                            {reactingTo === msg._id && (
                                <div className={`absolute bottom-full mb-2 flex gap-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full p-2 shadow-xl z-20 ${msg.senderId === authUser._id ? 'right-0' : 'left-0'} origin-bottom`}>
                                    {COMMON_EMOJIS.map(emoji => (
                                        <button key={emoji} onClick={(e) => { e.stopPropagation(); reactToMessage(msg._id, emoji); setReactingTo(null); }} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`flex flex-col relative max-w-[75%] md:max-w-[70%] lg:max-w-[65%] ${msg.senderId === authUser._id ? 'items-end' : 'items-start'}`}>
                            {/* Display Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && (
                                <div className={`absolute -bottom-3 flex gap-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full px-1.5 py-0.5 text-[10px] shadow-sm z-10 pointer-events-auto ${msg.senderId === authUser._id ? 'right-4' : 'left-4'}`}>
                                    {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
                                        <span key={emoji} onClick={(e) => { e.stopPropagation(); reactToMessage(msg._id, emoji) }} className="cursor-pointer hover:scale-110 flex items-center gap-0.5">
                                            <span>{emoji}</span>
                                            {count > 1 && <span className="text-[#64748B] dark:text-[#94A3B8] font-bold">{count}</span>}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {msg.image ? (
                                <div className="relative">
                                    <img
                                        src={msg.image}
                                        alt=""
                                        onClick={() => setLightboxImg(msg.image)}
                                        className='max-w-full md:max-w-[300px] border border-[#E2E8F0] dark:border-[#334155] shadow-sm rounded-2xl overflow-hidden mb-1 cursor-pointer hover:scale-[1.02] transition-transform'
                                    />
                                </div>
                            ) : (
                                <div className={`p-4 md:text-sm font-normal rounded-2xl mb-1 shadow-sm leading-relaxed ${msg.senderId === authUser._id ? 'bg-[#6366F1] text-white rounded-br-sm' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#1F2937] dark:text-[#F1F5F9] rounded-bl-sm'}`}>
                                    {msg.replyTo && (
                                        <div className="bg-black/10 dark:bg-[#0F172A]/30 p-2 rounded-lg mb-2 text-xs border-l-2 border-white/50 cursor-pointer hover:opacity-80 transition-opacity">
                                            <span className="font-bold block mb-0.5">{msg.replyTo.senderId === authUser._id ? 'You' : selectedUser.fullName}</span>
                                            <p className="truncate opacity-90 max-w-[200px]">{msg.replyTo.text || 'Photo'}</p>
                                        </div>
                                    )}
                                    <p className="break-words" style={{ whiteSpace: 'pre-wrap' }}>{renderMessageText(msg.text)}</p>
                                </div>
                            )}
                        </div>
                        <div className="text-center text-[10px] min-w-10">
                            <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-6 h-6 object-cover rounded-full mx-auto mb-1 shadow-sm opacity-90' />
                            <p className='msg-timestamp text-[#64748B] dark:text-[#94A3B8]'>{formatMessageTime(msg.createdAt)}</p>
                        </div>
                    </div>
                ))}

                {typingUsers.includes(selectedUser._id) && (
                    <div className="flex items-end gap-2">
                        <div className="bg-[#F1F5F9] dark:bg-[#334155] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl rounded-bl-sm px-4 py-3 w-fit shadow-sm">
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

            {/* Scroll to bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-[#6366F1] text-white shadow-lg hover:scale-110 transition-all text-sm z-10"
                >
                    ↓
                </button>
            )}

            {/* bottom area */}
            <div className='flex-none p-4 bg-[#FFFFFF] dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155] z-10'>
                {replyMsg && (
                    <div className="mx-auto flex flex-col justify-center bg-[#F1F5F9] dark:bg-[#334155] border-x border-t border-[#E2E8F0] dark:border-[#475569] px-4 py-2 rounded-t-2xl mb-[-10px] relative mt-[-10px] shadow-sm animate-message-pop">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col text-xs overflow-hidden pb-1">
                                <span className="font-bold text-[#6366F1] mb-0.5">Replying to {replyMsg.senderId === authUser._id ? 'yourself' : selectedUser.fullName}</span>
                                <span className="text-[#64748B] dark:text-[#94A3B8] truncate max-w-sm">{replyMsg.text || 'Photo'}</span>
                            </div>
                            <button onClick={() => setReplyMsg(null)} className="text-[#64748B] hover:text-[#0F172A] dark:hover:text-white bg-white/50 dark:bg-black/20 rounded-full w-5 h-5 flex items-center justify-center -mt-1 -mr-2 shadow-sm shrink-0">✕</button>
                        </div>
                    </div>
                )}
                <div className='mb-1 flex justify-between relative z-10'>
                    <span className="text-[10px] text-[#94A3B8] dark:text-[#64748B] flex gap-2">
                        <span><kbd className="font-mono bg-[#E2E8F0] dark:bg-[#334155] px-1 rounded">Esc</kbd> Cancel UI</span>
                        <span className="hidden sm:inline"><kbd className="font-mono bg-[#E2E8F0] dark:bg-[#334155] px-1 rounded">Ctrl+/</kbd> Search</span>
                        <span className="hidden sm:inline"><kbd className="font-mono bg-[#E2E8F0] dark:bg-[#334155] px-1 rounded">Ctrl+E</kbd> Emojis</span>
                    </span>
                    <span className={`text-[10px] ${input.length >= MAX_CHARS ? 'text-red-500 font-bold' : 'text-[#94A3B8] dark:text-[#64748B]'}`}>
                        {input.length}/{MAX_CHARS}
                    </span>
                </div>
                <div className='mx-auto flex items-center gap-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] px-4 py-2 rounded-full focus-within:ring-2 focus-within:ring-[#6366F1] transition-all relative z-10'>
                    {/* Emoji Button & Picker */}
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-xl opacity-60 hover:opacity-100 transition-opacity focus:outline-none shrink-0" title="Emoji (Ctrl+E)">😊</button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-full mb-3 left-0 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-3 shadow-xl z-20 w-64 animate-message-pop origin-bottom-left">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Select Emoji</span>
                                <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-[#64748B] hover:text-[#0F172A] dark:hover:text-white bg-black/5 dark:bg-white/5 rounded-full w-5 h-5 flex items-center justify-center -mt-1 -mr-1">✕</button>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                                {ALL_EMOJIS.map(emoji => (
                                    <button type="button" key={emoji} onClick={() => handleEmojiClick(emoji)} className="text-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] rounded py-1 transition-colors">{emoji}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    <input autoFocus={!showEmojiPicker} onChange={handleInputChange} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder="Type a message..." className='flex-1 text-sm bg-transparent border-none outline-none text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#64748B] py-1.5' />
                    <input onChange={handleSendImage} type="file" id='image' accept='image/*, image/png, image/jpeg, image/jpg' hidden />
                    <label
                        htmlFor="image"
                        title="Attach image"
                        className="group relative w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-[#334155] hover:bg-[#6366F1] border border-[#E2E8F0] dark:border-[#475569] cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-sm flex-shrink-0"
                    >
                        <img src={assets.gallery_icon} alt="Attach image" className="w-4 h-4 dark:invert group-hover:invert transition-all" />
                    </label>
                    <div onClick={handleSendMessage} className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-[#22D3EE] to-[#6366F1] hover:opacity-90 rounded-full cursor-pointer transition-all transform hover:scale-[1.02] shadow-sm flex-shrink-0">
                        <img src={assets.send_button} alt="" className="w-4 ml-1 invert" />
                    </div>
                </div>
            </div>

        </div>
    ) : (
        <div className='w-full h-full flex flex-col items-center justify-center gap-6 text-[#64748B] dark:text-[#94A3B8] bg-[#FFFFFF] dark:bg-[#1E293B] max-md:hidden rounded-r-3xl overflow-hidden relative'>
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/5 to-[#8B5CF6]/5 z-0"></div>

            {/* Animated floating elements for better empty state */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#6366F1]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#22D3EE]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className='relative z-10 flex flex-col items-center'>
                <div className='w-24 h-24 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center mb-6 shadow-xl animate-bounce' style={{ animationDuration: '3s' }}>
                    <img src={assets.logo_icon} className='w-14 opacity-90' alt="" />
                </div>
                <h2 className='text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-3'>Your Workspace is Empty</h2>
                <p className='text-[#64748B] dark:text-[#94A3B8] text-center max-w-sm leading-relaxed text-sm bg-white/50 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-[#E2E8F0] dark:border-[#334155]'>
                    Need to connect with someone? Select a conversation from the sidebar or search for a new contact to start chatting.
                </p>
            </div>
        </div>
    )
}

export default ChatContainer
