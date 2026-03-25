"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, Bot, Building, X, Sparkles, MapPin, Calendar, Wallet, ChevronLeft, Plus, Plane } from "lucide-react";
import toast from "react-hot-toast";

export default function ConsultantPage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "Hello! I'm Saarthi, your Travel Consultant. Ready to plan your next adventure? Any place in mind or need a suggestion for a budget trip?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userMessage }] })
      });
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      } else {
        toast.error("Failed to get response");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Sparkles size={14} className="sm:size-4" />
            </div>
            <h1 className="font-bold text-slate-900 tracking-tight text-sm sm:text-base line-clamp-1">Saarthi Consultant</h1>
          </div>
        </div>
        <Link 
          href="/dashboard/create" 
          className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900 text-white text-[10px] sm:text-sm font-bold rounded-full hover:bg-slate-800 shadow-lg transition-all active:scale-95 shrink-0"
        >
          <Plus size={14} className="sm:size-4" /> <span className="hidden xs:inline">Create Trip</span><span className="xs:hidden">New</span>
        </Link>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col pt-20 pb-24 overflow-hidden relative">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full scroll-smooth"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div 
                className={`group relative p-4 sm:p-5 rounded-3xl max-w-[85%] sm:max-w-[75%] shadow-sm ${
                  msg.role === "user" 
                    ? "bg-slate-900 text-white rounded-tr-none" 
                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2 text-indigo-500">
                    <Bot size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Saarthi</span>
                  </div>
                )}
                <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Studying maps...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Dock */}
        <div className="absolute bottom-0 w-full p-4 sm:p-6 bg-gradient-to-t from-slate-50 to-transparent">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-full p-2 border border-slate-200 shadow-xl flex items-center gap-2"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about destinations, budgets (₹), or itineraries..." 
              className="flex-1 px-4 py-2 sm:py-3 outline-none text-slate-800 text-[15px] sm:text-base font-medium placeholder:text-slate-400" 
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="p-3 sm:px-6 bg-slate-900 text-white rounded-xl sm:rounded-full hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <span className="hidden sm:inline font-bold">Ask Saarthi</span>
              <Send size={18} />
            </button>
          </form>
          <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-4 uppercase tracking-widest font-bold">Saarthi AI Travel Expert • 24/7 Consultation</p>
        </div>
      </div>
      
      {/* Suggested Topics Sidebar (Horizontal on top) */}
      <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-4">
        {[
          { icon: <MapPin size={16} />, label: "Destinations" },
          { icon: <Wallet size={16} />, label: "Budgets" },
          { icon: <Calendar size={16} />, label: "Scheduling" },
        ].map((item, idx) => (
          <div key={idx} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-help flex items-center justify-center">
            {item.icon}
          </div>
        ))}
      </div>
    </div>
  );
}
