/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Search, User, Globe, DollarSign, Database, Shield, Briefcase, Bell, Eye } from 'lucide-react';
import { translations, currencyExchange } from '../utils';
import { UserRole } from '../types';

interface HeaderProps {
  currentLang: 'en' | 'ar' | 'es';
  setLang: (lang: 'en' | 'ar' | 'es') => void;
  currentCurrency: 'USD' | 'EUR' | 'AED';
  setCurrency: (currency: 'USD' | 'EUR' | 'AED') => void;
  cartCount: number;
  openCart: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  userName: string;
  onSignOut?: () => void;
}

export default function Header({
  currentLang,
  setLang,
  currentCurrency,
  setCurrency,
  cartCount,
  openCart,
  activeTab,
  setActiveTab,
  selectedRole,
  setSelectedRole,
  searchTerm,
  setSearchTerm,
  userName,
  onSignOut
}: HeaderProps) {
  const [langOpen, setLangOpen] = useState(false);
  const [curOpen, setCurOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ar';

  const notificationList = [
    { id: 1, title: 'Stock Alert', text: 'Low stock warning for "Aura Pro" Black.', time: '5m ago' },
    { id: 2, title: 'New Vendor Submission', text: 'EcoSmart Blender waiting for approval.', time: '1h ago' },
    { id: 3, title: 'Order Completed', text: 'Order #3108 discharged & delivered.', time: '2h ago' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('catalog')} 
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            {/* Storefront + Location Pin */}
            <div className="w-11 h-11 shrink-0 relative transition-transform duration-300 group-hover:scale-105">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Store awning stripes */}
                <path d="M12 20 L23 42 C24 44 21 47 18 47 C15 47 12 44 13 42 L12 20 Z" fill="#0f5132" />
                <path d="M30 20 L33 42 C34 44 31 47 28 47 C25 47 22 44 23 42 L30 20 Z" fill="#7ebd24" />
                <path d="M48 20 L44 42 C43 44 40 47 37 47 C34 47 32 44 33 42 L41 20 Z" fill="#0f5132" />
                <path d="M66 20 L59 42 C58 44 55 47 52 47 C49 47 47 44 48 42 L60 20 Z" fill="#7ebd24" />
                <path d="M84 20 L74 42 C73 44 70 47 67 47 C64 47 62 44 63 42 L78 20 Z" fill="#0f5132" />
                
                {/* Store base structure */}
                <path d="M16 47 L16 80 C16 84 20 86 24 86 L76 86 C80 86 84 84 84 80 L84 47" stroke="#0f5132" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                
                {/* Pinpoint overlay */}
                <path d="M50 40 C38 40 33 48 33 58 C33 71 50 87 50 87 C50 87 67 71 67 58 C67 48 62 40 50 40 Z" fill="#7ebd24" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.15))" />
                <circle cx="50" cy="54" r="5" fill="#ffffff" />
              </svg>
            </div>
 
            {/* SuuqHub Title + Skyline Orbit Arch */}
            <div className="flex flex-col relative justify-center pt-2">
              {/* Skyline Orbit Arch curve sitting over logo text */}
              <div className="absolute -top-3.5 left-[30px] right-[-15px] h-[22px] pointer-events-none select-none">
                <svg width="100%" height="100%" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Arc curve */}
                  <path d="M10 32 C 45 18, 115 18, 150 32" stroke="#a5b1c2" strokeWidth="1.5" strokeLinecap="round" />
                  
                  {/* Orange shopping bag (Left) */}
                  <g transform="translate(18, 5) scale(0.6)">
                    <path d="M10 6 C10 4 12 2 15 2 C18 2 20 4 20 6 L20 8 L10 8 L10 6 Z" stroke="#f08c14" strokeWidth="2" fill="none" />
                    <rect x="5" y="8" width="20" height="18" rx="3" fill="#f08c14" />
                    <circle cx="15" cy="14" r="2.5" fill="#ffffff" opacity="0.3" />
                  </g>
 
                  {/* Corporate block building in Blue (Middle) */}
                  <g transform="translate(68, 1) scale(0.65)">
                    <rect x="5" y="10" width="10" height="20" fill="#4b6584" />
                    <rect x="18" y="4" width="12" height="26" fill="#385170" />
                    <rect x="7" y="14" width="2" height="3" fill="#ffffff" opacity="0.8" />
                    <rect x="7" y="20" width="2" height="3" fill="#ffffff" opacity="0.8" />
                    <rect x="20" y="8" width="2" height="3" fill="#ffffff" opacity="0.8" />
                    <rect x="26" y="8" width="2" height="3" fill="#ffffff" opacity="0.8" />
                    <rect x="20" y="15" width="2" height="3" fill="#ffffff" opacity="0.8" />
                    <rect x="26" y="15" width="2" height="3" fill="#ffffff" opacity="0.8" />
                  </g>
 
                  {/* Residential Blue house (Right) */}
                  <g transform="translate(118, 5) scale(0.65)">
                    <rect x="6" y="12" width="20" height="14" fill="#0c3e26" />
                    <path d="M3 12 L16 2 L29 12 Z" fill="#051e12" />
                    <rect x="13" y="18" width="6" height="8" fill="#ffffff" opacity="0.9" />
                  </g>
                </svg>
              </div>
 
              {/* Text logo */}
              <div className="flex items-baseline font-sans font-black tracking-tight text-xl h-7">
                <span className="text-[#0f5132]">Suuq</span>
                <span className="text-[#7ebd24] font-extrabold">Hub</span>
              </div>
              <span className="text-[8.5px] font-mono tracking-[0.15em] text-slate-400 uppercase font-black -mt-1 pl-0.5">
                Multi-Vendor Hub
              </span>
            </div>
          </div>

          {/* Search bar inside Store catalog views */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={() => { if (activeTab !== 'catalog') setActiveTab('catalog'); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-sans"
            />
          </div>

          {/* Nav Icons and Portal links */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-nowrap shrink-0">
            
            {/* Language dropdown */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setCurOpen(false); }}
                className="p-2 sm:px-3 sm:py-1.5 rounded hover:bg-slate-100 text-sm text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline font-medium uppercase font-sans">{currentLang}</span>
              </button>
              {langOpen && (
                <div className={`absolute right-0 mt-2 w-32 rounded bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150`}>
                  {(['en', 'ar', 'es'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => { setLang(lang); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs cursor-pointer transition capitalize hover:bg-slate-100 text-slate-700 flex items-center justify-between ${currentLang === lang ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}
                    >
                      {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'Español'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency switcher dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCurOpen(!curOpen); setLangOpen(false); }}
                className="p-2 sm:px-3 sm:py-1.5 rounded hover:bg-slate-100 text-sm text-slate-600 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
              >
                <span className="text-indigo-600 font-bold">$</span>
                <span className="hidden sm:inline font-medium uppercase font-mono">{currentCurrency}</span>
              </button>
              {curOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {Object.keys(currencyExchange).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => { setCurrency(curr as 'USD' | 'EUR' | 'AED'); setCurOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs cursor-pointer transition font-mono hover:bg-slate-100 text-slate-700 ${currentCurrency === curr ? 'bg-indigo-50 text-indigo-700 font-semibold' : ''}`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Core Portals Swapping Buttons based on access level */}
            <div className="hidden lg:flex items-center gap-1.5">
              {/* Back to Client Storefront button */}
              <button
                onClick={() => setActiveTab('catalog')}
                className={`cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'catalog' || activeTab === 'checkout' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Storefront
              </button>

              {/* Vendor Portal button */}
              {(selectedRole === 'vendor' || selectedRole === 'superadmin') && (
                <button
                  onClick={() => setActiveTab('vendor')}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'vendor' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {t.vendorPortal}
                </button>
              )}

              {/* Super Admin Dashboard / Delivery Console button */}
              {(selectedRole === 'superadmin' || selectedRole === 'delivery_manager') && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {selectedRole === 'delivery_manager' ? 'Delivery Console' : t.adminConsole}
                </button>
              )}
            </div>

            {/* Alerts Center with Live notification tracking */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition cursor-pointer relative shrink-0"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              </button>

              {showNotificationPopup && (
                <div className={`absolute select-none right-0 mt-3 w-80 rounded bg-white border border-slate-200 shadow-lg py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150`}>
                  <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-900">Simulated Push Notifications</span>
                    <span className="text-[10px] text-indigo-600 font-bold font-mono">Live Logs</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {notificationList.map((n) => (
                      <div key={n.id} className="p-3 text-left hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                          <span className="text-[9px] font-mono text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
                        {/* Shopping Cart Button */}
            <button
              onClick={openCart}
              className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded hover:text-slate-900 text-slate-600 relative transition cursor-pointer shrink-0"
              id="header-cart-btn"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-indigo-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center animate-bounce shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown or Dedicated Login Button */}
            {!onSignOut ? (
              <button
                onClick={() => setActiveTab('login')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-lg font-bold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                id="header-login-mobile-btn"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Log In</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-xs font-bold ring-1 ring-slate-200 overflow-hidden">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="hidden md:inline font-medium text-xs max-w-[90px] truncate">{userName}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <span className="block text-xs text-slate-400">Signed In</span>
                      <span className="block text-xs font-bold text-indigo-600 truncate">{userName}</span>
                    </div>
                    
                    <button
                      onClick={() => { setActiveTab('dashboard'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-55 bg-white hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" /> {t.customerDashboard}
                    </button>

                    <div className="block lg:hidden border-t border-slate-100 my-1"></div>
                    
                    {/* Local switcher on mobile */}
                    <button
                      onClick={() => { setActiveTab('catalog'); setUserDropdownOpen(false); }}
                      className="block lg:hidden w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition flex items-center gap-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> Storefront
                    </button>

                    {(selectedRole === 'vendor' || selectedRole === 'superadmin') && (
                      <button
                        onClick={() => { setActiveTab('vendor'); setUserDropdownOpen(false); }}
                        className="block lg:hidden w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer transition flex items-center gap-2"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {t.vendorPortal}
                      </button>
                    )}

                    {(selectedRole === 'superadmin' || selectedRole === 'delivery_manager') && (
                      <button
                        onClick={() => { setActiveTab('admin'); setUserDropdownOpen(false); }}
                        className="block lg:hidden w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer transition flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400" /> {selectedRole === 'delivery_manager' ? 'Delivery Console' : t.adminConsole}
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1.5"></div>

                    {onSignOut && (
                      <button
                        onClick={() => { onSignOut(); setUserDropdownOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 text-red-600 cursor-pointer transition flex items-center gap-2 font-semibold"
                      >
                        <Database className="w-3.5 h-3.5" /> Sign Out Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
