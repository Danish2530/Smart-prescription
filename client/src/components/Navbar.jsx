import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  LayoutDashboard,
  Calendar,
  FileText,
  Clock,
  BarChart3,
  Bot,
  LogOut,
  Bell,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  Video,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminder } from '../context/ReminderContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { notificationPermission, requestPermission } = useReminder();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDoctor = user?.role === 'doctor';

  const patientNavLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Find Doctor', path: '/doctors', icon: Stethoscope },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Scan & Prescriptions', path: '/prescriptions', icon: FileText },
    { name: 'Schedule', path: '/schedule', icon: Clock },
    { name: 'Adherence', path: '/adherence', icon: BarChart3 },
    { name: 'AI Health Assistant', path: '/health-assistant', icon: Bot },
  ];

  const doctorNavLinks = [
    { name: 'Doctor Console', path: '/doctor/dashboard', icon: Activity },
    { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
    { name: 'Practice Settings', path: '/doctor/availability', icon: Clock },
    { name: 'Find Doctor (Preview)', path: '/doctors', icon: Stethoscope },
    { name: 'AI Assistant', path: '/health-assistant', icon: Bot },
  ];

  const navLinks = isDoctor ? doctorNavLinks : patientNavLinks;

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* PRESCRIPTO Brand Logo */}
          <Link
            to={isAuthenticated ? (isDoctor ? '/doctor/dashboard' : '/dashboard') : '/'}
            className="flex items-center gap-2.5 flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight block leading-none">
                PRESCRIPTO
              </span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">
                Digital Healthcare Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden xl:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Medium screen abbreviated nav */}
          {isAuthenticated && (
            <nav className="hidden md:flex xl:hidden items-center space-x-1">
              <Link
                to={isDoctor ? '/doctor/dashboard' : '/dashboard'}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Dashboard
              </Link>
              <Link
                to="/doctors"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Doctors
              </Link>
              <Link
                to="/appointments"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Appointments
              </Link>
              <Link
                to="/prescriptions"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Prescriptions
              </Link>
              <Link
                to="/health-assistant"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                AI Assistant
              </Link>
            </nav>
          )}

          {/* Desktop User Action / Role Toggle */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                {/* Demo Portal Switcher (Quick Access to Doctor Command Center) */}
                <Link
                  to={isDoctor ? '/dashboard' : '/doctor/dashboard'}
                  className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1"
                  title="Switch between Patient and Doctor views"
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isDoctor ? 'Patient View' : 'Doctor Portal'}</span>
                </Link>

                {notificationPermission !== 'granted' && (
                  <button
                    onClick={requestPermission}
                    title="Enable dose reminder alerts"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>Alerts</span>
                  </button>
                )}

                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <span className="block font-semibold text-slate-800 line-clamp-1">
                      {user?.name || 'User'}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{user?.role || 'Patient'}</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-xs font-bold bg-blue-600 text-white px-3.5 py-1.5 rounded-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <Link
              to={isDoctor ? '/dashboard' : '/doctor/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold text-center"
            >
              Switch to {isDoctor ? 'Patient Dashboard' : 'Doctor Portal'}
            </Link>

            <div className="flex items-center justify-between pt-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
