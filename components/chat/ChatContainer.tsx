"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Bot } from "lucide-react";

export function ChatContainer({ groupId, initialMessages = [], currentUserId, currentUserName, isArchived = false }: { groupId: string, initialMessages?: any[], currentUserId: string, currentUserName: string, isArchived?: boolean }) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<{userId: string, userName: string}[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // connect to our custom socket server
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Connected to Socket.IO server:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("🔴 Socket connection error:", err.message);
    });

    socket.emit("join_group", groupId);

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
      // Remove them from typing when they send
      setTypingUsers(prev => prev.filter(u => u.userId !== data.senderId));
    });

    socket.on("typing_start", (data: { userId: string, userName: string }) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === data.userId)) return [...prev, data];
        return prev;
      });
    });

    socket.on("typing_stop", (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    return () => {
      socket.disconnect();
    };
  }, [groupId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    if (socketRef.current) {
      socketRef.current.emit("typing_start", { groupId, userId: currentUserId, userName: currentUserName });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing_stop", { groupId, userId: currentUserId });
      }, 1500);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      groupId,
      content: input,
      senderId: currentUserId,
      tempId: Date.now(),
      type: "text",
      sender: { name: currentUserName }
    };

    socketRef.current?.emit("send_message", newMsg);
    socketRef.current?.emit("typing_stop", { groupId, userId: currentUserId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`p-3 rounded-xl max-w-[80%] shadow-sm text-[15px] ${msg.senderId === currentUserId ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
              {msg.type === "ai" ? (
                <span className="font-semibold flex items-center gap-1 mb-1 text-xs uppercase tracking-wider">
                  <Bot size={14} /> Saarthi
                </span>
              ) : msg.senderId !== currentUserId ? (
                <span className="font-bold block mb-1 text-xs uppercase tracking-wider text-slate-400">
                  {msg.sender?.name || "Member"}
                </span>
              ) : null}
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white border-t border-slate-200 relative z-20">
        {typingUsers.length > 0 && (
          <div className="absolute -top-8 left-4 text-[10px] font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100 uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="flex gap-1">
               <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce"></span>
            </span>
            <span className="text-slate-500">{typingUsers.map(u => u.userName.split(' ')[0]).join(", ")} {typingUsers.length === 1 ? "is typing" : "are typing"}</span>
          </div>
         )}
        <form onSubmit={sendMessage} className="flex gap-2 relative">
          <input 
            type="text" 
            value={input}
            onChange={handleInputChange}
            disabled={isArchived}
            className="flex-1 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-medium text-[15px] text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
            placeholder={isArchived ? "Trip archived • Read only" : "Type a message or ask @ai..."}
          />
          <button 
            type="submit" 
            disabled={isArchived || !input.trim()}
            className="bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 transition-colors h-10 w-10 flex items-center justify-center disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
