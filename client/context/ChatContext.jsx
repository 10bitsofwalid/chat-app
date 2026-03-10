import { useContext, useEffect, useState, createContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMessages, setGroupMessages] = useState([]);
    const [unseenMessages, setUnseenMessages] = useState({})
    const [lastMessages, setLastMessages] = useState({})
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [messagePage, setMessagePage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);

    const { socket, axios, authUser } = useContext(AuthContext);

    //function to get all users for sidebars
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages || {})
                setLastMessages(data.lastMessages || {})
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //function to get messages for selected user
    const getMessages = async (userId, page = 1) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}?page=${page}&limit=30`);
            if (data.success) {
                if (page === 1) {
                    setMessages(data.messages);
                } else {
                    setMessages(prev => [...data.messages, ...prev]);
                }
                setHasMoreMessages(!!data.hasMore);
                setMessagePage(page);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getGroupMessages = async (groupId, page = 1) => {
        try {
            const { data } = await axios.get(`/api/groups/${groupId}/messages?page=${page}&limit=30`);
            if (data.success) {
                setGroupMessages(data.messages);
                setHasMoreMessages(!!data.hasMore);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const sendGroupMessage = async (messageData) => {
        if (!selectedGroup) return;
        try {
            const { data } = await axios.post(`/api/groups/${selectedGroup._id}/message`, messageData);
            if (data.success) {
                setGroupMessages(prev => [...prev, data.message]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const loadMoreMessages = async () => {
        if (!hasMoreMessages || isLoadingMore || !selectedUser) return;
        setIsLoadingMore(true);
        await getMessages(selectedUser._id, messagePage + 1);
        setIsLoadingMore(false);
    }

    //function to send text to the user
    const sendMessage = async (messageData, tempId = null) => {
        const messageId = tempId || Date.now().toString();

        if (!tempId) {
            const optimisticMsg = {
                ...messageData,
                _id: messageId,
                senderId: authUser._id,
                status: 'sending',
                createdAt: new Date().toISOString()
            };
            setMessages((prevMessages) => [...prevMessages, optimisticMsg]);
        } else {
            setMessages((prevMessages) => prevMessages.map(msg =>
                msg._id === messageId ? { ...msg, status: 'sending' } : msg
            ));
        }

        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => prevMessages.map(msg =>
                    msg._id === messageId ? data.newMessage : msg
                ));
            }
            else {
                setMessages((prevMessages) => prevMessages.map(msg =>
                    msg._id === messageId ? { ...msg, status: 'failed' } : msg
                ));
                toast.error(data.message);
            }
        } catch (error) {
            setMessages((prevMessages) => prevMessages.map(msg =>
                msg._id === messageId ? { ...msg, status: 'failed' } : msg
            ));
            toast.error(error.message);
        }
    }

    //function to subscribe to messages for selected user
    const subscribeToMessages = async () => {
        if (!socket) return;
        socket.on("newMessage", (newMessage) => {
            if (selectedUser && (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                if (newMessage.senderId === selectedUser._id) {
                    axios.put(`/api/messages/mark/${newMessage._id}`);
                }
            }
            else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]:
                        prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
            setLastMessages(prev => ({ ...prev, [newMessage.senderId === socket.query?.userId ? newMessage.receiverId : newMessage.senderId]: newMessage }))
        });

        socket.on("messageReaction", ({ messageId, reactions }) => {
            setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions } : msg));
        });

        socket.on("messageDeleted", ({ id, type }) => {
            if (type === "everyone") {
                setMessages(prev => prev.filter(msg => msg._id !== id));
            } else if (type === "me") {
                setMessages(prev => prev.filter(msg => msg._id !== id));
            }
            // Update lastMessages if we can (simplified: just ignore for now or fetch users again)
        });

        socket.on("messageEdited", ({ id, text }) => {
            setMessages((prevMessages) => prevMessages.map(msg =>
                msg._id === id ? { ...msg, text, isEdited: true } : msg
            ));
        });

        socket.on("messageStarred", ({ messageId, starredBy }) => {
            setMessages((prevMessages) => prevMessages.map(msg =>
                msg._id === messageId ? { ...msg, starredBy } : msg
            ));
        });
    }

    //function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("messageReaction");
            socket.off("messageDeleted");
            socket.off("messageEdited");
            socket.off("messageStarred");
        }
    }

    // typing indicators
    const [typingUsers, setTypingUsers] = useState([]);

    useEffect(() => {
        if (!socket) return;

        socket.on("typing", (senderId) => {
            setTypingUsers(prev => [...new Set([...prev, senderId])]);
        });

        socket.on("stopTyping", (senderId) => {
            setTypingUsers(prev => prev.filter(id => id !== senderId));
        });

        return () => {
            socket.off("typing");
            socket.off("stopTyping");
        }
    }, [socket]);

    const sendTypingEvent = (receiverId, isTyping) => {
        if (!socket) return;
        socket.emit(isTyping ? "typing" : "stopTyping", receiverId);
    }

    const reactToMessage = async (messageId, emoji) => {
        try {
            await axios.post(`/api/messages/react/${messageId}`, { emoji });
        } catch (error) {
            toast.error(error.message);
        }
    }

    const deleteMessage = async (messageId, type) => {
        try {
            await axios.post(`/api/messages/delete/${messageId}`, { type });
        } catch (error) {
            toast.error(error.message);
        }
    }

    const editMessage = async (messageId, text) => {
        try {
            await axios.put(`/api/messages/edit/${messageId}`, { text });
        } catch (error) {
            toast.error(error.message);
        }
    }

    const toggleStarMessage = async (messageId) => {
        try {
            const { data } = await axios.post(`/api/messages/star/${messageId}`);
            if (data.success) {
                setMessages(prevMessages => prevMessages.map(msg =>
                    msg._id === messageId ? { ...msg, starredBy: data.starredBy } : msg
                ));
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const forwardMessages = async (messageIds, targetIds) => {
        try {
            const { data } = await axios.post(`/api/messages/forward`, { messageIds, targetIds });
            if (data.success) {
                toast.success('Messages forwarded successfully!');
                setSelectedMessages([]); // Clear selection after forwarding
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    // Listen for real-time group messages
    useEffect(() => {
        if (!socket) return;
        const handleNewGroupMessage = ({ groupId, ...msg }) => {
            if (selectedGroup && selectedGroup._id === groupId) {
                setGroupMessages(prev => [...prev, msg]);
            }
        };
        socket.on('newGroupMessage', handleNewGroupMessage);
        return () => socket.off('newGroupMessage', handleNewGroupMessage);
    }, [socket, selectedGroup]);

    const value = {
        users,
        messages,
        selectedUser,
        setSelectedUser,
        selectedGroup,
        setSelectedGroup,
        groupMessages,
        getGroupMessages,
        sendGroupMessage,
        unseenMessages,
        setUnseenMessages,
        lastMessages,
        hasMoreMessages,
        isLoadingMore,
        getUsers,
        getMessages,
        loadMoreMessages,
        sendMessage,
        subscribeToMessages,
        unsubscribeFromMessages,
        typingUsers,
        sendTypingEvent,
        reactToMessage,
        deleteMessage,
        editMessage,
        toggleStarMessage,
        forwardMessages,
        selectedMessages,
        setSelectedMessages
    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}