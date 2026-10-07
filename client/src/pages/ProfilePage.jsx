import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Pill,
  Stethoscope,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-blue-200">
              {user.name?.[0] || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-xs text-slate-500 capitalize">{user.role || 'patient'} Account</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
            {user.role || 'patient'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email Address
            </span>
            <p className="font-bold text-slate-800">{user.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Phone Number
            </span>
            <p className="font-bold text-slate-800">{user.phone || '+91 98765 43210'}</p>
          </div>
        </div>

        {user.role === 'doctor' && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
            <div>
              <span className="font-bold block">Doctor Practitioner Console</span>
              <p className="text-indigo-700 mt-0.5">Manage patient queue, video rooms, and timings</p>
            </div>
            <Link
              to="/doctor/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
            >
              Open Dashboard
            </Link>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={logout}
            className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
