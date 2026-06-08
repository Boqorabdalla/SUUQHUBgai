/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, ShieldCheck, ArrowLeft, Send, Check, MapPin } from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { formatPrice, translations } from '../utils';

interface CheckoutViewProps {
  cartItems: CartItem[];
  appliedCoupon?: Coupon;
  currency: 'USD' | 'EUR' | 'AED';
  lang: 'en' | 'ar' | 'es';
  onBackToCatalog: () => void;
  onOrderCompleted: (orderId: string) => void;
  userEmail: string;
  userId?: string;
  userRole?: string;
}

export default function CheckoutView({
  cartItems,
  appliedCoupon,
  currency,
  lang,
  onBackToCatalog,
  onOrderCompleted,
  userEmail,
  userId,
  userRole
}: CheckoutViewProps) {
  const t = translations[lang];

  // Address Form States
  const [fullName, setFullName] = useState('Abdilahi Ahmed');
  const [addressLine1, setAddressLine1] = useState('Jigjiga yar, Hargeisa');
  const [city, setCity] = useState('Hargeisa');
  const [stateName, setStateName] = useState('Maroodi Jeex');
  const [zipCode, setZipCode] = useState('00000');
  const [country, setCountry] = useState('Somaliland');
  const [phone, setPhone] = useState('+252 63 1234567');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'zaad' | 'edahab'>('card');
  const [enabledCard, setEnabledCard] = useState(true);
  const [enabledCod, setEnabledCod] = useState(true);
  const [enabledZaad, setEnabledZaad] = useState(true);
  const [enabledEdahab, setEnabledEdahab] = useState(true);

  // Interactive Payment / Credit Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('SALEM AL-MANSOORI');
  const [cardFlipped, setCardFlipped] = useState(false); // flips card on CVV focus

  // Mobile payment states
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [mobileSenderNumber, setMobileSenderNumber] = useState('');
  const [mobileSenderName, setMobileSenderName] = useState('Salem Al-Mansoori');
  const [mobileTransactionNumber, setMobileTransactionNumber] = useState('');
  const [mobilePaymentDateTime, setMobilePaymentDateTime] = useState(new Date().toISOString().replace('T', ' ').substring(0, 16));

  const uniqueVendorsInCart = React.useMemo(() => {
    const matchedVendorIds = new Set<string>();
    const matchedVendorsList: any[] = [];
    
    cartItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.vendorId) {
        if (!matchedVendorIds.has(prod.vendorId)) {
          matchedVendorIds.add(prod.vendorId);
          const vInfo = vendors.find(v => v.id === prod.vendorId);
          if (vInfo) {
            matchedVendorsList.push(vInfo);
          } else {
            matchedVendorsList.push({
              id: prod.vendorId,
              vendorName: prod.vendorName || "Associated Store Seller",
              zaadNumber: "634400213",
              edahabNumber: "627700213"
            });
          }
        }
      }
    });

    if (matchedVendorsList.length === 0) {
      return [{
        id: 'central-suuqhub',
        vendorName: "SuuqHub Central Cashier System",
        zaadNumber: "634400213",
        edahabNumber: "627700213"
      }];
    }
    
    return matchedVendorsList;
  }, [cartItems, products, vendors]);

  // Flow State
  const [step, setStep] = useState<1 | 2>(1); // 1: Shipping Details, 2: Checkout Payment
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [globalDeliveryFee, setGlobalDeliveryFee] = useState<number>(15);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCityChange = (val: string) => {
    setCity(val);
    if (val.trim().toLowerCase() !== 'hargeisa') {
      if (deliveryMethod === 'delivery') {
        setDeliveryMethod('pickup');
        setValidationError("Home delivery is strictly supported in Hargeisa only. Delivery option has been automatically updated to Self Pickup.");
      }
    } else {
      setValidationError(null);
    }
  };

  const handleDeliveryMethodChange = (method: 'delivery' | 'pickup') => {
    if (method === 'delivery' && city.trim().toLowerCase() !== 'hargeisa') {
      setValidationError("Home delivery is strictly available for Hargeisa only. For other cities, please choose Self Pickup.");
      setDeliveryMethod('pickup');
    } else {
      setValidationError(null);
      setDeliveryMethod(method);
    }
  };

  // Load global SuuqHub delivery config price
  useEffect(() => {
    const loadDeliveryFee = async () => {
      try {
        const [feeRes, prodRes, vendRes] = await Promise.all([
          fetch('/api/delivery-config'),
          fetch('/api/products'),
          fetch('/api/vendors')
        ]);
        
        if (feeRes.ok) {
          try {
            const contentType = feeRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await feeRes.json();
              setGlobalDeliveryFee(data.deliveryFee ?? 15);
              const hasCard = data.enableCard !== false;
              const hasCod = data.enableCod !== false;
              const hasZaad = data.enableZaad !== false;
              const hasEdahab = data.enableEdahab !== false;
              setEnabledCard(hasCard);
              setEnabledCod(hasCod);
              setEnabledZaad(hasZaad);
              setEnabledEdahab(hasEdahab);
              
              // Switch default selection based on available active options
              if (!hasCard) {
                if (hasCod) {
                  setPaymentMethod('cod');
                } else if (hasZaad) {
                  setPaymentMethod('zaad');
                } else if (hasEdahab) {
                  setPaymentMethod('edahab');
                }
              } else {
                setPaymentMethod('card');
              }
            }
          } catch (feeErr) {
            console.error('Error parsing delivery fee config JSON in checkout:', feeErr);
          }
        }
        if (prodRes.ok) {
          try {
            const contentType = prodRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              setProducts(await prodRes.json());
            }
          } catch (prodErr) {
            console.error('Error parsing products JSON in checkout:', prodErr);
          }
        }
        if (vendRes.ok) {
          try {
            const contentType = vendRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              setVendors(await vendRes.json());
            }
          } catch (vendErr) {
            console.error('Error parsing vendors JSON in checkout:', vendErr);
          }
        }
      } catch (err) {
        console.error('Error fetching delivery, products, or vendors:', err);
      }
    };
    loadDeliveryFee();
  }, []);

  // Computations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }
  }

  const shippingCost = deliveryMethod === 'pickup' || subtotal > 150 || subtotal === 0 ? 0 : globalDeliveryFee;
  const tax = (subtotal - discount) * 0.05; // 5% VAT rate
  const total = Math.max(0, subtotal - discount + shippingCost + tax);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const shippingAddress = {
      fullName,
      addressLine1,
      city,
      state: stateName,
      zipCode,
      country,
      phone
    };

    const payload = {
      customerId: userId || "usr-customer-01",
      customerRole: userRole || "customer",
      customerName: fullName,
      customerEmail: userEmail || "customer@apex.com",
      items: cartItems.map(item => ({
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        image: item.image
      })),
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      couponCode: appliedCoupon?.code,
      paymentMethod: 
        paymentMethod === 'cod' ? 'Cash on Delivery' : 
        paymentMethod === 'zaad' ? 'Zaad Mobile' : 
        paymentMethod === 'edahab' ? 'Edahab Mobile' : 
        'Stripe Card',
      mobilePayment: (paymentMethod === 'zaad' || paymentMethod === 'edahab') ? {
        provider: paymentMethod,
        transactionNumber: mobileTransactionNumber,
        senderNumber: mobileSenderNumber,
        senderName: mobileSenderName,
        dateTime: mobilePaymentDateTime
      } : undefined,
      shippingAddress,
      deliveryMethod
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setTimeout(() => {
          onOrderCompleted(data.id);
          setLoading(false);
        }, 1500); // realistic payment gateway sandbox processing timer
      } else {
        alert(data.error || 'Checkout transaction failed');
        setLoading(false);
      }
    } catch (err) {
      alert('Network transmission failed');
      setLoading(false);
    }
  };

  const formattedCardNumber = cardNumber
    .replace(/\s?/g, '')
    .replace(/(\d{4})/g, '$1 ')
    .trim() || '•••• •••• •••• ••••';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-left font-sans">
      <button
        onClick={onBackToCatalog}
        className="mb-6 flex items-center gap-2 hover:text-indigo-650 text-xs font-semibold cursor-pointer text-slate-500 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.backToCatalog}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Steps (Form / Payment details) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
              <span className="text-xs font-semibold text-slate-800">Shipping Details</span>
            </div>
            <div className="w-8 h-px bg-slate-200 flex-grow mx-4"></div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-205'}`}>2</div>
              <span className="text-xs font-semibold text-slate-650">Confirm Payment</span>
            </div>
          </div>

          <form onSubmit={step === 1 ? (e) => {
            e.preventDefault();
            if (deliveryMethod === 'delivery' && city.trim().toLowerCase() !== 'hargeisa') {
              setValidationError("Home delivery is strictly supported in Hargeisa only. For other cities, please choose 'Self Pickup'.");
              return;
            }
            setValidationError(null);
            setStep(2);
          } : handleSubmitOrder} className="bg-white rounded p-6 sm:p-8 border border-slate-200 shadow-sm">
            {step === 1 ? (
              <div className="space-y-4">
                <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-2">
                  <Truck className="w-4.5 h-4.5" /> Delivery Options & Destination
                </h3>

                {/* Logistics Advisory Banner */}
                <div className="bg-amber-50 border border-amber-205 rounded-xl p-4 text-amber-900 text-xs flex gap-2.5 items-start">
                  <span className="text-sm">📢</span>
                  <div className="space-y-1">
                    <span className="font-bold block">Logistics Advisory:</span>
                    <p className="leading-relaxed font-sans text-amber-800">
                      Currently, <b>Home Delivery</b> is available **only within Hargeisa**. For other Somaliland cities (such as Borama, Berbera, Burao, Erigavo, Las Anod), orders are strictly limited to **Self Pickup** at our local partner warehouses.
                    </p>
                  </div>
                </div>

                {validationError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-semibold font-sans animate-bounce">
                    ⚠️ {validationError}
                  </div>
                )}

                {/* Handover selection method */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 text-left">
                  <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-2">Select Delivery Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDeliveryMethodChange('delivery')}
                      className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer select-none ${
                        deliveryMethod === 'delivery'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 text-indigo-900 shadow-3xs'
                          : 'border-slate-200 bg-white hover:border-slate-350 text-slate-650'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-sans">Home Delivery</span>
                        <Truck className={`w-4 h-4 ${deliveryMethod === 'delivery' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-[10px] font-mono mt-2 font-bold text-slate-500">
                        Fee: ${globalDeliveryFee} USD
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeliveryMethodChange('pickup')}
                      className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer select-none ${
                        deliveryMethod === 'pickup'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 text-indigo-900 shadow-3xs'
                          : 'border-slate-200 bg-white hover:border-slate-350 text-slate-650'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-sans">Self Pickup</span>
                        <MapPin className={`w-4 h-4 ${deliveryMethod === 'pickup' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-[10px] font-mono mt-2 font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded-md uppercase">
                        Free ($0)
                      </span>
                    </button>
                  </div>
                  {deliveryMethod === 'pickup' ? (
                    <p className="text-[10px] text-emerald-700 font-mono mt-2 leading-tight">
                      ℹ️ Self-pickup option. No home delivery fee is added. You will pick up your order items directly from our local partner warehouse facilities in your selected city.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-mono mt-2 leading-tight">
                      ℹ️ Home delivery option managed entirely by SuuqHub logistics. Ships direct to your Hargeisa physical address. (Only available in Hargeisa).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Address</label>
                  <input
                    required
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">City</label>
                    <input
                      required
                      type="text"
                      value={city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      placeholder="e.g. Hargeisa or Borama"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                    <p className="text-[9px] text-slate-400 font-sans mt-1 leading-normal">
                      Note: Home Delivery is restricted exclusively to <b>Hargeisa</b>.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Country</label>
                    <input
                      readOnly
                      disabled
                      type="text"
                      value="Somaliland"
                      className="w-full text-xs bg-slate-100 border border-slate-200 rounded px-4 py-3 text-slate-500 cursor-not-allowed select-none focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Phone Number</label>
                  <input
                    required
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Select Payment Option buttons */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Select Payment Option</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {enabledCard && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <CreditCard className={`w-5 h-5 mb-2 ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div>
                          <span className="block text-xs font-bold text-slate-850">Credit / Debit Card</span>
                          <span className="block text-[10px] text-slate-405 mt-0.5 text-slate-400">Pay securely via Stripe Sandbox</span>
                        </div>
                      </button>
                    )}
                    {enabledCod && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <Truck className={`w-5 h-5 mb-2 ${paymentMethod === 'cod' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div>
                          <span className="block text-xs font-bold text-slate-850">Cash on Delivery (COD)</span>
                          <span className="block text-[10px] text-slate-405 mt-0.5 text-slate-400">Pay courier on villa drop</span>
                        </div>
                      </button>
                    )}
                    {enabledZaad && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('zaad')}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${paymentMethod === 'zaad' ? 'border-emerald-600 bg-emerald-50/10 ring-1 ring-emerald-600' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <span className="text-emerald-700 font-extrabold text-[10px] mb-2 px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200 inline-block font-mono tracking-wider">ZAAD MOBILE</span>
                        <div>
                          <span className="block text-xs font-bold text-slate-850">Zaad Peer-to-Peer</span>
                          <span className="block text-[10px] text-emerald-650 mt-0.5 font-medium">No fee, instant ledger transfer</span>
                        </div>
                      </button>
                    )}
                    {enabledEdahab && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('edahab')}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${paymentMethod === 'edahab' ? 'border-amber-600 bg-amber-50/10 ring-1 ring-amber-600' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <span className="text-amber-705 font-extrabold text-[10px] mb-2 px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200 inline-block font-mono tracking-wider">EDAHAB</span>
                        <div>
                          <span className="block text-xs font-bold text-slate-850">eDahab Wallet Pay</span>
                          <span className="block text-[10px] text-amber-650 mt-0.5 font-medium">Mobile payment transfer</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 1 Proceed Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition active:scale-98 text-center flex items-center justify-center gap-2 shadow-sm"
                    id="btn-checkout-step1-continue"
                  >
                    <span>Proceed to Confirmation</span>
                    <span className="font-mono text-[9px] bg-indigo-500 text-white/90 px-1.5 py-0.5 rounded ml-1 font-bold">STEP 2 &rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {paymentMethod === 'card' ? (
                  <>
                    <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-2">
                      <CreditCard className="w-4.5 h-4.5" /> Credit Card Details (Stripe Sandbox)
                    </h3>

                    {/* Flipping Sandbox Credit Card */}
                    <div className={`perspective-1000 w-full h-44 sm:h-52 relative transition-all duration-500 ease-out preserve-3d mx-auto max-w-sm ${cardFlipped ? 'rotate-y-180' : ''}`}>
                      {/* Card Front */}
                      <div className="w-full h-full absolute backface-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded border border-white/10 p-5 flex flex-col justify-between text-white shadow-md overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-widest text-[#d4af37] font-mono">Premium Customer Account</span>
                            <span className="text-sm font-sans font-semibold tracking-wider text-amber-100">SUUQHUB CREDIT</span>
                          </div>
                          <div className="w-10 h-7 rounded bg-indigo-50/20 border border-indigo-400/40 flex items-center justify-center text-[10px] font-bold font-mono">CC</div>
                        </div>
                        
                        <div className="text-base sm:text-lg font-mono tracking-widest text-[#eeeeee] my-2">
                          {formattedCardNumber}
                        </div>

                        <div className="flex justify-between text-left">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 uppercase font-mono tracking-wider">Card Holder</span>
                            <span className="text-xs font-semibold uppercase">{cardHolder || 'Your Name'}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] text-slate-400 uppercase font-mono tracking-wider">Expires</span>
                            <span className="text-xs font-mono">{cardExpiry || 'MM/YY'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Back */}
                      <div className="w-full h-full absolute backface-hidden rotate-y-180 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded border border-white/10 p-5 flex flex-col justify-between text-white shadow-md overflow-hidden">
                        <div className="h-9 bg-black -mx-5 mt-2"></div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 uppercase font-mono text-right mb-1">Cvv code</span>
                          <div className="h-8 bg-white/5 border border-white/10 rounded flex items-center justify-end px-3 font-mono text-sm tracking-wider text-indigo-400">
                            {cardCvv || '•••'}
                          </div>
                        </div>
                        <div className="text-[8px] text-slate-550 leading-normal text-center select-none">
                          This is a secure Sandboxing customer flow. Zero actual charges are processed.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Card Holder Name</label>
                        <input
                          required
                          type="text"
                          maxLength={30}
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Card Number</label>
                        <input
                          required
                          type="text"
                          maxLength={16}
                          placeholder="4000 1234 5678 9010"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-805 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Expiry Date</label>
                          <input
                            required
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length === 2 && !val.includes('/')) val += '/';
                              setCardExpiry(val);
                            }}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-805 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Cvv code</label>
                          <input
                            required
                            type="text"
                            maxLength={3}
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            onFocus={() => setCardFlipped(true)}
                            onBlur={() => setCardFlipped(false)}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-805 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (paymentMethod === 'zaad' || paymentMethod === 'edahab') ? (
                  <div className="space-y-5">
                    <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-5 text-left space-y-3.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[9.5px] font-mono font-black uppercase tracking-wider">{paymentMethod} mobile network</span>
                        <span className="text-xs font-bold text-slate-800">Direct Merchant Desks List</span>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed">
                        To checkout, please send the total order amount of <strong className="text-indigo-700 font-extrabold font-mono">${total.toFixed(2)} USD</strong> to the official payment receiving numbers of the merchants below:
                      </p>

                      <div className="space-y-2.5">
                        {uniqueVendorsInCart.map((v, i) => (
                          <div key={v.id || i} className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-bold leading-none mb-1">Store Outlet</span>
                              <span className="font-extrabold text-slate-800 text-xs">{v.vendorName}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {paymentMethod === 'zaad' && (
                                <div className="px-2.5 py-1 bg-emerald-50 rounded border border-emerald-100 text-left animate-fade-in">
                                  <span className="block text-[8px] uppercase tracking-wider text-emerald-600 font-black font-mono">ZAAD TEL</span>
                                  <span className="text-xs font-mono font-black text-emerald-800">{v.zaadNumber || '634400213'}</span>
                                </div>
                              )}
                              {paymentMethod === 'edahab' && (
                                <div className="px-2.5 py-1 bg-amber-50 rounded border border-amber-100 text-left animate-fade-in">
                                  <span className="block text-[8px] uppercase tracking-wider text-amber-600 font-black font-mono">EDAHAB TEL</span>
                                  <span className="text-xs font-mono font-black text-amber-800">{v.edahabNumber || '627700213'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        🔒 Omnichannel escrow system. Funds will stay pending until delivery verification by the SuuqHub courier.
                      </p>
                    </div>

                    {/* Verification input fields */}
                    <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 text-left">
                      <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Input Transfer Receipt Details</h4>
                        <span className="text-[9px] font-mono text-slate-400">All fields required</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Your Mobile Number (From)</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. 634411222"
                            value={mobileSenderNumber}
                            onChange={(e) => setMobileSenderNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-450 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Sender Registered Owner Name</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Salem Al-Mansoori"
                            value={mobileSenderName}
                            onChange={(e) => setMobileSenderName(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-450 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Official Mobile Transaction Number (ID / PIN)</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. TXN-3882751-HAR"
                            value={mobileTransactionNumber}
                            onChange={(e) => setMobileTransactionNumber(e.target.value)}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-450 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Transaction Completed Date & Time</label>
                          <input
                            required
                            type="text"
                            value={mobilePaymentDateTime}
                            onChange={(e) => setMobilePaymentDateTime(e.target.value)}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-450 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <Truck className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="font-bold text-sm text-slate-800">Cash on Delivery (COD) Selected</h4>
                      <p className="text-xs text-slate-550 leading-relaxed font-medium">
                        No up-front credit card holds or processing details are required. You will settle the billing amount securely with the courier in cash or via mobile scanner upon parcel drop at your villa.
                      </p>
                      
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-left mt-5 text-[11px] text-slate-700 space-y-2 font-medium">
                        <p className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 uppercase tracking-wider text-[10px] font-mono">Villa Delivery Address Details:</p>
                        <p><span className="text-slate-400 mr-1 uppercase text-[9px] font-mono">Recipient:</span> {fullName}</p>
                        <p><span className="text-slate-400 mr-1 uppercase text-[9px] font-mono">Address:</span> {addressLine1}, {city}, {country}</p>
                        <p><span className="text-slate-400 mr-1 uppercase text-[9px] font-mono">Phone:</span> {phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-4 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded hover:bg-slate-100 transition cursor-pointer text-center"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-indigo-700 cursor-pointer text-center active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sheduling Order Dispatch...' : paymentMethod === 'cod' ? `Place Cash on Delivery Order` : `Secure Pay & Dispatch ${formatPrice(total, currency)}`}
                  </button>
                </div>

              </div>
            )}
          </form>

        </div>

        {/* Right Side: Order summary metrics breakdown */}
        <div className="lg:col-span-5 bg-white rounded p-6 border border-slate-200 space-y-4 shadow-sm">
          <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-800">Order Summary</h3>
          
          {/* Items list */}
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="py-3 flex gap-3 text-left">
                <div className="w-10 h-10 rounded bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-200">
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow flex flex-col justify-center text-xs">
                  <span className="font-semibold text-slate-800 line-clamp-1 leading-snug">{item.title}</span>
                  <span className="text-slate-500 font-mono text-[10px] mt-0.5">
                    Qty {item.quantity} {item.selectedColor ? ` / ${item.selectedColor}` : ''}
                  </span>
                </div>
                <div className="flex items-center text-xs font-mono font-bold text-slate-705">
                  {formatPrice(item.price * item.quantity, currency)}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-800 font-semibold">{formatPrice(subtotal, currency)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Voucher coupon ({appliedCoupon.code})</span>
                <span>-{formatPrice(discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated shipping cost</span>
              <span className="text-slate-800 font-semibold">{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax (5% VAT)</span>
              <span className="text-slate-800 font-semibold">{formatPrice(tax, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-slate-800 font-black font-sans">
              <span>Payable Total</span>
              <span className="text-lg text-indigo-600 font-extrabold font-mono">{formatPrice(total, currency)}</span>
            </div>
          </div>

          {/* Secure elements widgets */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2.5 text-[11px] text-slate-500 text-left shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Full compliance PCI-DSS level sandbox encryption.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Ships securely to villa address in Abu Dhabi.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
