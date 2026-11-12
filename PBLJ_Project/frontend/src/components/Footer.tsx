import React from 'react';
import { Search, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold">
                <Search className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                CU<span className="text-teal-400">Find</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Centralized, smart Lost & Found platform for Chandigarh University. Empowering CU students and campus safety officers to reunite lost belongings quickly and securely with automated matching and ownership verification.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <Shield className="w-4 h-4" />
              <span>Verified Ownership & Identity Protection</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/browse" className="hover:text-white transition">Browse Lost & Found</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition">Report an Item</Link>
              </li>
              <li>
                <Link to="/recovery" className="hover:text-white transition">Recovery Records</Link>
              </li>
              <li>
                <a href="/swagger-ui.html" target="_blank" rel="noreferrer" className="hover:text-white transition">REST API Docs (Swagger)</a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Categories</h4>
            <ul className="space-y-2 text-xs">
              <li>Electronics & Chargers</li>
              <li>College ID Cards & Keys</li>
              <li>Backpacks & Wallets</li>
              <li>Water Bottles & Books</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CUFind – Chandigarh University. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Spring Boot 3 & React TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
};
