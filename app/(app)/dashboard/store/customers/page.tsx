"use client";

import { useEffect, useState } from "react";
import { Users, Search, UserCheck, UserX, Mail, Phone, Calendar } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  googleId: string | null;
  createdAt: string;
}

export default function StoreCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/store/customers")
      .then(r => r.json())
      .then(d => { setCustomers(d.customers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">স্টোর কাস্টমার</h1>
            <p className="text-sm text-gray-500">আপনার স্টোরে রেজিস্টার করা কাস্টমারদের তালিকা</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserCheck size={16} className="text-green-500" />
          <span className="font-semibold text-gray-900">{customers.length}</span> জন মোট
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{customers.length}</p>
              <p className="text-xs text-gray-500">মোট কাস্টমার</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <UserCheck size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{customers.filter(c => c.emailVerified).length}</p>
              <p className="text-xs text-gray-500">ইমেইল ভেরিফাইড</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{customers.filter(c => c.googleId).length}</p>
              <p className="text-xs text-gray-500">Google দিয়ে</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <UserX size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? "কোনো ফলাফল পাওয়া যায়নি" : "এখনো কোনো কাস্টমার নেই"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-50">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">কাস্টমার</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">ইমেইল</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">ফোন</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">স্ট্যাটাস</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">যোগদান</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                          {c.googleId && (
                            <span className="text-xs text-blue-500">Google</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Mail size={13} className="text-gray-400" />
                        {c.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        {c.phone ? (
                          <><Phone size={13} className="text-gray-400" />{c.phone}</>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.emailVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                          <UserCheck size={11} /> ভেরিফাইড
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                          <UserX size={11} /> পেন্ডিং
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(c.createdAt).toLocaleDateString("bn-BD")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
