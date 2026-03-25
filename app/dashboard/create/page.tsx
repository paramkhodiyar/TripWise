"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/app/actions/group";
import toast from "react-hot-toast";
import Link from "next/link";
import { ChevronLeft, Globe, Lock, DollarSign, Users, CalendarDays, Plane } from "lucide-react";

export default function CreateGroupPage() {
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    // Explicitly set isPublic based on !isPrivate
    formData.set("isPublic", String(!isPrivate));
    try {
      const res = await createGroup(formData);
      if (res.success) {
        toast.success("Trip created!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create trip");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Sticky Top Bar ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Plane size={16} className="text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Create New Trip</h1>
          </div>
        </div>
      </header>

      {/* ── Form ── */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Basic Info Card ── */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trip Details</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Trip Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Trip Name <span className="text-red-400">*</span>
                </label>
                <input
                  name="name"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white outline-none text-slate-800 text-sm transition-all placeholder:text-slate-400"
                  placeholder="e.g. Summer in Tokyo"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                  <span className="ml-1.5 text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  name="description"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white outline-none text-slate-800 text-sm transition-all resize-none placeholder:text-slate-400"
                  rows={3}
                  placeholder="What's the vibe?"
                />
              </div>
            </div>
          </section>

          {/* ── Visibility Card ── */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visibility</p>
            </div>
            <div className="p-5">
              {/* Toggle row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${!isPrivate ? "bg-blue-50 border border-blue-100" : "bg-indigo-50 border border-indigo-100"}`}>
                    {!isPrivate
                      ? <Globe size={15} className="text-blue-500" />
                      : <Lock size={15} className="text-indigo-500" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{isPrivate ? "Private Trip" : "Public Trip"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isPrivate
                        ? "Invite-only, not listed publicly"
                        : "Appears on Explore — anyone can join"}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPrivate}
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 ${isPrivate ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isPrivate ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </div>

              {/* Public-only fields */}
              {!isPrivate && (
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
                  {/* Budget */}
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                    <span className="text-slate-400 font-bold text-xs">₹</span>
                    Target Budget <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="targetBudget"
                      required
                      placeholder="e.g. ₹5,000 – ₹10,000 per person"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white outline-none text-slate-800 text-sm transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Max Members + Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                        <Users size={13} className="text-slate-400" />
                        Max Members <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="2"
                        max="50"
                        name="maxMembers"
                        placeholder="e.g. 10"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white outline-none text-slate-800 text-sm transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                        <CalendarDays size={13} className="text-slate-400" />
                        Duration (Days) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="60"
                        name="days"
                        placeholder="e.g. 5"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:bg-white outline-none text-slate-800 text-sm transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                Creating trip...
              </>
            ) : (
              <>
                <Plane size={16} />
                Create Trip
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}