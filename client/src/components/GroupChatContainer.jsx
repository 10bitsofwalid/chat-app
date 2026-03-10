import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils.js';
import toast from 'react-hot-toast';

const GroupChatContainer = () => {
    const { selectedGroup, setSelectedGroup, groupMessages, getGroupMessages, sendGroupMessage } = useContext(ChatContext);
    const { authUser, axios } = useContext(AuthContext);

    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const scrollEnd = useRef(null);

    useEffect(() => {
        if (selectedGroup) {
            getGroupMessages(selectedGroup._id);
        }
    }, [selectedGroup]);

    useEffect(() => {
        scrollEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [groupMessages]);

    const handleSend = async (e) => {
        if (e.key && e.key !== 'Enter') return;
        if (!input.trim()) return;
        await sendGroupMessage({ text: input.trim() });
        setInput('');
    };

    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            await sendGroupMessage({ image: reader.result });
        };
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const mr = new MediaRecorder(stream);
            mediaRecorderRef.current = mr;
            mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mr.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
        } catch {
            toast.error('Microphone access denied');
        }
    };

    const stopRecording = (cancel = false) => {
        clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setRecordingDuration(0);
        const mr = mediaRecorderRef.current;
        if (!mr) return;
        mr.stream.getTracks().forEach(t => t.stop());
        if (cancel) { mr.stop(); return; }
        mr.onstop = async () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => { sendGroupMessage({ audio: reader.result }); };
            reader.readAsDataURL(blob);
        };
        mr.stop();
    };

    if (!selectedGroup) return null;

    return (
        <div className='h-full flex flex-col relative bg-transparent overflow-hidden'>
            {/*--- Header ---*/}
            <div className='flex-none flex items-center gap-4 py-4 px-6 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] relative z-20'>
                <button
                    onClick={() => setSelectedGroup(null)}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xl"
                    title="Back to groups"
                >
                    ⬅️
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#22D3EE] flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0">
                    {selectedGroup.avatar
                        ? <img src={selectedGroup.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        : selectedGroup.name.charAt(0).toUpperCase()
                    }
                </div>
                <div className='flex-1'>
                    <p className='text-base font-semibold text-[#0F172A] dark:text-[#F8FAFC]'>{selectedGroup.name}</p>
                    <p className='text-xs text-[#64748B] dark:text-[#94A3B8]'>{selectedGroup.members?.length} members</p>
                </div>
                <button
                    onClick={() => setSelectedGroup(null)}
                    className='hidden md:flex text-[#64748B] hover:text-[#0F172A] dark:hover:text-white transition-colors text-sm px-3 py-1 rounded-full border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]'
                >
                    ✕ Close
                </button>
            </div>

            {/*--- Messages area ---*/}
            <div className='flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FFFFFF] dark:bg-[#1E293B]'>
                {groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#64748B] dark:text-[#94A3B8] text-sm gap-2">
                        <span className="text-4xl">👥</span>
                        <p className="font-medium">Start the group conversation!</p>
                    </div>
                ) : (
                    groupMessages.map((msg, i) => {
                        const isOwn = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
                        const senderName = isOwn ? 'You' : (msg.senderId?.fullName || 'Member');
                        const senderPic = msg.senderId?.profilePic || assets.avatar_icon;
                        return (
                            <div key={i} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                <img src={isOwn ? (authUser.profilePic || assets.avatar_icon) : senderPic} className="w-7 h-7 rounded-full object-cover shrink-0 mb-1" alt="" />
                                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                    {!isOwn && <span className="text-[10px] text-[#6366F1] font-semibold mb-0.5 ml-1">{senderName}</span>}
                                    {msg.audio ? (
                                        <div className={`px-3 py-2 rounded-2xl mb-1 shadow-sm ${isOwn ? 'bg-[#6366F1] rounded-br-sm' : 'bg-[#F1F5F9] dark:bg-[#334155] rounded-bl-sm'}`}>
                                            <audio src={msg.audio} controls className="h-8 max-w-[220px]" style={{ filter: isOwn ? 'invert(1)' : 'none' }} />
                                        </div>
                                    ) : msg.image ? (
                                        <img src={msg.image} alt="" loading="lazy" className='max-w-full md:max-w-[280px] rounded-2xl mb-1 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform' />
                                    ) : (
                                        <div className={`p-3 md:text-sm font-normal rounded-2xl mb-1 shadow-sm leading-relaxed ${isOwn ? 'bg-[#6366F1] text-white rounded-br-sm' : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#1F2937] dark:text-[#F1F5F9] rounded-bl-sm'}`}>
                                            <p className="break-words">{msg.text}</p>
                                        </div>
                                    )}
                                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mx-1">{formatMessageTime(msg.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollEnd}></div>
            </div>

            {/*--- Input area ---*/}
            <div className='flex-none p-4 bg-[#FFFFFF] dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155] z-10'>
                <div className='flex items-center gap-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] px-4 py-2 rounded-full focus-within:ring-2 focus-within:ring-[#6366F1] transition-all relative z-10'>
                    <input
                        autoFocus
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleSend}
                        type="text"
                        placeholder={isRecording ? '' : 'Message group...'}
                        disabled={isRecording}
                        className='flex-1 text-sm bg-transparent border-none outline-none text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] py-1.5'
                    />
                    {isRecording && (
                        <span className="flex-1 text-sm text-red-500 font-semibold animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
                            <button onClick={() => stopRecording(true)} className="ml-2 text-xs text-[#64748B]">Cancel</button>
                        </span>
                    )}
                    <input onChange={handleSendImage} type="file" id='group-image' accept='image/*' hidden />
                    {!isRecording && (
                        <label htmlFor="group-image" title="Attach image" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-[#334155] hover:bg-[#6366F1] cursor-pointer transition-all hover:scale-110 flex-shrink-0">
                            <img src={assets.gallery_icon} alt="" className="w-4 h-4 dark:invert" />
                        </label>
                    )}
                    {input.trim() ? (
                        <div onClick={handleSend} className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-[#22D3EE] to-[#6366F1] hover:opacity-90 rounded-full cursor-pointer transition-all transform hover:scale-[1.02] shadow-sm flex-shrink-0">
                            <img src={assets.send_button} alt="" className="w-4 ml-1 invert" />
                        </div>
                    ) : isRecording ? (
                        <button onClick={() => stopRecording(false)} className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-600 rounded-full text-white text-lg flex-shrink-0">⏹️</button>
                    ) : (
                        <button onClick={startRecording} className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-[#22D3EE] to-[#6366F1] hover:opacity-90 rounded-full cursor-pointer text-white text-lg flex-shrink-0" title="Record Voice">🎤</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupChatContainer;
