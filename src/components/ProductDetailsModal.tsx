/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Star, Check, Plus, Minus, Share2, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, translations } from '../utils';

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  currency: 'USD' | 'EUR' | 'AED';
  lang: 'en' | 'ar' | 'es';
  onAddToCart: (product: Product, color?: string, size?: string, qty?: number) => void;
  isVendorClosed?: boolean;
}

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  currency,
  lang,
  onAddToCart,
  isVendorClosed = false
}: ProductDetailsModalProps) {
  if (!isOpen) return null;

  const t = translations[lang];

  // Gallery view state
  const [selectedImage, setSelectedImage] = useState(product.image);

  // Selections state
  const [selectedColor, setSelectedColor] = useState(product.variants?.colors?.[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(product.variants?.sizes?.[0]?.name || '');
  const [quantity, setQuantity] = useState(1);

  // Interactive tab control
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Multi-platform simulated share drawer
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Compute actual price applying any variant modifier selection
  const activeColorObject = product.variants?.colors?.find(c => c.name === selectedColor);
  const activeSizeObject = product.variants?.sizes?.find(s => s.name === selectedSize);
  const modifier = (activeColorObject?.priceModifier || 0) + (activeSizeObject?.priceModifier || 0);
  const computedSinglePrice = product.price + modifier;

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubAdd = () => {
    onAddToCart(product, selectedColor, selectedSize, quantity);
    onClose();
  };

  // Simulated reviews generator based on product ID
  const simulatedComments = [
    { name: 'Khaled J.', rating: 5, date: '2026-05-14', text: 'Stunning premium feel. Exceeded expectations.' },
    { name: 'Maria S.', rating: 4, date: '2026-05-20', text: 'Excellent specifications. Delivery was delayed by 1 day but product is top notch.' },
    { name: 'Ismael A.', rating: 5, date: '2026-05-28', text: 'Incredibly comfortable and performs exactly as described by the seller.' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-[#0f1115] border border-[#232935] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition cursor-pointer z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 p-6 sm:p-8 gap-8">
          
          {/* Left Side: Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative pt-[100%] rounded-2xl bg-gray-950 overflow-hidden border border-[#1e2229]">
              <img
                src={selectedImage}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            
            {/* Gallery Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition relative flex-shrink-0 cursor-pointer ${selectedImage === img ? 'border-amber-400 scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Configuration Body */}
          <div className="flex flex-col text-left">
            <span className="text-xs text-amber-400 uppercase font-mono tracking-widest mb-1.5">{product.brand}</span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-white mb-2 leading-snug">{product.title}</h1>
            
            {/* Rating Stars row */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-gray-600'}`} />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-300">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">| {product.ratingCount} Customer reviews</span>
            </div>

            {/* Price section featuring modifiers info */}
            <div className="bg-[#14171d] p-4 rounded-2xl mb-5 flex items-center justify-between border border-[#1e2229]">
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Price selection</span>
                <span className="text-2xl font-display font-black text-white">
                  {formatPrice(computedSinglePrice, currency)}
                </span>
              </div>
              {isVendorClosed ? (
                <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20 animate-pulse">
                  Temporarily Closed
                </span>
              ) : product.stock <= 0 ? (
                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
                  {t.outOfStock}
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  In Stock ({product.stock} units)
                </span>
              )}
            </div>

            {/* Product description short summary */}
            <p className="text-xs text-gray-300 leading-relaxed mb-5">{product.description.substring(0, 160)}...</p>

            {/* Variants Selectors */}
            {product.variants?.colors && product.variants.colors.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-semibold block uppercase tracking-wider text-gray-400 mb-2">Color Variant:</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedColor(c.name); if (c.stock === 0) alert('Color low stock preview'); }}
                      className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${selectedColor === c.name ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-[#242933] bg-[#14171d] text-gray-400 hover:border-gray-600'}`}
                    >
                      {selectedColor === c.name && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      {c.name} {c.priceModifier > 0 && <span className="text-[10px] text-amber-500 font-bold">(+{c.priceModifier}$)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.sizes && product.variants.sizes.length > 0 && (
              <div className="mb-5">
                <span className="text-xs font-semibold block uppercase tracking-wider text-gray-400 mb-2">Size selection:</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.sizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.name)}
                      className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-medium border transition ${selectedSize === s.name ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-[#242933] bg-[#14171d] text-gray-400 hover:border-gray-500'}`}
                    >
                      {s.name} {s.priceModifier !== 0 && <span className="text-[10px] text-amber-400">({s.priceModifier > 0 ? '+' : ''}{s.priceModifier}$)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity control & Add to Cart Action */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center bg-[#14171d] border border-[#242933] rounded-xl py-1.5 px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 text-gray-400 hover:text-white cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 font-mono text-xs w-8 text-center text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-1 text-gray-400 hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleSubAdd}
                disabled={product.stock <= 0 || isVendorClosed}
                className={`cursor-pointer flex-1 py-3 px-6 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition duration-300 ${
                  product.stock <= 0 || isVendorClosed 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:shadow-lg hover:shadow-amber-400/20 active:scale-95'
                }`}
              >
                {isVendorClosed 
                  ? 'Store Temporarily Closed (Actions Paused)' 
                  : `Add ${quantity} to Cart (${formatPrice(computedSinglePrice * quantity, currency)})`}
              </button>
              
              {/* Share Trigger */}
              <button
                onClick={() => setShareOpen(!shareOpen)}
                className="p-3 bg-[#14171d] text-gray-400 hover:text-white rounded-xl border border-[#242933] hover:border-gray-500 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Share Panel simulated */}
            {shareOpen && (
              <div className="p-3 bg-[#161922] border border-[#2b3140] rounded-2xl mb-5 text-xs text-left animate-in slide-in-from-bottom-2 duration-150">
                <span className="block font-semibold text-gray-300 mb-2">Simulated Social Sharing:</span>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button onClick={() => alert('Shared safely on WhatsApp')} className="px-2.5 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition text-[11px] font-medium cursor-pointer">WhatsApp</button>
                  <button onClick={() => alert('Shared safely on X')} className="px-2.5 py-1 bg-sky-600/20 text-sky-400 rounded hover:bg-sky-600/30 transition text-[11px] font-medium cursor-pointer">X (Twitter)</button>
                  <button onClick={() => alert('Shared safely on Linkin')} className="px-2.5 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition text-[11px] font-medium cursor-pointer">LinkedIn</button>
                </div>
                <div className="flex gap-1.5 items-center">
                  <input readOnly value={`https://suuqhub.com/product/${product.id}`} className="bg-black/40 border border-[#2b3140] px-2 py-1 rounded text-[10px] text-gray-400 font-mono flex-grow focus:outline-none" />
                  <button onClick={handleCopyLink} className="bg-amber-400 text-black px-2 py-1 rounded text-[10px] font-bold hover:bg-amber-500 transition cursor-pointer">{copiedLink ? 'Copied' : 'Copy'}</button>
                </div>
              </div>
            )}

            {/* Core benefits badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1e2229] mb-6">
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#13151b] border border-[#1e2229]">
                <Truck className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-[10px] font-semibold text-gray-200">Express Delivery</span>
                <span className="text-[8px] text-gray-500">24-48 Hours Hub</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#13151b] border border-[#1e2229]">
                <RefreshCw className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-[10px] font-semibold text-gray-200">14-Day Returns</span>
                <span className="text-[8px] text-gray-500">Hassle-Free Post</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#13151b] border border-[#1e2229]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-[10px] font-semibold text-gray-200">Full Warranty</span>
                <span className="text-[8px] text-gray-500">12 Months Guard</span>
              </div>
            </div>

            {/* Detailed Tabs Control container */}
            <div>
              <div className="flex border-b border-[#242933] gap-2 mb-3">
                <button
                  onClick={() => setActiveTab('desc')}
                  className={`cursor-pointer px-4 py-2 text-xs font-semibold border-b-2 transition ${activeTab === 'desc' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  Product Story
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`cursor-pointer px-4 py-2 text-xs font-semibold border-b-2 transition ${activeTab === 'specs' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  Technical Specifications
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`cursor-pointer px-4 py-2 text-xs font-semibold border-b-2 transition ${activeTab === 'reviews' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  Verified Reviews ({simulatedComments.length})
                </button>
              </div>

              <div className="p-1 min-h-[90px] text-gray-300">
                {activeTab === 'desc' && (
                  <p className="text-xs leading-relaxed text-left text-gray-400">{product.description}</p>
                )}
                {activeTab === 'specs' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-left">
                    {Object.entries(product.specifications).map(([k, v]) => (
                      <div key={k} className="flex flex-col p-2 bg-[#12141a]/60 rounded-lg border border-[#1e2229]">
                        <span className="text-[10px] text-gray-500 uppercase font-mono">{k}</span>
                        <span className="font-medium text-gray-200 mt-0.5">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div className="flex flex-col gap-3">
                    {simulatedComments.map((review, idx) => (
                      <div key={idx} className="p-3 bg-gray-900/30 rounded-xl border border-gray-800/80 text-left text-xs text-gray-300">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-semibold text-gray-100">{review.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{review.date}</span>
                        </div>
                        <div className="flex text-amber-400 mb-1.5">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-gray-400 text-[11px] leading-relaxed">{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
