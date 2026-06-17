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
import PwaInstallModal from './components/PwaInstallModal';
import AllVendorsView from './components/AllVendorsView';

import { Product, CartItem, Coupon, UserRole, HeroCampaign } from './types';
import { initialProducts } from './initialData';
import { translations, formatPrice } from './utils';
import { LayoutGrid, Filter, Search, ShieldCheck, Download, AlertCircle, ShoppingBag, ArrowRight, Sparkles, ChevronLeft, ChevronRight, Zap, RefreshCw, Star, Flame, Trophy, X, ChevronDown } from 'lucide-react';
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
  const [vendors, setVendors] = useState<any[]>([]);
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
  const [categoriesList, setCategoriesList] = useState<string[]>(['All', 'Electronics', 'Fashion', 'Living', 'Beauty']);

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

  // Mobile drawer navigation state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Listen for user changes in Auth SDK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            let resolvedRole = data.role || 'customer';
            
            // Administrative & Logistics escalation check
            if (user.email?.toLowerCase() === 'boqorapps@gmail.com' && resolvedRole !== 'superadmin') {
              resolvedRole = 'superadmin';
              await setDoc(doc(db, 'users', user.uid), { role: 'superadmin' }, { merge: true });
            } else if (user.email?.toLowerCase() === 'delivery@suuqhub.com' && resolvedRole !== 'delivery_manager') {
              resolvedRole = 'delivery_manager';
              await setDoc(doc(db, 'users', user.uid), { role: 'delivery_manager' }, { merge: true });
            }

            setFirebaseUser({
              id: user.uid,
              email: user.email || '',
              name: data.name || user.displayName || 'Authorized User',
              role: resolvedRole
            });
            setSelectedRole(resolvedRole);
            if (resolvedRole === 'delivery_manager' || resolvedRole === 'superadmin') {
              setActiveTab('admin');
            } else if (resolvedRole === 'vendor') {
              setActiveTab('vendor');
            }
          } else {
            let actualRole = 'customer';
            const emailLower = (user.email || '').toLowerCase();
            if (emailLower === 'boqorapps@gmail.com') {
              actualRole = 'superadmin';
            } else if (emailLower === 'delivery@suuqhub.com') {
              actualRole = 'delivery_manager';
            } else {
              const savedRole = sessionStorage.getItem('pendingSignUpRole');
              if (savedRole) {
                actualRole = savedRole;
              }
            }

            const savedName = sessionStorage.getItem('pendingSignUpName');
            const userName = savedName || user.displayName || user.email?.split('@')[0] || 'Guest User';
            const savedPassword = sessionStorage.getItem('pendingSignUpPassword');

            const payload = {
              id: user.uid,
              email: user.email || '',
              name: userName,
              role: actualRole,
              language: lang,
              currency: currency,
              wishlist: [],
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), payload);
              
              // If the chosen role is 'vendor', auto-register as a pending merchant request in the backend API
              if (actualRole === 'vendor') {
                try {
                  await fetch('/api/vendors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      vendorName: `${userName}'s Storefront`,
                      representativeName: userName,
                      email: user.email || '',
                      category: "General",
                      description: "Pending manual administrative verification for third-party seller account.",
                      taxId: "PENDING-TRN",
                      status: "pending",
                      password: savedPassword || undefined
                    })
                  });
                  console.log("onAuthStateChanged: Successfully spawned pending vendor storefront for:", user.email);
                } catch (postErr) {
                  console.error("onAuthStateChanged: Vendor post registration error:", postErr);
                }
              }
            } catch (err) {
              console.warn("Could not auto-register redirect session in firestore database:", err);
            }

            // Cleanup session storage keys
            sessionStorage.removeItem('pendingSignUpRole');
            sessionStorage.removeItem('pendingSignUpName');
            sessionStorage.removeItem('pendingSignUpPassword');

            setFirebaseUser({
              id: user.uid,
              email: user.email || '',
              name: userName,
              role: actualRole as any
            });
            setSelectedRole(actualRole as any);
            if (actualRole === 'vendor') {
              setActiveTab('vendor');
            }
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

  // Sync apex_local_user credentials in localStorage with firebaseUser state
  useEffect(() => {
    if (firebaseUser) {
      localStorage.setItem('apex_local_user', JSON.stringify({
        id: firebaseUser.id,
        role: firebaseUser.role,
        email: firebaseUser.email
      }));
    } else {
      localStorage.removeItem('apex_local_user');
    }
  }, [firebaseUser]);

  // Redirect to all-vendors tab on startup if of any shared vendor link query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vendorId = params.get('vendor') || params.get('vendorId');
    if (vendorId) {
      setActiveTab('all-vendors');
    }
  }, []);

  // Load backend catalog lists on component mount
  useEffect(() => {
    fetchLiveCatalog();
  }, [activeTab, selectedRole]);

  const fetchLiveCatalog = async () => {
    try {
      // Fetch categories dynamically
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData)) {
            const rawNames = catData.map((c: any) => c.name);
            setCategoriesList(['All', ...rawNames]);
          }
        }
      } catch (catErr) {
        console.warn("Could not load dynamic categories on storefront:", catErr);
      }

      // Fetch only "approved" items for standard catalog, or all if we are on Admin views
      const queryParam = selectedRole === 'superadmin' ? '' : '?approval=approved';
      const [pRes, campRes, vRes] = await Promise.all([
        fetch(`/api/products${queryParam}`),
        fetch('/api/hero-campaigns'),
        fetch('/api/vendors')
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

      if (vRes.ok) {
        const contentType = vRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const vData = await vRes.json();
          if (Array.isArray(vData)) {
            setVendors(vData);
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
    const vendor = vendors.find(v => v.id === product.vendorId);
    if (vendor && vendor.isClosed) {
      alert(`Cannot add to cart: '${product.title}' is from '${vendor.vendorName}', which is temporarily closed.`);
      return;
    }

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

  // Direct mock/real install criteria prompt
  const [pwaModalOpen, setPwaModalOpen] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleSimulateInstall = () => {
    setPwaModalOpen(true);
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

  // Categories lists config (migrated to reactive state hook categoriesList)

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const renderActiveScreen = () => {
    if (lastCompletedOrderId) {
      return (
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
            <p className="text-center text-xs text-slate-500">Order securely registered to secure platform dispatch pipeline center.</p>
          </div>

          <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 text-left text-xs font-mono">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-400">Reference:</span>
              <span className="text-slate-800 font-extrabold font-mono text-center">{lastCompletedOrderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Address info:</span>
              <span className="text-slate-705 font-sans">Villa 14, Abu Dhabi</span>
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
      );
    }

    if (activeTab === 'catalog') {
      return (
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
                <h3 className="text-xs font-bold text-slate-800">Download SuuqHub (Smart Market Place) Web-App</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Works beautifully offline! Pin to your desktop dashboard with instantaneous launch speeds.</p>
              </div>
            </div>
            <button
              onClick={handleSimulateInstall}
              className="px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              Simulate PWA Install
            </button>
          </div>

          {/* Premium Redesigned Split-Screen Advertisement Slideshow */}
          {heroCampaigns.filter(c => c.status === 'approved').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-md h-auto md:h-[360px] group transition-all relative">
              
              {/* Left Column: Frosted/Dark Content Spotlight Panel */}
              <div className="col-span-12 md:col-span-5 p-6 sm:p-10 bg-slate-900 bg-gradient-to-br from-indigo-950 to-slate-900 text-white flex flex-col justify-center items-start text-left h-full relative z-10 border-r border-slate-850">
                <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest font-black mb-3 flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" /> Merchant Advert Spot
                </span>
                
                <h1 className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl text-white leading-tight mb-3">
                  {heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.title}
                </h1>
                
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-medium line-clamp-3">
                  {heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.subtitle || "Special customer selected products from SuuqHub verified partners."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      const productElement = document.getElementById('storefront-category-sections');
                      if (productElement) {
                        productElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }} 
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-lg shadow transition-all duration-200 active:scale-95 cursor-pointer text-center"
                  >
                    Claim Custom Offer
                  </button>
                  <span className="self-center px-3 py-1 text-[9.5px] bg-white/10 text-slate-300 rounded border border-white/15 shrink-0 font-mono">
                    Merchant: <b className="text-amber-400">{heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.vendorName}</b>
                  </span>
                </div>
              </div>

              {/* Right Column: 100% Shadowless Clear Crisp Full-Resolution Image */}
              <div className="col-span-12 md:col-span-7 bg-slate-50 relative h-[220px] sm:h-[280px] md:h-full overflow-hidden select-none">
                <img
                  src={heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.image}
                  alt={heroCampaigns.filter(c => c.status === 'approved')[currentSlide]?.title}
                  className="w-full h-full object-cover opacity-100 transition-all duration-700 block select-none"
                  referrerPolicy="no-referrer"
                />

                {/* Sliding controls toggles inside image panel with high contrast */}
                {heroCampaigns.filter(c => c.status === 'approved').length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentSlide(prev => (prev === 0 ? heroCampaigns.filter(c => c.status === 'approved').length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-800 shadow-md transition duration-200 cursor-pointer"
                      title="Previous Advert"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentSlide(prev => (prev === heroCampaigns.filter(c => c.status === 'approved').length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-800 shadow-md transition duration-200 cursor-pointer"
                      title="Next Advert"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Dot indicators positioned beautifully at the bottom center */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                      {heroCampaigns.filter(c => c.status === 'approved').map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'w-5 bg-indigo-600 border border-white' : 'w-1.5 bg-white shadow-xs border border-slate-350'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
            </div>
          ) : (
            /* Premium Redesigned Split-Screen Fallback Hero Showcase banner */
            <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-md h-auto md:h-[360px] relative">
              
              {/* Left Column Content Spot */}
              <div className="col-span-12 md:col-span-5 p-6 sm:p-10 bg-slate-900 bg-gradient-to-br from-indigo-950 to-slate-900 text-white flex flex-col justify-center items-start text-left h-full relative z-10 border-r border-slate-850">
                <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest font-black mb-3 flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Authorized SuuqHub Platform
                </span>
                
                <h1 className="font-display font-extrabold text-xl sm:text-2xl lg:text-3xl text-white leading-tight mb-3">
                  Sleek. Performance. <span className="text-amber-400">Smart Market Place</span> Ecosystem.
                </h1>
                
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                  Save instantly up to 10% utilizing voucher <span className="font-mono text-amber-400 font-extrabold bg-white/10 px-2 py-0.5 rounded border border-amber-500/30">SUUQ10</span> on checkouts. Premium multi-vendor catalogs.
                </p>

                <div>
                  <button 
                    onClick={() => setSelectedCategory('Electronics')} 
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-lg shadow transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Explore Electronics Catalog
                  </button>
                </div>
              </div>

              {/* Right Column: Beautiful, 100% Shadowless High Resolution Showcase Image */}
              <div className="col-span-12 md:col-span-7 bg-slate-100 relative h-[220px] sm:h-[280px] md:h-full overflow-hidden select-none">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80" 
                  alt="Premium Retail Experience"
                  className="w-full h-full object-cover opacity-100 block select-none" 
                  referrerPolicy="no-referrer"
                />
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
                    isVendorClosed={vendors.find(v => v.id === p.vendorId)?.isClosed}
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
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wide font-black">Matched results filter list ({filteredProducts.length} items)</span>
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
                      isVendorClosed={vendors.find(v => v.id === p.vendorId)?.isClosed}
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
                        isVendorClosed={vendors.find(v => v.id === p.vendorId)?.isClosed}
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
                        isVendorClosed={vendors.find(v => v.id === p.vendorId)?.isClosed}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Category Section 3: Executive Featured Products */}
              {filteredProducts.filter(p => p.isFeatured).length > 0 && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                      <Star className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" /> Executive Featured Products ⭐
                    </h3>
                    <button onClick={() => setViewAllSection('featured')} className="text-xs font-bold text-indigo-600 hover:text-indigo-705 hover:underline flex items-center gap-0.5 cursor-pointer">
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
                        isVendorClosed={vendors.find(v => v.id === p.vendorId)?.isClosed}
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
                        isVendorClosed={vendors.find(v => v.id === p.vendorId)?.isClosed}
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
                        isVendorClosed={vendors.find(v => v.id === p.vendorId)?.isClosed}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      );
    }

    if (activeTab === 'checkout') {
      if (firebaseUser) {
        return (
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
        );
      } else {
        return (
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
                if (role === 'delivery_manager' || role === 'superadmin') {
                  setActiveTab('admin');
                }
              }} 
            />
          </motion.div>
        );
      }
    }

    if (activeTab === 'dashboard') {
      if (firebaseUser) {
        return (
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
              userName={firebaseUser?.name || "Guest Account"}
              userEmail={firebaseUser?.email || "boqorapps@gmail.com"}
            />
          </motion.div>
        );
      } else {
        return (
          <motion.div
            key="guarded-auth-dashboard"
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
                if (role === 'delivery_manager' || role === 'superadmin') {
                  setActiveTab('admin');
                }
              }} 
            />
          </motion.div>
        );
      }
    }

    if (activeTab === 'vendor') {
      if (firebaseUser && (firebaseUser.role === 'vendor' || firebaseUser.role === 'order_manager' || firebaseUser.role === 'general_vendor_user')) {
        return (
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
              onVendorUpdated={fetchLiveCatalog}
            />
          </motion.div>
        );
      } else {
        return (
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
            
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 text-[11px] text-slate-650 space-y-2.5">
              <span className="font-bold text-indigo-955 block uppercase tracking-wide text-[10px]">Merchant Account Presets (Sandbox Testing)</span>
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
        );
      }
    }

    if (activeTab === 'admin') {
      if (firebaseUser && (firebaseUser.role === 'superadmin' || firebaseUser.role === 'delivery_manager')) {
        return (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminPortal
              userId={firebaseUser?.id || "usr-customer-01"}
              userRole={firebaseUser?.role}
              lang={lang}
              currency={currency}
            />
          </motion.div>
        );
      } else {
        return (
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
                <p className="text-slate-550 mt-1 leading-relaxed text-xs">
                  Administrative & Logistics operations are strictly credential-guarded. Please authorize access below using authorized credentials.
                </p>
              </div>
            </div>
            <LoginView 
              lang={lang} 
              onLoginSuccess={(uid, email, displayName, role) => {
                setFirebaseUser({ id: uid, email, name: displayName, role });
                setSelectedRole(role);
                if (role === 'delivery_manager' || role === 'superadmin') {
                  setActiveTab('admin');
                }
              }} 
            />
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 text-[11px] text-slate-655 space-y-2.5 animate-fadeIn">
              <span className="font-bold text-indigo-955 block uppercase tracking-wide text-[10px]">Logistics & Admin Sandbox Presets</span>
              <p className="leading-relaxed font-sans">For instant validation without running a manual SuperAdmin registration, utilize these authorized profiles:</p>
              <div className="bg-white p-3 rounded border border-indigo-105 space-y-2 font-mono text-slate-700">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">🔒 Courier & Delivery Partner:</span>
                  <div className="flex justify-between text-xs">
                    <span>Email Address:</span>
                    <span className="font-bold text-slate-900 select-all">delivery@suuqhub.com</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Password Token:</span>
                    <span className="font-bold text-slate-900 select-all">123abc123</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-sans mt-0.5">
                    <span>Alternative Preset:</span>
                    <span className="select-all">manaal@gmail.com</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7ebd24] tracking-wider">👑 Platform Superadmin:</span>
                  <div className="flex justify-between text-xs">
                    <span>Email Address:</span>
                    <span className="font-bold text-slate-900 select-all">boqorapps@gmail.com</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Password Token:</span>
                    <span className="font-bold text-slate-900 select-all">tripleA@123</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
    }

    if (activeTab === 'login') {
      return (
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
                setActiveTab(role === 'vendor' ? 'vendor' : (role === 'superadmin' || role === 'delivery_manager') ? 'admin' : 'catalog');
              }} 
            />
          )}
        </motion.div>
      );
    }

    if (activeTab === 'all-vendors') {
      return (
        <AllVendorsView
          vendors={vendors}
          products={products}
          currency={currency}
          onProductClick={(p) => setDetailedProduct(p)}
          onAddToCart={handleAddToCart}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          lang={lang}
          cart={cart}
        />
      );
    }

    return null;
  };

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
        categoriesList={categoriesList}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        setViewAllSection={setViewAllSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={firebaseUser ? () => {
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

      {/* Premium Full-Width Mobile Dropdown Menu Drawer (Directly anchors below headers) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-16 sm:top-20 z-50 lg:hidden flex flex-col md:px-0">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs top-16 sm:top-20 pointer-events-auto"
            />
            
            {/* Dropdown Container */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full bg-white border-b border-slate-200 shadow-2xl overflow-y-auto max-h-[80vh] flex flex-col z-50 pointer-events-auto"
            >
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                
                {/* Column 1: Directory & Quick Links */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-sans font-black tracking-wider text-[#0f5132] uppercase">
                      🧭 Quick Directory
                    </span>
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Home */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('catalog');
                        setSelectedCategory('All');
                        setViewAllSection(null);
                        setSearchTerm('');
                        setMobileMenuOpen(false);
                      }}
                      className={`p-3 rounded-xl text-left font-bold text-xs flex items-center justify-between border transition cursor-pointer ${activeTab === 'catalog' && (!searchTerm || searchTerm !== 'Pro') && (!selectedCategory || selectedCategory === 'All') ? 'bg-[#0f5132]/5 text-[#0f5132] border-[#0f5132]/20 font-black' : 'border-slate-100 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <span>🏠 Home</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>

                    {/* Brand */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('catalog');
                        setSearchTerm('Pro');
                        setMobileMenuOpen(false);
                      }}
                      className={`p-3 rounded-xl text-left font-bold text-xs flex items-center justify-between border transition cursor-pointer ${activeTab === 'catalog' && searchTerm === 'Pro' ? 'bg-[#0f5132]/5 text-[#0f5132] border-[#0f5132]/20 font-black' : 'border-slate-100 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <span>🔥 Brand</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>

                    {/* Offers */}
                    <button
                      type="button"
                      onClick={() => {
                        setViewAllSection('flash');
                        setActiveTab('catalog');
                        setMobileMenuOpen(false);
                      }}
                      className="p-3 rounded-xl text-left border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span>🎁 Offers</span>
                      <span className="bg-[#7ebd24]/10 text-[#0f5132] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded animate-pulse">SAVE</span>
                    </button>

                    {/* All Vendors */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('all-vendors');
                        setMobileMenuOpen(false);
                      }}
                      className={`p-3 rounded-xl text-left font-bold text-xs flex items-center justify-between border transition cursor-pointer ${activeTab === 'all-vendors' ? 'bg-[#0f5132]/5 text-[#0f5132] border-[#0f5132]/20 font-black' : 'border-slate-100 hover:bg-slate-50 text-slate-700'}`}
                    >
                      <span>🏬 All Vendors</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>
                  </div>

                  {/* Somali literature banner bar */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Literature');
                      setActiveTab('catalog');
                      setViewAllSection(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left font-bold text-xs flex items-center justify-between border transition cursor-pointer ${selectedCategory === 'Literature' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-indigo-100 hover:bg-slate-50 bg-indigo-50/20 text-indigo-900'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>📚</span> 
                      <span> Somali Publication House</span>
                    </span>
                    <span className="bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">HQ</span>
                  </button>

                  {/* Vendor zone utilities */}
                  <div className="bg-slate-55 rounded-xl p-3.5 space-y-2 border border-slate-100">
                    <span className="text-[10px] font-mono font-black text-slate-400 block uppercase tracking-wider">
                      💼 Vendor Zone
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('login');
                          setMobileMenuOpen(false);
                        }}
                        className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-left text-[11px] font-bold text-emerald-800 transition block cursor-pointer"
                      >
                        🤝 Become Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('vendor');
                          setMobileMenuOpen(false);
                        }}
                        className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-left text-[11px] font-bold text-indigo-700 transition block cursor-pointer"
                      >
                        🔑 Vendor Login
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: Categories and Switchers */}
                <div className="pt-5 sm:pt-0 sm:pl-6 space-y-4">
                  <span className="text-[11px] font-sans font-black tracking-wider text-[#0f5132] uppercase block">
                    📁 Browse Collections
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setViewAllSection(null);
                          setActiveTab('catalog');
                          setMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 text-xs text-left rounded-lg transition font-bold flex justify-between items-center cursor-pointer ${selectedCategory === cat ? 'text-[#0f5132] bg-[#0f5132]/5 font-black' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>{cat === 'All' ? 'All Collections' : cat}</span>
                        {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-[#7ebd24]"></span>}
                      </button>
                    ))}
                  </div>

                  {/* Quick localization switchers to bring high touch target access */}
                  <div className="border-t border-slate-100 pt-4 flex gap-4">
                    <div className="flex-1">
                      <span className="text-[9px] font-mono text-slate-400 uppercase font-black block mb-1">Language</span>
                      <div className="flex rounded-lg bg-slate-100 p-0.5">
                        {(['en', 'ar', 'es'] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLang(l)}
                            className={`flex-1 text-center py-1 text-[10px] font-bold uppercase rounded-md transition cursor-pointer ${lang === l ? 'bg-white shadow text-[#0f5132]' : 'text-slate-500 hover:text-slate-900'}`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-mono text-slate-400 uppercase font-black block mb-1">Currency</span>
                      <div className="flex rounded-lg bg-slate-100 p-0.5">
                        {(['USD', 'EUR', 'AED'] as const).map((curr) => (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => setCurrency(curr)}
                            className={`flex-1 text-center py-1 text-[10px] font-bold uppercase rounded-md transition cursor-pointer ${currency === curr ? 'bg-white shadow text-[#0f5132]' : 'text-slate-500 hover:text-slate-900'}`}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Backing Footer info */}
              <div className="bg-[#0f5132]/5 py-3.5 px-4 text-center border-t border-slate-100 text-[10px] font-semibold text-[#0f5132]/80 font-sans flex justify-between items-center">
                <span>© Somali Multi-Vendor Portal</span>
                <span className="font-mono text-[9px] bg-white px-2 py-0.5 rounded border border-slate-200">SuuqHub Global v1.2</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Green Sub-navigation ribbon bar - MATCHING IMAGE 1 */}
      <div className="bg-[#0f5132] text-white select-none whitespace-nowrap border-t border-[#0c3e26]/30 shadow-sm relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-12">
          {/* Left Category Selector dropdown trigger */}
          <div className="relative group/cat h-full flex items-center">
            <button className="flex items-center gap-2 px-5 py-3.5 bg-[#0c3e26] hover:bg-[#051e12] font-sans font-extrabold text-[12px] uppercase tracking-wider transition cursor-pointer h-full border-r border-[#0a331f]/40">
              <LayoutGrid className="w-4 h-4 text-[#7ebd24]" />
              <span>Categories</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-90 text-white/70" />
            </button>
            {/* Dropdown list */}
            <div className="absolute top-full left-0 w-52 bg-white text-slate-800 rounded-b-lg border border-slate-200 shadow-xl opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-150 py-1.5 z-50 text-left font-semibold text-xs divide-y divide-slate-50">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setViewAllSection(null);
                    setActiveTab('catalog');
                  }}
                  className="w-full text-left px-5 py-2.5 hover:bg-slate-50 hover:text-slate-900 transition flex justify-between items-center cursor-pointer text-xs"
                >
                  <span className="font-sans font-bold text-slate-700">{cat === 'All' ? 'All Collections' : cat}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Nav links EXACTLY matching Image 1 */}
          <div className="flex items-center gap-1 sm:gap-2 flex-nowrap shrink-0 overflow-x-auto h-full scrollbar-none font-sans font-extrabold text-[12.5px] tracking-wide">
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedCategory('All'); setViewAllSection(null); setSearchTerm(''); }} 
              className="px-4 h-full flex items-center hover:bg-white/10 hover:text-[#7ebd24] transition cursor-pointer"
            >
              Home
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSearchTerm('Pro'); }} 
              className="px-4 h-full flex items-center hover:bg-white/10 hover:text-[#7ebd24] transition cursor-pointer"
            >
              Brand
            </button>
            <button 
              onClick={() => { setViewAllSection('flash'); setActiveTab('catalog'); }} 
              className="px-4 h-full flex items-center hover:bg-white/10 hover:text-[#7ebd24] transition cursor-pointer gap-1"
            >
              Offers
              <ChevronRight className="w-3 h-3 rotate-90 text-white/50" />
            </button>
            <button 
              onClick={() => { setSelectedCategory('Literature'); setActiveTab('catalog'); setViewAllSection(null); }} 
              className="px-4 h-full flex items-center hover:bg-white/10 hover:text-[#7ebd24] transition cursor-pointer"
            >
              Publication House
            </button>
            <button 
              onClick={() => { setActiveTab('all-vendors'); }} 
              className={`px-4.5 h-full flex items-center transition cursor-pointer ${activeTab === 'all-vendors' ? 'bg-[#0c3e26] text-[#7ebd24] border-b-3 border-[#7ebd24]' : 'hover:bg-white/10 hover:text-[#7ebd24]'}`}
            >
              All Vendors
            </button>
            
            {/* Vendor Zone dropdown */}
            <div className="relative group/vz h-full flex items-center">
              <button className="px-4 h-full flex items-center hover:bg-white/10 hover:text-[#7ebd24] gap-1 transition cursor-pointer">
                Vendor Zone
                <ChevronRight className="w-3 h-3 rotate-90 text-white/50" />
              </button>
              {/* Dropdown list */}
              <div className="absolute top-full right-0 w-48 bg-white text-slate-800 rounded-b-lg border border-slate-200 shadow-xl opacity-0 invisible group-hover/vz:opacity-100 group-hover/vz:visible transition-all duration-150 py-1.5 z-50 text-left font-bold text-xs animate-in slide-in-from-top-1">
                <button 
                  onClick={() => { setActiveTab('login'); }} 
                  className="w-full text-left px-5 py-2.5 hover:bg-slate-50 hover:text-[#0f5132] transition cursor-pointer flex items-center gap-2 text-emerald-800 text-xs font-bold border-b border-slate-100"
                >
                  🤝 1. Become a Vendor
                </button>
                <button 
                  onClick={() => { setActiveTab('vendor'); }} 
                  className="w-full text-left px-5 py-2.5 hover:bg-slate-50 hover:text-indigo-700 transition cursor-pointer flex items-center gap-2 text-indigo-700 text-xs font-bold"
                >
                  🔑 2. Login as a Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container contents */}
      <main className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          {renderActiveScreen()}
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
          // Check if any cart item has a closed vendor
          for (const item of cart) {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
              const vendor = vendors.find(v => v.id === prod.vendorId);
              if (vendor && vendor.isClosed) {
                alert(`Cannot checkout: '${prod.title}' is from '${vendor.vendorName}', which is temporarily closed.`);
                return;
              }
            }
          }
          setAppliedCheckoutCoupon(coupon);
          setCartOpen(false);
          setActiveTab('checkout');
        }}
        products={products}
        vendors={vendors}
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
          isVendorClosed={vendors.find(v => v.id === detailedProduct.vendorId)?.isClosed}
        />
      )}

      {/* PWA Simulation installer popup wrapper */}
      <PwaInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        appName="SuuqHub (Smart Market Place)"
        deferredPrompt={deferredPrompt}
        setDeferredPrompt={setDeferredPrompt}
        isInIframe={isInIframe}
      />

      {/* Humble Footer, architectural compliance */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 text-center select-none shrink-0 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SuuqHub (Smart Market Place) Smart Market Ecosystem & Admin Terminal. All credit actions authorized.</p>
          <div className="flex gap-4">
            <span className="hover:text-indigo-600 cursor-pointer transition">SSL Secured Connection</span>
            <span>|</span>
            <span className="hover:text-indigo-600 cursor-pointer transition">W3C PWA Installable</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
