import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, PlusCircle, User as UserIcon, LogOut, Shield, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Notification, ApiResponse } from '../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isStudent, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch (err) {
      // silent
    }
  };

  const fetchRecentNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<ApiResponse<Notification[]>>('/notifications/recent');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (showNotifications) {
      fetchRecentNotifications();
    }
  }, [showNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getDashboardPath = () => {
    if (isSuperAdmin) return '/superadmin';
    if (isAdmin) return '/admin';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              CU<span className="text-teal-600">Find</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 rounded">
              Chandigarh University
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link to="/browse" className="hover:text-indigo-600 transition-colors py-1">
            Browse Items
          </Link>
          <Link to="/recovery" className="hover:text-indigo-600 transition-colors py-1">
            Recovery Archives
          </Link>
          {isAuthenticated && (
            <Link to={getDashboardPath()} className="hover:text-indigo-600 transition-colors py-1">
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Quick Report Button */}
              <Link
                to="/report"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Report Item</span>
              </Link>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No recent notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                              !n.read ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-800">{n.title}</span>
                              {!n.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(n.id, e)}
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] font-medium"
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center py-2.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-slate-50 border-t border-slate-100"
                    >
                      View All Notifications
                    </Link>
                  </div>
                )}
              </div>

              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {user?.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 hidden lg:inline max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        Dashboard
                      </Link>
                      {isStudent && (
                        <>
                          <Link
                            to="/my-reports"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            My Reports
                          </Link>
                          <Link
                            to="/my-claims"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            My Claims
                          </Link>
                        </>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        Profile Settings
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
