import Link from "next/link";
import { auth } from "@/auth";
import { LogOut, Plus, MapPin, Users, ChevronRight, Mail, Compass, User, Plane, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { InviteCard } from "./InviteCard";
import { signOut } from "@/auth";

export default async function DashboardPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [activeGroups, archivedGroups, pendingInvites, userData] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId: session.user.id, group: { isArchived: false } },
      include: {
        group: { include: { _count: { select: { members: true } } } }
      },
      orderBy: { group: { createdAt: "desc" } }
    }),
    prisma.groupMember.findMany({
      where: { userId: session.user.id, group: { isArchived: true } },
      include: {
        group: { include: { _count: { select: { members: true } } } }
      },
      orderBy: { group: { createdAt: "desc" } }
    }),
    prisma.groupInvite.findMany({
      where: { receiverId: session.user.id, status: "pending" },
      include: { group: true, sender: true }
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profilePic: true }
    })
  ]);

  const firstName = session.user?.name?.split(" ")[0] ?? "Traveler";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-0">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between">
          {/* Logo: dark navy to match brand identity */}
          <div className="flex items-center gap-2 text-slate-900">
            <Plane size={18} className="text-slate-900" />
            <span className="font-bold text-base tracking-tight text-slate-900">TripWise.</span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            <Link
              href="/trips"
              className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 md:px-4 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <Compass size={15} className="md:hidden" />
              <Compass size={20} className="hidden md:block" />
              <span className="hidden md:inline">Explore</span>
            </Link>
            <Link
              href="/consultant"
              className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 md:px-4 py-1.5 rounded-lg transition-all hover:bg-indigo-100 shadow-sm mx-1 shrink-0"
            >
              <Sparkles size={15} className="md:hidden" />
              <Sparkles size={20} className="hidden md:block" />
              <span className="hidden md:inline">Saarthi</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 md:px-4 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                {userData?.profilePic ? (
                  <img src={userData.profilePic} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <User size={12} className="md:hidden" />
                    <User size={14} className="hidden md:block" />
                  </>
                )}
              </div>
              <span className="hidden md:inline">Profile</span>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className="shrink-0"
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 md:px-4 py-1.5 rounded-lg transition-colors"
              >
                <LogOut size={15} className="md:hidden" />
                <LogOut size={20} className="hidden md:block" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your trips and invites</p>
        </div>

        {/* Two-column layout: trips (left) + invites (right) */}
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* ── Left column: trips ── */}
          <div className="flex-1 min-w-0">

            {/* Active Trips */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plane size={16} className="text-blue-500" />
                  <h2 className="text-base font-bold text-slate-800">Active Trips</h2>
                  <span className="text-xs font-bold bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
                    {activeGroups.length}
                  </span>
                </div>
                <Link
                  href="/dashboard/create"
                  className="flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Plus size={14} /> New Trip
                </Link>
              </div>

              {activeGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
                  <p className="text-sm font-medium text-slate-500">No active trips found.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeGroups.map((gm) => (
                    <Link
                      key={gm.groupId}
                      href={`/group/${gm.groupId}`}
                      className="group flex flex-col gap-3 bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <MapPin size={14} className="text-blue-500" />
                        </div>
                        <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 mt-0.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 truncate tracking-tight">{gm.group.name}</h3>
                        <p className="text-slate-500 text-xs mt-1 truncate font-medium">
                          {gm.group.description || "No description provided."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Users size={10} /> {gm.group._count.members}
                        </span>
                        {gm.group.isStarted && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            Started
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                          {gm.role}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Archived Trips */}
            {archivedGroups.length > 0 && (
              <>
                <div className="h-px bg-slate-200 w-full mb-8" />
                <div className="opacity-70">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center">
                      <div className="w-2 h-2 bg-slate-400 rounded-sm" />
                    </div>
                    <h2 className="text-base font-bold text-slate-500">Archived Memories</h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {archivedGroups.map((gm) => (
                      <Link
                        key={gm.groupId}
                        href={`/group/${gm.groupId}`}
                        className="group flex flex-col gap-3 bg-white p-5 rounded-2xl border border-slate-200 grayscale hover:grayscale-0 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <MapPin size={14} className="text-slate-400" />
                          </div>
                          <ChevronRight size={15} className="text-slate-300 mt-0.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-700 truncate tracking-tight">{gm.group.name}</h3>
                          <p className="text-slate-400 text-[11px] mt-1 font-bold uppercase tracking-widest">Historical Data</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Vertical divider (desktop only) ── */}
          <div className="hidden md:block w-px self-stretch bg-slate-200 shrink-0" />

          {/* ── Right column: invites ── */}
          <div className="w-full md:w-80 shrink-0">

            {/* Horizontal divider (mobile only) */}
            <div className="md:hidden h-px bg-slate-200 w-full mb-6" />

            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-slate-400" />
              <h2 className="text-base font-semibold text-slate-800">Pending Invites</h2>
              {pendingInvites.length > 0 && (
                <span className="text-xs font-semibold bg-blue-500 text-white rounded-full px-2 py-0.5">
                  {pendingInvites.length}
                </span>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {pendingInvites.length > 0 ? (
                pendingInvites.map((invite) => (
                  <InviteCard key={invite.id} invite={invite} />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <Mail size={15} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400">No pending invites</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}