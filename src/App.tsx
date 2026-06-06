/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import CheckoutView from './components/CheckoutView';
import CustomerDashboard from './components/CustomerDashboard';
import VendorPortal from './components/VendorPortal';
import AdminPortal from './components/AdminPortal';
import AIChatAgent from './components/AIChatAgent';
import LoginView from './components/LoginView';

import { Product, CartItem, Coupon, UserRole, HeroCampaign } from './types';
import { initialProducts } from './initialData';
import { translations, formatPrice } from './utils';
import { LayoutGrid, Filter, Search, ShieldCheck, Download, AlertCircle, ShoppingBag, ArrowRight, Sparkles, ChevronLeft, ChevronRight, Zap, RefreshCw, Star, Flame, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  // Localization + Currency States
  const [lang, setLang] = useState<'en' | 'ar' | 'es'>('en');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'AED'>('USD');

  // Slider interactive showcase state
  const [heroCampaigns, setHeroCampaigns] = useState<HeroCampaign[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Remaining catalog "View All" section filters modal state
  const [viewAllSection, setViewAllSection] = useState<'flash' | 'new' | 'featured' | 'trending' | 'best' | null>(null);

  // Firebase auth state monitoring states
  const [firebaseUser, setFirebaseUser] = useState<{ id: string; email: string; name: string; role: 'customer' | 'vendor' | 'admin' | 'superadmin' } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Unified Database states loaded from server.ts
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [wishlist, setWishlist] = useState<string[]>(['prod-headphones', 'prod-watch']);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Filtering catalog states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('default');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Routing navigation control states
  // 'catalog' | 'checkout' | 'dashboard' | 'vendor' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('catalog');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer'); // defaulted to customer and synced with auth roles

  // Open Details Modal product
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);

  // Cart slide drawer overlay
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedCheckoutCoupon, setAppliedCheckoutCoupon] = useState<Coupon | undefined>(undefined);

  // Success checkout screen code
  const [lastCompletedOrderId, setLastCompletedOrderId] = useState<string | null>(null);

  // Listen for user changes in Auth SDK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Prioritize local dev sandbox override if active
      const localUserStr = localStorage.getItem('apex_local_user');
      if (localUserStr) {
        try {
          const localUser = JSON.parse(localUserStr);
          setFirebaseUser(localUser);
          setSelectedRole(localUser.role || 'customer');
          setAuthLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('apex_local_user');
        }
      }

      if (user) {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const resolvedRole = data.role || 'customer';
            setFirebaseUser({
              id: user.uid,
              email: user.email || '',
              name: data.name || user.displayName || 'Authorized User',
              role: resolvedRole
            });
            setSelectedRole(resolvedRole);
          } else {
            const actualRole = (user.email || '').toLowerCase() === 'boqorapps@gmail.com' ? 'superadmin' : 'customer';
            const payload = {
              id: user.uid,
              email: user.email || '',
              name: user.displayName || user.email?.split('@')[0] || 'Guest User',
              role: actualRole,
              language: lang,
              currency: currency,
              wishlist: [],
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), payload);
            } catch (err) {
              console.warn("Could not auto-register redirect session in firestore database:", err);
            }

            setFirebaseUser({
              id: user.uid,
              email: user.email || '',
              name: user.displayName || user.email?.split('@')[0] || 'Guest User',
              role: actualRole as any
            });
            setSelectedRole(actualRole as any);
          }
        } catch (dbErr) {
          console.warn("Could not retrieve user document (permissions or rules issue):", dbErr);
          setFirebaseUser({
            id: user.uid,
            email: user.email || '',
            name: user.displayName || 'Guest User',
            role: 'customer'
            });
            setSelectedRole('customer');
        }
      } else {
        setFirebaseUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load backend catalog lists on component mount
  useEffect(() => {
    fetchLiveCatalog();
  }, [activeTab, selectedRole]);

  const fetchLiveCatalog = async () => {
    try {
      // Fetch only "approved" items for standard catalog, or all if we are on Admin views
      const queryParam = selectedRole === 'superadmin' ? '' : '?approval=approved';
      const [pRes, campRes] = await Promise.all([
        fetch(`/api/products${queryParam}`),
        fetch('/api/hero-campaigns')
      ]);

      if (pRes.ok) {
        const contentType = pRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await pRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
          } else {
            console.warn("API returned empty product array/invalid data structure, using initial fallback products.");
            setProducts(initialProducts);
          }
        } else {
          console.warn("API returned non-JSON product payload, using initial fallback products.");
          setProducts(initialProducts);
        }
      } else {
        console.warn("API product endpoint returned non-OK code, using initial fallback products.");
        setProducts(initialProducts);
      }

      if (campRes.ok) {
        const contentType = campRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const campData = await campRes.json();
          if (Array.isArray(campData)) {
            setHeroCampaigns(campData);
          }
        }
      }
    } catch (err) {
      console.error("Failed fetching products or campaigns catalog:", err);
      setProducts(initialProducts);
    }
  };

  const handleToggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(prev => prev.filter(id => id !== productId));
    } else {
      setWishlist(prev => [...prev, productId]);
    }
  };

  const handleAddToCart = (product: Product, color?: string, size?: string, qty = 1) => {
    const itemUniqueId = `${product.id}-${color || ''}-${size || ''}`;
    
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === itemUniqueId);
      if (existingIdx !== -1) {
        const cloned = [...prev];
        cloned[existingIdx].quantity = Math.min(product.stock, cloned[existingIdx].quantity + qty);
        return cloned;
      } else {
        const itemPrice = product.price; // variants modifiers already calculated at modal level
        const newItem: CartItem = {
          id: itemUniqueId,
          productId: product.id,
          title: product.title,
          price: itemPrice,
          image: product.image,
          quantity: qty,
          selectedColor: color,
          selectedSize: size,
          stockLimit: product.stock
        };
        return [...prev, newItem];
      }
    });

    // Automatically trigger cart confirmation notification log
    setCartOpen(true);
  };

  const handleUpdateCartQty = (id: string, qty: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const handleRemoveCartItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Direct mock install criteria prompt
  const [installPromptTriggered, setInstallPromptTriggered] = useState(false);
  const handleSimulateInstall = () => {
    setInstallPromptTriggered(true);
    setTimeout(() => {
      alert("PWA installed successfully! OmniChannel E-Store icon added to your device terminal dashboard.");
      setInstallPromptTriggered(false);
    }, 1200);
  };

  // Filtering + Sorting mapping logic
  let filteredProducts = products.filter(p => p.isActive && p.isApproved);
  
  if (selectedCategory !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
  }

  if (searchTerm) {
    const query = searchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
  }

  if (sortOption === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'rating') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  // Categories lists config
  const categoriesList = ['All', 'Electronics', 'Fashion', 'Living', 'Beauty'];

  const t = translations[lang];
  const isRtl = lang === 'ar';



  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3.5">
          <div className="h-10 w-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest animate-pulse">Establishing Secure Auth Handshake...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen font-sans bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* Header element */}
      <Header
        currentLang={lang}
        setLang={setLang}
        currentCurrency={currency}
        setCurrency={setCurrency}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        openCart={() => setCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setLastCompletedOrderId(null); }}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        userName={firebaseUser?.name || 'Guest Account'}
        onSignOut={firebaseUser ? () => {
          localStorage.removeItem('apex_local_user');
          signOut(auth).then(() => {
            setFirebaseUser(null);
            setSelectedRole('customer');
            setActiveTab('catalog');
          }).catch(() => {
            setFirebaseUser(null);
            setSelectedRole('customer');
            setActiveTab('catalog');
          });
        } : undefined}
      />

      {/* Main Container contents */}
      <main className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          
          {/* View 1: Customer Storefront / Main Catalog Grid */}
          {activeTab === 'catalog' && !lastCompletedOrderId && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8"
              id="shopping-catalog-viewport"
            >
              {/* PWA Direct Installation Promotions Promo strip */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="h-10 w-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Download OmniChannel Storefront Web-App</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Works beautifully offline! Pin to your desktop dashboard with instantaneous launch speeds.</p>
                  </div>
                </div>
                <button
                  onClick={handleSimulateInstall}
                  disabled={installPromptTriggered}
                  className="px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {installPromptTriggered ? 'Installing WebApp...' : 'Simulate PWA Install'}
                </button>
              </div>

              {/* Beautiful Dynamic Carousel Slider / Fallback Showcase Hero banner */}
              {heroCampaigns.filter(c => c.status === 'approved').length > 0 ? (
                <div className="relative rounded-2xl overflow-hidden shadow-lg h-[260px] sm:h-[320px] bg-indigo-950 border border-slate-700/30 group">
                  {/* Slide background */}
                  <img
                    src={heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.image}
                    alt={heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-700 select-nonepointer"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle shadows layer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-transparent" />

                  {/* Slider metadata attributes content */}
                  <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center items-start text-left z-10">
                    <span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest font-black mb-2.5 flex items-center gap-1.5 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-500/20 animate-pulse">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Merchant Spotlight Showcase Slot
                    </span>
                    <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white max-w-xl leading-snug mb-3">
                      {heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.title}
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-lg leading-relaxed mb-6 font-medium">
                      {heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.subtitle || "Special custom selected products for SuuqHub clients."}
                    </p>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const productElement = document.getElementById('storefront-category-sections');
                          if (productElement) {
                            productElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }} 
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-indigo-950 font-black text-xs uppercase rounded shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        Claim Custom Offer
                      </button>
                      <span className="self-center px-3 py-1 text-[10px] bg-white/10 text-slate-300 rounded border border-white/15 shrink-0 font-mono">
                        Partner Brand: <b className="text-amber-400">{heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.vendorName}</b>
                      </span>
                    </div>
                  </div>

                  {/* Sliding controls toggles */}
                  {heroCampaigns.filter(c => c.status === 'approved').length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentSlide(prev => (prev === 0 ? heroCampaigns.filter(c => c.status === 'approved').length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/40 hover:bg-indigo-600 text-white opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentSlide(prev => (prev === heroCampaigns.filter(c => c.status === 'approved').length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/40 hover:bg-indigo-600 text-white opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Dot indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {heroCampaigns.filter(c => c.status === 'approved').map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'w-4 bg-amber-500' : 'w-1.5 bg-white/30'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 border border-indigo-700/40 p-8 sm:p-12 text-left flex flex-col justify-center min-h-[230px] shadow-lg">
                  <div className="absolute right-12 bottom-0 top-0 w-1/3 opacity-15 hidden md:block select-none pointer-events-none">
                    <img src="https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=500&q=80" className="w-full h-full object-contain rotate-12 scale-110" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest font-black mb-2.5 flex items-center gap-1.5 animate-pulse">
                    <ShieldCheck className="w-4 h-4 text-amber-500" /> Authorized SuuqHub Platform Merchant
                  </span>
                  <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white max-w-xl leading-snug mb-3">
                    Sleek. Performance. <span className="text-amber-500">Multi-Vendor</span> Hub Marketplace.
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-lg leading-relaxed mb-6">
                    Save instantly up to 10% utilizing voucher <span className="font-mono text-amber-500 font-black bg-white/10 px-2 py-0.5 rounded border border-amber-500/30">SUUQ10</span> on checkouts. Premium listings.
                  </p>
                  <div>
                    <button 
                      onClick={() => setSelectedCategory('Electronics')} 
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-indigo-950 font-black text-xs uppercase rounded shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      Explore Electronics Catalog
                    </button>
                  </div>
                </div>
              )}

              {/* Filter controls layer */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {/* Horizontal Category selectors tab list */}
                <div className="flex flex-wrap gap-2.5">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setViewAllSection(null); }}
                      className={`cursor-pointer px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition ${selectedCategory === cat && !viewAllSection ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200/30' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sorter selectors layout */}
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-500 shadow-sm">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="bg-transparent text-slate-700 focus:outline-none cursor-pointer font-sans"
                    >
                      <option value="default" className="text-slate-800">{t.sortBy}</option>
                      <option value="price-asc" className="text-slate-800">{t.priceLowHigh}</option>
                      <option value="price-desc" className="text-slate-800">{t.priceHighLow}</option>
                      <option value="rating" className="text-slate-800">{t.customerRating}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Categorized Storefront Listing */}
              {viewAllSection ? (
                <div className="space-y-6 text-left animate-in fade-in duration-200">
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewAllSection(null)} className="p-1.5 px-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition">
                        <ChevronLeft className="w-4 h-4 stroke-[3]" /> Back
                      </button>
                      <h2 className="text-xs font-sans font-black uppercase tracking-wider text-indigo-750 flex items-center gap-1.5 ml-3">
                        {viewAllSection === 'flash' && <><Zap className="text-rose-500 fill-rose-500 w-4.5 h-4.5" /> Full Flash Deals Runway</>}
                        {viewAllSection === 'new' && <><RefreshCw className="text-indigo-500 w-4.5 h-4.5" /> Full New Arrivals Runway</>}
                        {viewAllSection === 'featured' && <><Star className="text-yellow-500 fill-yellow-500 w-4.5 h-4.5" /> Full Featured Products Runway</>}
                        {viewAllSection === 'trending' && <><Flame className="text-orange-500 fill-orange-500 w-4.5 h-4.5" /> Full Trending Now Runway</>}
                        {viewAllSection === 'best' && <><Trophy className="text-amber-500 fill-amber-500 w-4.5 h-4.5" /> Full Best Sellers Trophy Group</>}
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-slate-500 font-bold bg-white px-2 py-1 border border-slate-200 rounded">
                      {filteredProducts.filter(p => {
                        if (viewAllSection === 'flash') return p.isFlashDeal;
                        if (viewAllSection === 'new') return p.isNewArrival;
                        if (viewAllSection === 'featured') return p.isFeatured;
                        if (viewAllSection === 'trending') return p.isTrending;
                        if (viewAllSection === 'best') return p.isBestSeller;
                        return false;
                      }).length} items available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {filteredProducts.filter(p => {
                      if (viewAllSection === 'flash') return p.isFlashDeal;
                      if (viewAllSection === 'new') return p.isNewArrival;
                      if (viewAllSection === 'featured') return p.isFeatured;
                      if (viewAllSection === 'trending') return p.isTrending;
                      if (viewAllSection === 'best') return p.isBestSeller;
                      return false;
                    }).map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        currency={currency}
                        lang={lang}
                        onViewDetails={(item) => setDetailedProduct(item)}
                        onAddToCart={handleAddToCart}
                        isWishlisted={wishlist.includes(p.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </div>
                </div>
              ) : selectedCategory !== 'All' || searchTerm !== '' ? (
                /* Flat searched or filtered list */
                filteredProducts.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Search className="w-12 h-12 text-slate-300 mb-2 mx-auto" />
                    <p className="text-slate-700 font-semibold text-sm">No matched results available</p>
                    <p className="text-xs text-slate-400 mt-1">Try tweaking category selections tags or keywords query fields.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-left">
                      <span className="text-xs font-mono text-slate-450 uppercase tracking-wide font-black">Matched results filter list ({filteredProducts.length} items)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 animate-in fade-in duration-250">
                      {filteredProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          currency={currency}
                          lang={lang}
                          onViewDetails={(item) => setDetailedProduct(item)}
                          onAddToCart={handleAddToCart}
                          isWishlisted={wishlist.includes(p.id)}
                          onToggleWishlist={handleToggleWishlist}
                        />
                      ))}
                    </div>
                  </div>
                )
              ) : (
                /* 5 Elegant Row Sections, each up to 2 rows (8 items) */
                <div className="space-y-12 text-left" id="storefront-category-sections">
                  {/* Category Section 1: Flash Deals */}
                  {filteredProducts.filter(p => p.isFlashDeal).length > 0 && (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                          <Zap className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" /> Flash Deals Runway ⚡
                        </h3>
                        <button onClick={() => setViewAllSection('flash')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer">
                          View All Deals <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {/* Slice is flat 8 items to fit exactly 2 rows of 4 on a standard desktop screen layout */}
                        {filteredProducts.filter(p => p.isFlashDeal).slice(0, 8).map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            currency={currency}
                            lang={lang}
                            onViewDetails={(item) => setDetailedProduct(item)}
                            onAddToCart={handleAddToCart}
                            isWishlisted={wishlist.includes(p.id)}
                            onToggleWishlist={handleToggleWishlist}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Section 2: New Arrivals */}
                  {filteredProducts.filter(p => p.isNewArrival).length > 0 && (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                          <RefreshCw className="w-4.5 h-4.5 text-indigo-600" /> New Arrivals Showcase ✨
                        </h3>
                        <button onClick={() => setViewAllSection('new')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer">
                          View All Arrivals <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {filteredProducts.filter(p => p.isNewArrival).slice(0, 8).map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            currency={currency}
                            lang={lang}
                            onViewDetails={(item) => setDetailedProduct(item)}
                            onAddToCart={handleAddToCart}
                            isWishlisted={wishlist.includes(p.id)}
                            onToggleWishlist={handleToggleWishlist}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Section 3: Featured Products */}
                  {filteredProducts.filter(p => p.isFeatured).length > 0 && (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                          <Star className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" /> Executive Featured Products ⭐
                        </h3>
                        <button onClick={() => setViewAllSection('featured')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer">
                          View All Featured <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {filteredProducts.filter(p => p.isFeatured).slice(0, 8).map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            currency={currency}
                            lang={lang}
                            onViewDetails={(item) => setDetailedProduct(item)}
                            onAddToCart={handleAddToCart}
                            isWishlisted={wishlist.includes(p.id)}
                            onToggleWishlist={handleToggleWishlist}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Section 4: Trending Now */}
                  {filteredProducts.filter(p => p.isTrending).length > 0 && (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                          <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500" /> Trending Now 🔥
                        </h3>
                        <button onClick={() => setViewAllSection('trending')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer">
                          View All Trending <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {filteredProducts.filter(p => p.isTrending).slice(0, 8).map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            currency={currency}
                            lang={lang}
                            onViewDetails={(item) => setDetailedProduct(item)}
                            onAddToCart={handleAddToCart}
                            isWishlisted={wishlist.includes(p.id)}
                            onToggleWishlist={handleToggleWishlist}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Section 5: Best Seller */}
                  {filteredProducts.filter(p => p.isBestSeller).length > 0 && (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                          <Trophy className="w-4.5 h-4.5 text-amber-500 fill-amber-500" /> Best Sellers Trophy Group 🏆
                        </h3>
                        <button onClick={() => setViewAllSection('best')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer">
                          View All Best <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {filteredProducts.filter(p => p.isBestSeller).slice(0, 8).map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            currency={currency}
                            lang={lang}
                            onViewDetails={(item) => setDetailedProduct(item)}
                            onAddToCart={handleAddToCart}
                            isWishlisted={wishlist.includes(p.id)}
                            onToggleWishlist={handleToggleWishlist}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* View 2: Multi-step checkout view */}
          {activeTab === 'checkout' && !lastCompletedOrderId && firebaseUser && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="checkout-panel-viewport"
            >
              <CheckoutView
                cartItems={cart}
                appliedCoupon={appliedCheckoutCoupon}
                currency={currency}
                lang={lang}
                onBackToCatalog={() => setActiveTab('catalog')}
                onOrderCompleted={(orderId) => {
                  setLastCompletedOrderId(orderId);
                  setCart([]); // Clear purchasing cart dynamically on success!
                  setAppliedCheckoutCoupon(undefined);
                }}
                userEmail={firebaseUser?.email || "boqorapps@gmail.com"}
                userId={firebaseUser?.id || "usr-customer-01"}
                userRole={firebaseUser?.role || "customer"}
              />
            </motion.div>
          )}

          {activeTab === 'checkout' && !lastCompletedOrderId && !firebaseUser && (
            <motion.div
              key="guarded-auth-checkout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto my-12 px-4 space-y-6 text-left"
              id="guarded-auth-panel"
            >
              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4.5 text-indigo-800 text-xs flex gap-3 items-start shadow-xs">
                <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-indigo-600 animate-pulse" />
                <div>
                  <p className="font-bold text-slate-855">Authorization Verification Required</p>
                  <p className="text-slate-500 mt-1 leading-relaxed">
                    Please authorize access utilizing your secure email credentials or the fast sandbox shortcuts below to load this professional portal view.
                  </p>
                </div>
              </div>
              <LoginView 
                lang={lang} 
                onLoginSuccess={(uid, email, displayName, role) => {
                  setFirebaseUser({ id: uid, email, name: displayName, role });
                  setSelectedRole(role);
                }} 
              />
            </motion.div>
          )}

          {/* Checkout success screen overlay card */}
          {lastCompletedOrderId && (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto my-16 bg-white rounded-xl p-8 border border-slate-200 text-center space-y-6 shadow-sm relative overflow-hidden"
              id="success-order-panel"
            >
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-emerald-505 bg-indigo-600"></div>
              <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
              
              <div className="space-y-2 text-left">
                <h2 className="text-center font-display font-extrabold text-lg text-slate-900">Purchase Fulfilled Successfully!</h2>
                <p className="text-center text-xs text-slate-500">Order securely registered to omnichannel dispatch pipeline center.</p>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 text-left text-xs font-mono">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-slate-400">Reference:</span>
                  <span className="text-slate-800 font-extrabold font-mono text-center">{lastCompletedOrderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Address info:</span>
                  <span className="text-slate-700 font-sans">Villa 14, Abu Dhabi</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => { setActiveTab('dashboard'); setLastCompletedOrderId(null); }}
                  className="w-full bg-indigo-600 text-white py-3 rounded text-xs font-extrabold uppercase hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Track Order progress <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setActiveTab('catalog'); setLastCompletedOrderId(null); }}
                  className="w-full bg-slate-100 border border-slate-250 text-slate-650 hover:bg-slate-200/80 hover:text-slate-900 py-3 rounded text-xs font-bold transition cursor-pointer"
                >
                  Continue shopping
                </button>
              </div>
            </motion.div>
          )}

          {/* View 3: Customer dynamic orders history dashboard */}
          {activeTab === 'dashboard' && firebaseUser && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CustomerDashboard
                currency={currency}
                lang={lang}
                userId={firebaseUser?.id || "usr-customer-01"}
              />
            </motion.div>
          )}

          {activeTab === 'dashboard' && !firebaseUser && (
            <motion.div
              key="guarded-auth-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto my-12 px-4 space-y-6 text-left"
              id="guarded-auth-panel"
            >
              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4.5 text-indigo-800 text-xs flex gap-3 items-start shadow-xs">
                <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-indigo-600 animate-pulse" />
                <div>
                  <p className="font-bold text-slate-855">Authorization Verification Required</p>
                  <p className="text-slate-500 mt-1 leading-relaxed">
                    Please authorize access utilizing your secure email credentials or the fast sandbox shortcuts below to load this professional portal view.
                  </p>
                </div>
              </div>
              <LoginView 
                lang={lang} 
                onLoginSuccess={(uid, email, displayName, role) => {
                  setFirebaseUser({ id: uid, email, name: displayName, role });
                  setSelectedRole(role);
                }} 
              />
            </motion.div>
          )}

          {/* View 4: Independent merchant sellers portal */}
          {activeTab === 'vendor' && firebaseUser && firebaseUser.role === 'vendor' && (
            <motion.div
              key="vendor-portal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VendorPortal
                userId={firebaseUser.id}
                userEmail={firebaseUser.email}
                userRole={firebaseUser.role}
                lang={lang}
                currentCurrency={currency}
              />
            </motion.div>
          )}

          {activeTab === 'vendor' && (!firebaseUser || firebaseUser.role !== 'vendor') && (
            <motion.div
              key="vendor-login-gate"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto my-12 px-4 space-y-6 text-left"
              id="guarded-vendor-panel"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4.5 text-amber-805 text-xs flex gap-3 items-start shadow-xs">
                <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold text-slate-850">Vendor Authentication Required</p>
                  <p className="text-slate-550 mt-1 leading-relaxed text-xs">
                    The vendor management workspace is strictly credential-guarded. Please sign in below using your authorized merchant Representative Email and secure Password token (e.g. sarah@globaltrader.com).
                  </p>
                </div>
              </div>
              <LoginView 
                lang={lang} 
                onLoginSuccess={(uid, email, displayName, role) => {
                  setFirebaseUser({ id: uid, email, name: displayName, role });
                  setSelectedRole(role);
                  setActiveTab('vendor');
                }} 
              />
              
              {/* Fast Sandbox Credentials references for easy mapping */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 text-[11px] text-slate-650 space-y-2.5">
                <span className="font-bold text-indigo-950 block uppercase tracking-wide text-[10px]">Merchant Account Presets (Sandbox Testing)</span>
                <p className="leading-relaxed">Use the default Representative credential for instant verification or configure custom seller passwords inside SuperAdmin:</p>
                <div className="bg-white p-3 rounded border border-indigo-105 space-y-1 font-mono text-slate-700">
                  <div className="flex justify-between text-xs">
                    <span>Representative Email:</span>
                    <span className="font-bold text-indigo-900 select-all">sarah@globaltrader.com</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5 mt-1">
                    <span>Security Password:</span>
                    <span className="font-bold text-indigo-900 select-all">sarahPass123</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  💡 If signed in as another session (like Administrator or Customer), you can sign out first or head to SuperAdmin &gt; Store Staff & Vendors to inspect/update any vendor representative credentials instantly.
                </p>
              </div>
            </motion.div>
          )}

          {/* View 5: Super administrative panel dashboard */}
          {activeTab === 'admin' && firebaseUser && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPortal
                userId={firebaseUser?.id || "usr-customer-01"}
                lang={lang}
                currency={currency}
              />
            </motion.div>
          )}

          {activeTab === 'admin' && !firebaseUser && (
            <motion.div
              key="guarded-auth-admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto my-12 px-4 space-y-6 text-left"
              id="guarded-auth-panel"
            >
              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4.5 text-indigo-805 text-xs flex gap-3 items-start shadow-xs">
                <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-indigo-600 animate-pulse" />
                <div>
                  <p className="font-bold text-slate-855">Authorization Verification Required</p>
                  <p className="text-slate-500 mt-1 leading-relaxed">
                    Please authorize access utilizing your secure email credentials or the fast sandbox shortcuts below to load this professional portal view.
                  </p>
                </div>
              </div>
              <LoginView 
                lang={lang} 
                onLoginSuccess={(uid, email, displayName, role) => {
                  setFirebaseUser({ id: uid, email, name: displayName, role });
                  setSelectedRole(role);
                }} 
              />
            </motion.div>
          )}

          {/* View 6: Guest-accessible Standalone Login Gate */}
          {activeTab === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto my-12 px-4"
              id="guest-login-portal-panel"
            >
              {firebaseUser ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center mx-auto text-lg font-bold">✓</div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Session Already Authorized</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You are currently authenticated as <span className="font-bold text-indigo-600">{firebaseUser.name}</span>. Feel free to explore catalog listings or manage orders.
                  </p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase transition"
                  >
                    Return to Catalog
                  </button>
                </div>
              ) : (
                <LoginView 
                  lang={lang} 
                  onLoginSuccess={(uid, email, displayName, role) => {
                    setFirebaseUser({ id: uid, email, name: displayName, role });
                    setSelectedRole(role);
                    setActiveTab(role === 'vendor' ? 'vendor' : role === 'superadmin' ? 'admin' : 'catalog');
                  }} 
                />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Shopping Cart Sliding Drawer element */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        currency={currency}
        lang={lang}
        onCheckout={(coupon) => {
          setAppliedCheckoutCoupon(coupon);
          setCartOpen(false);
          setActiveTab('checkout');
        }}
      />

      {/* Floating Sparkles Personal AI shopper Bot element */}
      <AIChatAgent
        products={products}
        onAddToCart={(p) => handleAddToCart(p, undefined, undefined, 1)}
        lang={lang}
        currency={currency}
      />

      {/* Product detailed modal specs view overlay */}
      {detailedProduct && (
        <ProductDetailsModal
          product={detailedProduct}
          isOpen={true}
          onClose={() => setDetailedProduct(null)}
          currency={currency}
          lang={lang}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Humble Footer, architectural compliance */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 text-center select-none shrink-0 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SuuqHub OmniChannel Smart Market Ecosystem & Admin Terminal. All credit actions authorized.</p>
          <div className="flex gap-4">
            <span className="hover:text-indigo-600 cursor-pointer transition">PCI-DSS Secure</span>
            <span>|</span>
            <span className="hover:text-indigo-600 cursor-pointer transition">W3C PWA Installable</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
