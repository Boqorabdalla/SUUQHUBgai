/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, Star, Store, MapPin, Mail, MessageCircle, 
  Tag, ShoppingCart, ArrowLeft, Heart, BadgeCheck, Bell, Shield,
  ChevronRight, Sparkles, AlertCircle, Eye, Share2, Check, Phone
} from 'lucide-react';
import { Product, Vendor, Coupon } from '../types';
import { formatPrice } from '../utils';

interface AllVendorsViewProps {
  vendors: Vendor[];
  products: Product[];
  currency: 'USD' | 'EUR' | 'AED';
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product, color?: string, size?: string, qty?: number) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  lang: 'en' | 'ar' | 'es';
}

export default function AllVendorsView({
  vendors,
  products,
  currency,
  onProductClick,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  lang
}: AllVendorsViewProps) {
  const renderLogo = (logoUrl?: string, name?: string, sizeClass: string = "w-full h-full object-cover") => {
    const isImage = logoUrl && (logoUrl.startsWith('data:image/') || logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('/'));
    if (isImage) {
      return <img src={logoUrl} alt={name || "Vendor logo"} className={sizeClass} referrerPolicy="no-referrer" />;
    }
    return <span>{logoUrl || (name ? name[0] : 'S')}</span>;
  };

  // Navigation inside Vendors section
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronize URL query parameter with selection of vendor
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlVendorId = params.get('vendor') || params.get('vendorId');
    if (urlVendorId) {
      if (!selectedVendor || selectedVendor.id !== urlVendorId) {
        const found = vendors.find(v => v.id === urlVendorId && v.status === 'approved');
        if (found) {
          setSelectedVendor(found);
        }
      }
    } else {
      if (selectedVendor) {
        setSelectedVendor(null);
      }
    }
  }, [vendors]);

  // Sync state selection back to browser history state query params
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlVendorId = params.get('vendor') || params.get('vendorId');
    if (selectedVendor) {
      if (urlVendorId !== selectedVendor.id) {
        params.set('vendor', selectedVendor.id);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }
    } else {
      if (urlVendorId) {
        params.delete('vendor');
        params.delete('vendorId');
        const searchStr = params.toString();
        const finalUrl = searchStr ? `${window.location.pathname}?${searchStr}` : window.location.pathname;
        window.history.replaceState({}, '', finalUrl);
      }
    }
  }, [selectedVendor]);
  
  // Search and filter inside specific vendor storefront
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedStoreCategory, setSelectedStoreCategory] = useState('All');
  
  // Interactive mini features
  const [followingVendors, setFollowingVendors] = useState<Record<string, boolean>>({});
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'vendor', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState<string | null>(null);

  // Filter vendors list
  const approvedVendors = vendors.filter(v => v.status === 'approved');

  // Handle message simulate typing
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    
    const userMsg = contactMessage.trim();
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);
    setContactMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const vendorReplies = [
        "Hello! Thanks for reaching out to us. We received your message and we'll respond within 2 hours.",
        "Hi! Glad you liked our products. Let us know if you need help choosing the right size or specifications.",
        "Greetings! We offer fast packaging within 24 hours. Let us know if you want us to write a custom gift card for your order."
      ];
      const randomReply = vendorReplies[Math.floor(Math.random() * vendorReplies.length)];
      setChatLog(prev => [...prev, { sender: 'vendor', text: randomReply }]);
    }, 1500);
  };

  // Triggered when a coupon is clicked
  const handleClaimCoupon = (code: string) => {
    setClaimedVoucher(code);
    setTimeout(() => {
      setClaimedVoucher(null);
      alert(`Voucher [${code}] claimed successfully. Use code SUUQ10 at Checkout for 10% off!`);
    }, 1000);
  };

  // Renders individual stars
  const renderStars = (rating: number) => {
    const stars = [];
    const absoluteVal = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(absoluteVal)) {
        stars.push(<Star key={i} className="w-4.5 h-4.5 text-amber-400 fill-amber-400 shrink-0" />);
      } else if (i - 0.5 === absoluteVal) {
        stars.push(<Star key={i} className="w-4.5 h-4.5 text-amber-400 fill-amber-400 opacity-50 shrink-0" />);
      } else {
        stars.push(<Star key={i} className="w-4.5 h-4.5 text-slate-200 fill-none shrink-0" />);
      }
    }
    return stars;
  };

  if (selectedVendor) {
    // Collect products belonging to this vendor
    const vendorProducts = products.filter(p => p.vendorId === selectedVendor.id && p.isActive && p.isApproved);
    
    // Extract unique categories for this vendor's products
    const storeCategories = ['All', ...Array.from(new Set(vendorProducts.map(p => p.category)))];

    // Filter within store
    let filteredStoreProducts = vendorProducts;
    if (selectedStoreCategory !== 'All') {
      filteredStoreProducts = filteredStoreProducts.filter(p => p.category === selectedStoreCategory);
    }
    if (storeSearch.trim()) {
      const q = storeSearch.toLowerCase();
      filteredStoreProducts = filteredStoreProducts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    const isFollowing = !!followingVendors[selectedVendor.id];

    const todayStr = new Date().toISOString().substring(0, 10);
    const hasClearanceCampaign = !!(
      selectedVendor.clearanceActive && 
      selectedVendor.clearanceRate && 
      selectedVendor.clearanceStartDate && 
      selectedVendor.clearanceEndDate &&
      todayStr >= selectedVendor.clearanceStartDate && 
      todayStr <= selectedVendor.clearanceEndDate
    );

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 text-left animate-in fade-in duration-200" id="vendor-storefront-panel">
        
        {/* Back and Breadcrumb line */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { setSelectedVendor(null); setStoreSearch(''); setSelectedStoreCategory('All'); }} 
            className="group cursor-pointer px-4 py-2 bg-white hover:bg-slate-100 text-slate-705 border border-slate-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition duration-150 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3] group-hover:-translate-x-0.5 transition" /> 
            Back to Stores
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
            <span>STORES</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[#0f5132] uppercase">{selectedVendor.vendorName}</span>
          </div>
        </div>

        {/* Brand Showcase Header Block - MATCHING IMAGE 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md">
          {/* Cover Banner */}
          <div className="h-40 sm:h-56 bg-slate-105 relative select-none">
            <img 
              src={selectedVendor.banner || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"}
              alt={selectedVendor.vendorName}
              className="w-full h-full object-cover opacity-85"
              referrerPolicy="no-referrer"
            />
            {/* Absolute gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
            {/* Store title layout overlay */}
            <div className="absolute bottom-4 left-6 sm:left-8 flex items-baseline gap-2">
              <h1 className="text-white font-sans font-black text-2xl sm:text-3.5xl drop-shadow-md">
                {selectedVendor.vendorName}
              </h1>
              {selectedVendor.isClosed ? (
                <span className="px-2.5 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-full uppercase tracking-wider shadow-sm animate-pulse">Closed Now</span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-[9px] rounded-full uppercase tracking-wider shadow-sm">Open Now</span>
              )}
            </div>
          </div>

          {/* Clearance Sale Promo Badge */}
          {hasClearanceCampaign && (
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-700 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-rose-100/15 animate-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-4 text-left">
                <div className="bg-white text-rose-650 text-red-650 text-red-600 font-extrabold px-3 py-1.5 rounded-xl text-xl sm:text-2xl font-mono flex flex-col items-center leading-none shadow-md shrink-0 select-none">
                  <span>{selectedVendor.clearanceRate}%</span>
                  <span className="text-[8px] uppercase tracking-widest font-black mt-0.5">OFF</span>
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 bg-white/20 text-[9px] uppercase tracking-widest font-mono font-black rounded mb-0.5 leading-none">
                    ⚡ STORE-WIDE CLEARANCE SALE ACTIVE
                  </span>
                  <h3 className="text-xs font-sans font-black tracking-tight leading-normal">
                    Massive clearance markdown automatically applied to all {selectedVendor.vendorName} products!
                  </h3>
                  <p className="text-[10px] text-white/85 leading-none mt-0.5">
                    Clearance run schedule: <strong className="font-mono bg-black/15 px-1 rounded">{selectedVendor.clearanceStartDate}</strong> to <strong className="font-mono bg-black/15 px-1 rounded">{selectedVendor.clearanceEndDate}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-white/10 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider select-none border border-white/10">
                ⏱️ Runs active
              </div>
            </div>
          )}

          {/* Under Banner details and status bar */}
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
            {/* Brand icon and info row */}
            <div className="flex gap-4 sm:gap-6 items-start">
              {/* Circular Logo overlapping or prominent */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[#0f5132] to-[#7ebd24] text-white flex items-center justify-center font-display font-black text-2xl sm:text-3xl border-4 border-white shadow-md relative -mt-14 sm:-mt-16 z-10 shrink-0 select-none overflow-hidden">
                {renderLogo(selectedVendor.logo, selectedVendor.vendorName, "w-full h-full object-cover rounded-md")}
              </div>

              {/* Vendor Title content */}
              <div className="space-y-1.5 pt-1.5 md:pt-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-850 font-sans">{selectedVendor.vendorName}</h2>
                  <span className="text-[10px] font-mono font-black tracking-wider uppercase bg-[#0f5132]/10 text-[#0f5132] px-2 py-0.5 rounded-full border border-[#0f5132]/15 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 fill-[#0f5132] text-white" /> Authorized
                  </span>
                </div>
                
                {/* Information statistics row */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 items-center text-xs text-slate-550 font-sans">
                  {/* Rating block */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5 mr-1">
                      {renderStars(selectedVendor.rating || 0)}
                    </div>
                    <span className="font-bold text-slate-800">{selectedVendor.rating?.toFixed(1) || "0.0"}</span>
                    <span className="text-slate-400">({selectedVendor.reviewsCount || 0} reviews)</span>
                  </div>
                  
                  <span className="hidden sm:inline text-slate-300">•</span>
                  
                  {/* Products rating */}
                  <div>
                    <span className="font-bold text-slate-805 mr-1">{vendorProducts.length}</span>
                    <span className="text-slate-500">Products</span>
                  </div>

                  <span className="hidden sm:inline text-slate-300">•</span>

                  {/* Orders matching */}
                  <div>
                    <span className="font-bold text-slate-805 mr-1">{selectedVendor.ordersCount || 10}</span>
                    <span className="text-slate-500">Orders</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-sans leading-relaxed pt-1 max-w-xl">
                  {selectedVendor.description}
                </p>
              </div>
            </div>

            {/* Micro Action Controls */}
            <div className="flex flex-wrap gap-2.5 items-center shrink-0">
              {/* Share Shop Link Button */}
              <button 
                onClick={() => {
                  const shopUrl = `${window.location.origin}${window.location.pathname}?vendor=${selectedVendor.id}`;
                  navigator.clipboard.writeText(shopUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="cursor-pointer px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 text-indigo-700 rounded-lg flex items-center justify-center transition duration-150 relative text-xs font-bold"
                title="Copy share link of this shop storefront"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600 mr-1.5" /> : <Share2 className="w-4 h-4 mr-1.5 text-indigo-600" />}
                <span>{copiedLink ? 'Copied Link' : 'Share Shop'}</span>
              </button>

              {/* WhatsApp direct dial */}
              {selectedVendor.whatsapp && (
                <a 
                  href={`https://wa.me/${selectedVendor.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-800 rounded-lg flex items-center justify-center transition duration-150 text-xs font-bold"
                  title="Chat directly with vendor on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-500 mr-1.5" />
                  <span>WhatsApp Us</span>
                </a>
              )}

              {/* Direct call represent */}
              {selectedVendor.callContact && (
                <a 
                  href={`tel:${selectedVendor.callContact}`}
                  className="px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200/50 text-sky-800 rounded-lg flex items-center justify-center transition duration-150 text-xs font-bold"
                  title="Make a direct phone call to store coordinator"
                >
                  <Phone className="w-3.5 h-3.5 text-sky-650 mr-1.5" />
                  <span>Call Us ({selectedVendor.callContact})</span>
                </a>
              )}

              {/* Contact Representative chat log simulator button */}
              <button 
                onClick={() => { setShowContactModal(true); setChatLog([{ sender: 'vendor', text: `Welcome to ${selectedVendor.vendorName}! Let us know if you have any questions.` }]); }}
                className="cursor-pointer p-2.5 bg-slate-100 hover:bg-slate-200/85 hover:text-slate-900 border border-slate-205 text-slate-700 rounded-lg flex items-center justify-center transition duration-150 relative"
                title="Send active chat query"
              >
                <MessageCircle className="w-4.5 h-4.5" />
              </button>

              {/* Vouchers Claiming Trigger */}
              <button 
                onClick={() => handleClaimCoupon('SUUQ10')}
                className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800 px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-amber-200/40"
              >
                <Tag className="w-4 h-4 text-amber-600" />
                Claim Store Voucher
              </button>

              {/* Follow Store Button */}
              <button 
                onClick={() => setFollowingVendors(prev => ({ ...prev, [selectedVendor.id]: !isFollowing }))}
                className={`cursor-pointer px-5 py-2.5 rounded-lg text-xs font-extrabold tracking-wide uppercase transition duration-150 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${isFollowing ? 'bg-slate-150 border border-slate-300 text-slate-600' : 'bg-[#0f5132] hover:bg-[#0c3e26] text-white'}`}
              >
                <Bell className="w-3.5 h-3.5" />
                {isFollowing ? 'Following' : 'Follow Store'}
              </button>
            </div>
          </div>
        </div>

        {/* Storefront Products Search & Categories bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Categories Tab selectors */}
          <div className="col-span-12 md:col-span-8 flex flex-wrap gap-2">
            {storeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedStoreCategory(cat)}
                className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold uppercase transition tracking-wider ${selectedStoreCategory === cat ? 'bg-[#0f5132] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {cat === 'All' ? 'All Products' : cat}
              </button>
            ))}
          </div>

          {/* Search within this specific seller filter */}
          <div className="col-span-12 md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text"
              placeholder={`Search in this store...`}
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f5132]/30 transition-all font-sans"
            />
          </div>
        </div>

        {/* Products Core Grid */}
        {filteredStoreProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredStoreProducts.map((p) => {
              const isFav = wishlist.includes(p.id);
              return (
                <div 
                  key={p.id}
                  className="bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative"
                  id={`store-prod-${p.id}`}
                >
                  {/* Top image wrapper */}
                  <div className="h-48 bg-slate-50 relative overflow-hidden select-none">
                    <img 
                      src={p.image} 
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                      referrerPolicy="no-referrer"
                    />

                    {/* Quick Add to Wishlist Overlay */}
                    <button
                      onClick={() => onToggleWishlist(p.id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition shadow-sm cursor-pointer active:scale-90"
                      title={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                    
                    {/* Tiny Category Overlay Tag */}
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/60 text-white font-mono text-[9px] uppercase tracking-wide rounded font-bold">
                      {p.subcategory || p.category}
                    </span>
                  </div>

                  {/* Body Content element */}
                  <div className="p-4.5 text-left flex-1 flex flex-col justify-between space-y-3 pt-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono leading-none">
                        <span className="font-bold">{p.brand}</span>
                        <span>•</span>
                        <span>SKU: {p.sku}</span>
                      </div>
                      <h4 
                        onClick={() => onProductClick(p)}
                        className="text-gray-905 font-bold font-sans text-xs line-clamp-2 hover:text-[#0f5132] cursor-pointer transition"
                      >
                        {p.title}
                      </h4>
                    </div>

                    {/* Pricing, review & Action bar */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-850 font-sans tracking-tight">
                          {formatPrice(p.price, currency)}
                        </span>
                        {p.discountPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatPrice(p.discountPrice, currency)}
                          </span>
                        )}
                      </div>

                      {/* Floating Add to Cart circle button */}
                      <button
                        onClick={() => onAddToCart(p)}
                        className="w-8 h-8 rounded-full bg-[#0f5132] hover:bg-[#0c3e26] text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow active:scale-95 shrink-0"
                        title="Add Item to Cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3.5 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-450 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold font-sans text-xs text-slate-800">No Matching Items Found</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">There are currently no items matching your criteria under this storefront catalogue. Reset keyword searches to explore standard collections.</p>
            </div>
            <button 
              onClick={() => { setStoreSearch(''); setSelectedStoreCategory('All'); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200/90 text-slate-700 rounded-lg font-bold text-xs transition cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        )}

        {/* Simulated Messaging Drawer Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-md flex flex-col h-[420px] animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 bg-[#0f5132] text-white flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 text-white flex items-center justify-center font-bold font-sans overflow-hidden">
                    {renderLogo(selectedVendor.logo, selectedVendor.vendorName, "w-full h-full object-cover rounded-sm")}
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold">{selectedVendor.vendorName}</h4>
                    <span className="text-[9px] text-[#7ebd24] font-bold block">Representative Online</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition cursor-pointer font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Chat panel */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
                {chatLog.map((chat, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-xl px-3.5 py-2 leading-relaxed font-sans ${chat.sender === 'user' ? 'bg-[#0f5132] text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-850 rounded-bl-none'}`}
                    >
                      {chat.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-400 font-medium italic animate-pulse">
                      {selectedVendor.vendorName} rep is typing...
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-150 bg-white flex gap-2">
                <input 
                  type="text"
                  placeholder="Type your message..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-[#0f5132] transition"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#0f5132] hover:bg-[#0c3e26] text-white rounded-lg text-xs font-extrabold transition cursor-pointer active:scale-95"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Display ALL STORES view (matching Image 1)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 text-left animate-in fade-in duration-200" id="all-stores-panel">
      
      {/* Visual Title Banner section */}
      <div className="flex flex-col gap-1 text-left border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-sans font-black uppercase text-[#0f5132] tracking-normal flex items-center gap-2">
          <Store className="w-6 h-6 text-[#7ebd24]" /> 
          ALL STORES
        </h1>
        <p className="text-xs text-slate-500 font-sans font-medium">
          Find your desired stores and shop your favourite products with premium merchant support
        </p>
      </div>

      {/* Grid containing the exact card layouts of Image 1 */}
      {approvedVendors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {approvedVendors.map((vendor) => {
            const today = new Date().toISOString().substring(0, 10);
            const isCampaignActive = !!(
              vendor.clearanceActive && 
              vendor.clearanceRate && 
              vendor.clearanceStartDate && 
              vendor.clearanceEndDate &&
              today >= vendor.clearanceStartDate && 
              today <= vendor.clearanceEndDate
            );

            return (
              <div 
                key={vendor.id}
                onClick={() => setSelectedVendor(vendor)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#0f5132]/30 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group relative"
                id={`vendor-card-${vendor.id}`}
              >
                {/* Banner covering */}
                <div className="h-28 sm:h-32 bg-slate-105 relative select-none">
                  <img 
                    src={vendor.banner || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"}
                    alt={vendor.vendorName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102 opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  {/* Closed Now status / badge exactly like Image 1 */}
                  {vendor.isClosed && (
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-rose-600 text-white font-mono text-[9px] uppercase tracking-wider rounded font-black z-10 shadow-sm animate-pulse">
                      Closed Now
                    </span>
                  )}
                  {isCampaignActive && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white font-mono text-[9px] uppercase tracking-wider rounded font-black z-10 shadow flex items-center gap-1 animate-pulse border border-white/10">
                      🔥 CLEARANCE {vendor.clearanceRate}% OFF
                    </span>
                  )}
                </div>

                {/* Overlapping circle logo avatar */}
                <div className="px-6 flex justify-between items-end -mt-8 sm:-mt-10 shrink-0 relative z-10 select-none">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-gradient-to-br from-[#0f5132] to-[#7ebd24] text-white flex items-center justify-center font-display font-black text-xl sm:text-2.5xl border-3 border-white shadow-md relative overflow-hidden">
                    {renderLogo(vendor.logo, vendor.vendorName, "w-full h-full object-cover rounded-md")}
                  </div>
                  
                  {/* Total products tag overlaying the card */}
                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-205 text-slate-600 font-mono text-[10px] uppercase font-bold rounded-md">
                    {products.filter(p => p.vendorId === vendor.id && p.isActive && p.isApproved).length} Products
                  </span>
                </div>

                {/* Details info */}
                <div className="p-6 pt-4 text-left flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-sans font-extrabold text-slate-850 truncate group-hover:text-[#0f5132] transition">
                      {vendor.vendorName}
                    </h3>
                    <p className="text-[11.5px] text-slate-450 line-clamp-2 leading-relaxed">
                      {vendor.description || "Premium retail merchant representing elite product collections."}
                    </p>
                  </div>

                  {/* Footer rating line */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 text-xs text-slate-505 font-medium">
                    <div className="flex items-center text-amber-400 font-bold mr-1">
                      <Star className="w-4 h-4 fill-amber-400 mr-0.5" />
                      <span>{vendor.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span>{vendor.reviewsCount || 0} reviews</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3.5 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-450 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold font-sans text-xs text-slate-800">No Approved Stores Exist</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">There are currently no approved merchants on this platform sandbox. Try registering a new vendor account first.</p>
          </div>
        </div>
      )}
    </div>
  );
}
