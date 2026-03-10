import { useContext, useEffect, useState, createContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({})
    const [lastMessages, setLastMessages] = useState({})

    const { socket, axios } = useContext(AuthContext);

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
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //function to send text to the user
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
            }
            else {
                toast.error(data.message);
            }
        } catch (error) {
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
            } else {
                setMessages(prev => prev.filter(msg => msg._id !== id));
            }
            // Update lastMessages if we can (simplified: just ignore for now or fetch users again)
        });
    }

    //function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("messageReaction");
            socket.off("messageDeleted");
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

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    const value = {
        messages, users, selectedUser, getUsers, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages, getMessages, typingUsers, sendTypingEvent, lastMessages, reactToMessage, deleteMessage
    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}