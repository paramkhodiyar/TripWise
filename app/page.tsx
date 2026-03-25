import Link from "next/link";
import { Plane, Users, Bot, ArrowRight, LayoutDashboard } from "lucide-react";
import { auth } from "@/auth";

export default async function LandingPage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Plane className="text-slate-900" size={24} />
          <span className="font-bold text-xl tracking-tight text-slate-900">TripWise.</span>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors">
              <LayoutDashboard size={20} /> Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log in</Link>
              <Link href="/signup" className="px-5 py-2 text-sm font-medium bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto py-20">
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
          Planning trips shouldn't be a civil war.
        </h1>
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl">
          Coordinate with friends in real-time while an AI acts as your dedicated Head Trip Planner to synthesize decisions, track budgets, and build structured itineraries.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href={session ? "/trips" : "/signup"} className="px-8 py-4 bg-slate-900 text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-lg">
            Start Planning <ArrowRight size={20} />
          </Link>
          <Link href="/trips" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 hover:border-slate-300 transition-all text-lg">
            Explore Public Trips
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left w-full mt-10">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center mb-6">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Chat</h3>
            <p className="text-slate-500">Argue, debate, and discuss just like WhatsApp, built straight into the platform.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Bot size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">AI Head Planner</h3>
            <p className="text-slate-500">Say @ai and let the intelligent planner resolve conflicts and suggest structured itineraries.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Plane size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Structured Plans</h3>
            <p className="text-slate-500">No more text blobs. Get visual cards for hotels, flights, and activities finalized by the group.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
