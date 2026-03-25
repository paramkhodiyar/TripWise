"use client";
import { useState, useEffect, useRef } from "react";
import { createNote, deleteNote } from "@/app/actions/note";
import { addExpense, deleteExpense } from "@/app/actions/expenses";
import { Trash2, Plus, Sparkles, Save, MapPin, Calendar, Wallet, Map, Receipt, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";

export function PlannerContainer({ groupId, initialTripState, initialNotes = [], initialExpenses = [], members = [], currentUserId, isArchived = false }: any) {
  const [activeTab, setActiveTab] = useState<"plan" | "notes" | "splits">("plan");

  const [tripState, setTripState] = useState(initialTripState || { destination: null, dates: null, budget: null });
  const router = useRouter();

  useEffect(() => {
    setTripState(initialTripState || { destination: null, dates: null, budget: null });
  }, [initialTripState]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ["websocket"],
    });
    socket.emit("join_group", groupId);

    socket.on("trip_state_updated", () => {
      router.refresh();
      if (activeTab === "plan") {
         toast.success("AI has updated the Trip Plan!", { icon: '✨' });
      }
    });

    socket.on("expenses_updated", () => {
      router.refresh();
    });

    socket.on("connect", () => {
       // Ensure context is synced upon reconnection
       router.refresh();
    });

    return () => {
      socket.off("trip_state_updated");
      socket.off("connect");
      socket.disconnect();
    };
  }, [groupId, router, activeTab]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(currentUserId);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ["websocket"],
    });
    socketRef.current.emit("join_group", groupId);
    return () => socketRef.current.disconnect();
  }, [groupId]);

  const handleCreateNote = async (e: any) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await createNote(groupId, title, content);
      if (res.success) {
        toast.success("Note created");
        setTitle("");
        setContent("");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const currentMember = members.find((m: any) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === "admin";

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId, groupId);
      toast.success("Note deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id, groupId);
      fetch('/api/internal/emit', { method: 'POST', body: JSON.stringify({ event: 'expenses_updated', groupId }) });
      toast.success("Expense removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddExpense = async (e: any) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;
    try {
      await addExpense(groupId, expenseTitle, parseFloat(expenseAmount), expensePaidBy);
      fetch('/api/internal/emit', { method: 'POST', body: JSON.stringify({ event: 'expenses_updated', groupId }) });
      toast.success("Expense logged!");
      setExpenseTitle("");
      setExpenseAmount("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Split calculations
  const totalExpenses = initialExpenses.reduce((sum: number, ex: any) => sum + ex.amount, 0);
  const costPerPerson = members.length > 0 ? totalExpenses / members.length : 0;
  
  const balances = members.map((m: any) => {
    const paidByMember = initialExpenses.filter((ex: any) => ex.paidById === m.userId).reduce((s: number, ex: any) => s + ex.amount, 0);
    return { userId: m.userId, name: m.user.name, paid: paidByMember, balance: paidByMember - costPerPerson };
  });

  let debtors = balances.filter((b: any) => b.balance < -0.01).map((b: any) => ({ ...b, amount: Math.abs(b.balance) }));
  let creditors = balances.filter((b: any) => b.balance > 0.01).map((b: any) => ({ ...b, amount: b.balance }));
  
  const settlements = [];
  let dIdx = 0, cIdx = 0;
  while(dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0.01) settlements.push({ from: debtor.name, to: creditor.name, amount: parseFloat(amount.toFixed(2)) });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex border-b border-slate-100 px-4 sm:px-8 pt-6 gap-4 sm:gap-6 shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
        <button 
          onClick={() => setActiveTab("plan")}
          className={`pb-4 font-semibold text-sm transition-colors relative ${activeTab === "plan" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
        >
          Trip Details
          {activeTab === "plan" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab("notes")}
          className={`pb-4 font-semibold text-sm transition-colors relative ${activeTab === "notes" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
        >
          Shared Notes
          {activeTab === "notes" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab("splits")}
          className={`pb-4 font-semibold text-sm transition-colors relative flex items-center gap-1.5 ${activeTab === "splits" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
        >
          <Receipt size={14} /> Split Calculator
          {activeTab === "splits" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>}
        </button>
      </div>
      
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === "plan" && (
          <div className="space-y-4">
            {/* Rich Destination Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-blue-100/40">
                <MapPin size={100} />
              </div>
              <div className="relative z-10">
                <h3 className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">
                   <MapPin size={14} /> Destination
                </h3>
                <p className="text-2xl font-black text-slate-900 drop-shadow-sm">{tripState.destination || "Waiting for group..."}</p>
              </div>
            </div>
            
            {/* Dates & Budget Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">
                   <Calendar size={14} /> Dates
                </h3>
                <p className="text-lg font-bold text-slate-900">{tripState.dates || "Not set"}</p>
              </div>
              
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
                   <Wallet size={14} /> Budget
                </h3>
                <p className="text-lg font-bold text-slate-900">{tripState.budget || "Discussing..."}</p>
              </div>
            </div>

            {tripState.preferences && Array.isArray(tripState.preferences) && tripState.preferences.length > 0 && (
               <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 mt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Trip Tags & Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {tripState.preferences.map((p: string, i: number) => (
                      <span key={i} className="px-4 py-1.5 bg-white border border-slate-200 shadow-sm rounded-full text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {p}
                      </span>
                    ))}
                  </div>
               </div>
            )}

            {tripState.itinerary && Array.isArray(tripState.itinerary) && tripState.itinerary.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="flex items-center gap-2 font-black text-slate-900 tracking-tight text-xl mb-6">
                  <Map size={20} className="text-indigo-500" /> Structured Itinerary
                </h3>
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                  {tripState.itinerary.map((dayPlan: any, i: number) => (
                    <div key={i} className="relative flex items-start pl-6 pb-6 last:pb-0">
                      <div className="absolute left-0 w-12 h-12 flex items-center justify-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-indigo-500 text-white font-bold shadow-sm z-10 text-sm">
                          {dayPlan.day}
                        </div>
                      </div>
                      <div className="ml-8 w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                        <h4 className="font-bold text-slate-900 text-lg mb-3">{dayPlan.title}</h4>
                        <ul className="space-y-2">
                          {Array.isArray(dayPlan.activities) ? dayPlan.activities.map((act: string, j: number) => (
                            <li key={j} className="text-slate-600 text-[15px] flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl">
                              <span className="text-indigo-400 font-bold mt-[1px]">›</span>
                              <span>{act}</span>
                            </li>
                          )) : null}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isArchived ? (
              <div className="mt-8 p-6 bg-slate-100 rounded-3xl text-center text-slate-500 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 text-slate-200/50">
                  <Sparkles size={100} />
                </div>
                <div className="relative z-10 font-bold uppercase tracking-widest text-xs">
                  <p className="mb-1">Historical Record</p>
                  <p className="text-slate-400">This trip has been archived and is now read-only.</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl text-center text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/10">
                  <Sparkles size={100} />
                </div>
                <div className="relative z-10">
                  <p className="font-black text-lg mb-1 flex items-center justify-center gap-2">
                    <Sparkles size={18} /> AI Planner Active
                  </p>
                  <p className="text-indigo-100 text-sm font-medium">Have a chat with the AI on the left to structure this itinerary.</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "notes" && (
          <div className="space-y-8">
            {!isArchived && (
              <form onSubmit={handleCreateNote} className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Plus size={16} /> Add a Note
                </h3>
                <input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Note Title" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-800 text-sm font-medium"
                />
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write down links, ideas, checklists..." 
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none text-slate-800 text-sm resize-none"
                />
                <button disabled={!title || !content} type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50">Save Note</button>
              </form>
            )}

            <div className="space-y-4">
              {initialNotes.map((note: any) => (
                <div key={note.id} className="p-5 border border-slate-100 rounded-2xl shadow-sm relative group hover:border-slate-300 transition-all">
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{note.title}</h4>
                  <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">By {note.author.name}</p>
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">{note.content}</p>
                  {!isArchived && (
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {initialNotes.length === 0 && <p className="text-slate-500 text-center py-10 font-medium">No shared notes yet.</p>}
            </div>
          </div>
        )}
        
        {activeTab === "splits" && (
          <div className="space-y-6 pb-20">
            {/* Total Math Area */}
            <div className="flex justify-between p-6 bg-slate-900 text-white rounded-3xl shadow-lg border border-slate-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Cost</p>
                <p className="text-3xl font-black">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Per Person</p>
                <p className="text-xl font-bold text-slate-300">₹{costPerPerson.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Settlements Area */}
            {settlements.length > 0 && (
              <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl max-w-full overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Who Owes Who</h3>
                <div className="space-y-3">
                  {settlements.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-white p-3.5 rounded-2xl shadow-sm border border-indigo-50/50">
                      <span className="font-semibold text-slate-700">{s.from}</span>
                      <div className="flex flex-col items-center px-4 text-indigo-400 shrink-0">
                        <span className="font-black text-xs bg-indigo-50 px-2 py-0.5 rounded-full mb-1">₹{s.amount.toLocaleString('en-IN')}</span>
                        <ArrowRight size={14} />
                      </div>
                      <span className="font-semibold text-slate-700">{s.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Expense Form */}
            {!isArchived && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Log New Expense</h3>
                <form onSubmit={handleAddExpense} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input 
                      value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)}
                      placeholder="What did you pay for?" 
                      className="flex-[3] bg-white border border-slate-200 rounded-xl outline-none px-4 py-2.5 text-sm font-medium"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number" step="1" min="0" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                        placeholder="0" 
                        className="w-full bg-white border border-slate-200 rounded-xl outline-none pl-7 pr-3 py-2.5 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Paid By</label>
                      <select 
                        value={expensePaidBy} 
                        onChange={(e) => setExpensePaidBy(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        {members.map((m: any) => (
                          <option key={m.userId} value={m.userId}>
                            {m.user.name} {m.userId === currentUserId ? "(You)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button 
                      disabled={!expenseTitle || !expenseAmount} 
                      type="submit" 
                      className="bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-slate-800 disabled:opacity-50 font-bold text-sm h-[40px] mt-5"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Ledger List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Ledger History</h3>
              {initialExpenses.map((ex: any) => (
                <div key={ex.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 transition-colors shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-[15px]">{ex.title}</span>
                    <span className="text-xs text-slate-400 font-medium">Paid by {ex.paidBy.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-900">₹{ex.amount.toLocaleString('en-IN')}</span>
                    {!isArchived && (ex.paidById === currentUserId || isAdmin) && (
                      <button onClick={() => handleDeleteExpense(ex.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {initialExpenses.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No expenses logged yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
