import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Determine if current route should display sidebar
  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/my-') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/superadmin') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/notifications') ||
    (location.pathname === '/report' && isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {isDashboardRoute && isAuthenticated && <Sidebar />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};
