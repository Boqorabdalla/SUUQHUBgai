/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trash2, Tag, ArrowRight, Minus, Plus, Calendar } from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { formatPrice, translations } from '../utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  currency: 'USD' | 'EUR' | 'AED';
  lang: 'en' | 'ar' | 'es';
  onCheckout: (appliedCoupon?: Coupon) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  currency,
  lang,
  onCheckout
}: CartDrawerProps) {
  if (!isOpen) return null;

  const t = translations[lang];

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Computations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [globalDeliveryFee, setGlobalDeliveryFee] = useState<number>(15);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/delivery-config')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && typeof data.deliveryFee === 'number') {
            setGlobalDeliveryFee(data.deliveryFee);
          }
        })
        .catch(err => console.error("Error fetching delivery fee in cart drawer:", err));
    }
  }, [isOpen]);
  
  // Dynamic coupon deduction
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
       discount = (subtotal * appliedCoupon.value) / 100;
    } else {
       discount = appliedCoupon.value;
    }
  }

  const shippingCost = subtotal > 150 || subtotal === 0 ? 0 : globalDeliveryFee;
  const tax = (subtotal - discount) * 0.05; // 5% VAT rate
  const total = Math.max(0, subtotal - discount + shippingCost + tax);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, spend: subtotal })
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || 'Invalid or expired coupon');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data.coupon);
        setCouponSuccess(`Coupon code '${data.coupon.code}' successfully applied!`);
      }
    } catch (err) {
      setCouponError('Network verification issue');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponCode('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Black backdrop layer */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"></div>

      <div className={`absolute inset-y-0 right-0 max-w-full flex pl-10 ${lang === 'ar' ? 'left-0 right-auto pr-10 pl-0' : ''}`}>
        <div 
          className="w-screen max-w-md bg-[#0f1115] border-l border-[#242934] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          id="cart-drawer-panel"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#242934] flex items-center justify-between bg-[#151820]">
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{t.shoppingCart}</span>
              <span className="bg-amber-400 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart items listing */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#1e2229]">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center pb-20 select-none">
                <div className="h-16 w-16 bg-[#161a23] hover:text-amber-400 rounded-2xl flex items-center justify-center mb-4 border border-[#242934] text-gray-500 animate-pulse">
                  <Tag className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-gray-200 text-sm mb-1">Empety Shopping Cart</h3>
                <p className="text-xs text-gray-500 max-w-xs">{t.cartEmpty}</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 text-left">
                  <div className="w-16 h-16 rounded-xl bg-gray-900 border border-[#242934] overflow-hidden flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-200 line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-gray-500 font-serif mt-0.5">
                        {item.selectedColor ? `${item.selectedColor}` : ''}
                        {item.selectedSize ? ` / ${item.selectedSize}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      {/* Qty Up/Down */}
                      <div className="flex items-center bg-[#151821] border border-[#242934] rounded-lg">
                        <button
                          onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                          className="px-1.5 py-0.5 text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono text-white text-[10px] w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, Math.min(item.stockLimit, item.quantity + 1))}
                          className="px-1.5 py-0.5 text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <span className="text-xs font-mono font-bold text-white">
                        {formatPrice(item.price * item.quantity, currency)}
                      </span>

                      {/* Trash action */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing calculations footer */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-[#151820] border-t border-[#242934]">
              
              {/* Voucher Area */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={!!appliedCoupon}
                    placeholder={t.couponPlaceholder}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-grow text-xs bg-[#0c0e12] border border-[#242934] rounded-xl px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-400/50 uppercase font-mono"
                  />
                  {appliedCoupon ? (
                    <button
                      onClick={handleClearCoupon}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon}
                      className="px-3 py-2 bg-amber-400 text-black rounded-xl text-xs font-extrabold hover:bg-amber-500 active:scale-95 transition cursor-pointer"
                    >
                      {validatingCoupon ? '...' : t.applyCoupon}
                    </button>
                  )}
                </div>
                {couponError && <p className="text-[10px] text-red-400 text-left mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-[10px] text-emerald-400 text-left mt-1">{couponSuccess}</p>}
              </div>

              {/* Bill splits */}
              <div className="space-y-2.5 text-xs text-gray-400 pb-4 border-b border-[#242934]">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span className="text-gray-200 font-semibold">{formatPrice(subtotal, currency)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t.discount} ({appliedCoupon.code})</span>
                    <span>-{formatPrice(discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t.shipping}</span>
                  <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.tax} (5% VAT)</span>
                  <span>{formatPrice(tax, currency)}</span>
                </div>
              </div>

              {/* Total Block */}
              <div className="flex justify-between items-center py-4 text-white">
                <span className="font-display font-medium text-xs uppercase tracking-wider">{t.estimatedTotal}</span>
                <span className="text-xl font-display font-black text-amber-400">{formatPrice(total, currency)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-4 bg-gray-900/40 p-2 rounded-lg justify-center border border-[#1e2229]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Estimated dispatch: Same day delivery option.</span>
              </div>

              {/* Submit CTA */}
              <button
                onClick={() => onCheckout(appliedCoupon || undefined)}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-[#c29633] text-black font-extrabold py-3.5 rounded-xl justify-center text-xs flex items-center gap-2 hover:shadow-lg hover:shadow-amber-400/20 active:scale-98 transition cursor-pointer"
              >
                <span>{t.checkout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
