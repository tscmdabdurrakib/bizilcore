"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarCheck2, Search, Loader2, LogIn, LogOut, RefreshCw } from "lucide-react";

interface AttendanceMember {
  id: string;
  name: string;
  memberId: string;
  plan?: { name: string };
}
interface AttendanceRecord {
  id: string;
  checkIn: string;
  checkOut?: string;
  member: AttendanceMember;
}
interface Member { id: string; name: string; memberId: string; phone: string; status: string }

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

export default function AttendanceBoard() {
  const [currentlyIn, setCurrentlyIn] = useState<AttendanceRecord[]>([]);
  const [todayAll, setTodayAll] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/gym/attendance");
    if (res.ok) {
      const data = await res.json();
      setCurrentlyIn(data.currentlyIn);
      setTodayAll(data.todayAll);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/gym/members?search=${encodeURIComponent(search)}&status=active`);
      if (res.ok) setSearchResults(await res.json());
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const checkIn = async (memberId: string) => {
    setActionId(memberId);
    await fetch("/api/gym/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkin", memberId }),
    });
    setSearch("");
    setSearchResults([]);
    await load();
    setActionId(null);
  };

  const checkOut = async (attendanceId: string) => {
    setActionId(attendanceId);
    await fetch("/api/gym/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout", attendanceId }),
    });
    await load();
    setActionId(null);
  };

  const now = new Date();

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>উপস্থিতি সিস্টেম</h1>
          <p className="text-sm" style={{ color: S.muted }}>আজকে মোট {todayAll.length} জন এসেছেন</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border" style={{ borderColor: S.border }}>
          <RefreshCw size={16} style={{ color: S.muted }} />
        </button>
      </div>

      {/* Check-in search */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <p className="text-sm font-bold mb-2" style={{ color: S.text }}>Check-In</p>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input className={inputCls + " pl-9"} style={inputStyle} placeholder="সদস্যের নাম, ID বা ফোন দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {searching && <p className="text-xs mt-2" style={{ color: S.muted }}>খোঁজা হচ্ছে...</p>}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1">
            {searchResults.slice(0, 5).map(m => {
              const alreadyIn = currentlyIn.some(a => a.member.id === m.id);
              return (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{m.name}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{m.memberId} — {m.phone}</p>
                  </div>
                  {alreadyIn ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>এখনো আছেন</span>
                  ) : (
                    <button onClick={() => checkIn(m.id)} disabled={actionId === m.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                      style={{ backgroundColor: "#7C3AED" }}>
                      {actionId === m.id ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />} Check In
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Currently inside */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-sm font-bold" style={{ color: S.text }}>এখন জিমে আছেন ({currentlyIn.length} জন)</p>
        </div>
        {currentlyIn.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: S.muted }}>কেউ নেই</p>
        ) : (
          <div className="space-y-2">
            {currentlyIn.map(a => {
              const checkInTime = new Date(a.checkIn);
              const mins = Math.round((now.getTime() - checkInTime.getTime()) / 60000);
              const dur = mins < 60 ? `${mins} মিনিট` : `${Math.floor(mins / 60)} ঘণ্টা ${mins % 60} মিনিট`;
              return (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-xl" style={{ backgroundColor: "#F5F3FF" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#7C3AED" }}>
                      {a.member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: S.text }}>{a.member.name}</p>
                      <p className="text-xs" style={{ color: S.muted }}>{checkInTime.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })} — {dur}</p>
                    </div>
                  </div>
                  <button onClick={() => checkOut(a.id)} disabled={actionId === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border"
                    style={{ borderColor: "#7C3AED", color: "#7C3AED" }}>
                    {actionId === a.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />} Check Out
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's log */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-3">
          <CalendarCheck2 size={16} style={{ color: "#7C3AED" }} />
          <p className="text-sm font-bold" style={{ color: S.text }}>আজকের লগ</p>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {todayAll.map(a => (
            <div key={a.id} className="flex justify-between items-center py-1.5 border-b text-xs" style={{ borderColor: S.border }}>
              <span style={{ color: S.text }}>{a.member.name} <span style={{ color: S.muted }}>({a.member.memberId})</span></span>
              <span style={{ color: S.muted }}>
                {new Date(a.checkIn).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                {a.checkOut ? ` → ${new Date(a.checkOut).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}` : " (আছেন)"}
              </span>
            </div>
          ))}
          {todayAll.length === 0 && <p className="text-sm text-center py-4" style={{ color: S.muted }}>কোনো উপস্থিতি নেই</p>}
        </div>
      </div>
    </div>
  );
}
