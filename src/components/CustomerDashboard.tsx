/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, Truck, Calendar, MapPin, Receipt, MessageCircle, HelpCircle, User, Loader2, Sparkles, Send } from 'lucide-react';
import { Order, SupportTicket } from '../types';
import { formatPrice } from '../utils';

interface CustomerDashboardProps {
  currency: 'USD' | 'EUR' | 'AED';
  lang: 'en' | 'ar' | 'es';
  userId: string;
}

export default function CustomerDashboard({
  currency,
  lang,
  userId
}: CustomerDashboardProps) {
  // Database states
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub views
  const [activeMenu, setActiveMenu] = useState<'orders' | 'tickets' | 'profile'>('orders');

  // Interactive Selected Order Tracking details popup
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Help tickets state
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMsg, setNewTicketMsg] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyMsg, setTicketReplyMsg] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Print Invoice layout simulation
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordRes, tktRes, prodRes, vendRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/tickets'),
        fetch('/api/products'),
        fetch('/api/vendors')
      ]);

      const ordData = await ordRes.json();
      const tktData = await tktRes.json();
      const prodData = await prodRes.json();
      const vendData = await vendRes.json();

      setOrders(ordData.filter((o: Order) => o.customerId === userId));
      setTickets(tktData.filter((t: SupportTicket) => t.userId === userId));
      setProducts(prodData || []);
      setVendors(vendData || []);

    } catch (err) {
      console.error('Error fetching dashboard details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketMsg) return;
    setCreatingTicket(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: 'Salem Al-Mansoori',
          subject: newTicketSubject,
          message: newTicketMsg
        })
      });

      if (res.ok) {
        setNewTicketSubject('');
        setNewTicketMsg('');
        await fetchDashboardData();
        setActiveMenu('tickets');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyMsg) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'user',
          text: ticketReplyMsg
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        setTicketReplyMsg('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-2 font-sans text-xs">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span>Compiling User Cloud Database...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Sidebar nav */}
        <div className="md:col-span-3 space-y-2 bg-white p-4 rounded border border-slate-200 shadow-sm">
          <div className="p-3 border-b border-slate-100 mb-3 text-center md:text-left">
            <div className="w-12 h-12 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg mb-2.5 mx-auto md:mx-0">S</div>
            <span className="block font-bold text-slate-800 text-sm">Salem Al-Mansoori</span>
            <span className="text-[10px] text-slate-400 font-mono">Customer ID: {userId}</span>
          </div>

          <button
            onClick={() => { setActiveMenu('orders'); setSelectedOrder(null); setSelectedTicket(null); }}
            className={`w-full text-left px-4 py-3 rounded text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeMenu === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Package className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
          </button>

          <button
            onClick={() => { setActiveMenu('tickets'); setSelectedOrder(null); setSelectedTicket(null); }}
            className={`w-full text-left px-4 py-3 rounded text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeMenu === 'tickets' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Support Helpdesk ({tickets.length})</span>
          </button>

          <button
            onClick={() => { setActiveMenu('profile'); setSelectedOrder(null); setSelectedTicket(null); }}
            className={`w-full text-left px-4 py-3 rounded text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeMenu === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <User className="w-4 h-4" />
            <span>Addresses & Profile</span>
          </button>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="md:col-span-9 space-y-6">

          {/* Tab 1: Orders History list */}
          {activeMenu === 'orders' && !selectedOrder && !invoiceOrder && (
            <div className="space-y-4">
              <h2 className="font-sans font-bold text-lg text-slate-900 tracking-tight">Track Your Orders</h2>
              {orders.length === 0 ? (
                <div className="p-12 text-center bg-white rounded border border-slate-200 text-slate-400 shadow-sm">
                  <Package className="w-12 h-12 text-slate-350 mb-3 mx-auto" />
                  <p className="text-sm font-semibold">No active orders placed</p>
                  <p className="text-xs text-slate-400 mt-1">Place standard purchases and track their progress live!</p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="bg-white border border-slate-200 rounded p-5 hover:border-indigo-400 hover:shadow-sm transition space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Order Identification</span>
                        <span className="font-mono font-extrabold text-slate-800 text-xs sm:text-sm">{ord.id}</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5 text-xs">
                        <span className="text-slate-500">Placed: <span className="font-mono text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</span></span>
                        <span className="text-indigo-600 font-bold font-mono">{formatPrice(ord.total, currency)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded text-xs hover:text-slate-900 transition cursor-pointer"
                        >
                          Trace order progress
                        </button>
                        <button
                          onClick={() => setInvoiceOrder(ord)}
                          className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Invoice
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex -space-x-2 overflow-hidden">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="w-10 h-10 rounded border border-slate-250 bg-slate-50 overflow-hidden relative">
                            <img src={it.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Hub Status:</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                          ord.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-black' : 
                          'bg-amber-50 text-amber-700 border border-[#fef3c7]'
                        }`}>
                          {ord.status === 'shipped' ? '🚚 Dispatched (Shipped)' : ord.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub View: Tracking interactive milestone timeline view */}
          {selectedOrder && (
            <div className="bg-white rounded p-6 sm:p-8 border border-slate-200 space-y-6 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <button onClick={() => setSelectedOrder(null)} className="text-xs text-slate-400 hover:text-slate-800 mb-2 cursor-pointer flex items-center gap-1">← Close track logs</button>
                  <h3 className="font-sans font-bold text-base text-slate-900">Milestone Tracking Tracker: <span className="font-mono text-indigo-600">{selectedOrder.id}</span></h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Order total</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatPrice(selectedOrder.total, currency)}</span>
                </div>
              </div>

              {/* Graphic Tracker Node Bar (Horizontal layout) */}
              <div className="relative py-4">
                <div className="h-1 bg-slate-100 absolute right-0 left-0 top-1/2 -translate-y-1/2 rounded-full"></div>
                
                {/* Colored fill bar */}
                <div className={`h-1 bg-indigo-600 absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ${
                  selectedOrder.status === 'pending' ? 'w-1/12' :
                  selectedOrder.status === 'processing' ? 'w-2/5' :
                  selectedOrder.status === 'shipped' ? 'w-3/4' : 'w-full'
                }`}></div>

                <div className="relative flex justify-between">
                  {['pending', 'processing', 'shipped', 'delivered'].map((st, i) => {
                    const stepStatusIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status);
                    const isActive = stepStatusIndex >= i;
                    return (
                      <div key={st} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${isActive ? 'bg-white border-indigo-600' : 'bg-white border-slate-100'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize mt-2 font-semibold">
                          {st === 'shipped' ? 'Dispatched' : st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Items with Merchant-level Status & Payment configuration numbers details panel */}
              <div className="space-y-4 border-t border-slate-100 pt-6 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600 animate-pulse" /> Itemized Merchant Fulfillment & Payments
                  </h4>
                  <span className="text-[10px] text-slate-400">Tracks independent vendor statuses</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {selectedOrder.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId || p.id === (item as any).id);
                    const vendor = prod ? vendors.find(v => v.id === prod.vendorId) : null;
                    const itemStatus = (selectedOrder.vendorStatuses && vendor && selectedOrder.vendorStatuses[vendor.id]) || selectedOrder.status;

                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <img 
                            referrerPolicy="no-referrer"
                            src={item.image} 
                            alt={item.title} 
                            className="w-12 h-12 rounded-lg border border-slate-200 object-cover shrink-0" 
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.title}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-500 font-sans">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>Price: ${item.price.toFixed(2)}</span>
                              {vendor && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-650 font-bold">Store: {vendor.vendorName}</span>
                                </>
                              )}
                            </div>
                            
                            {/* Merchant receiving payment info details */}
                            {vendor && (vendor.zaadNumber || vendor.edahabNumber) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2 bg-white/75 border border-slate-150 rounded-lg p-2 max-w-sm sm:max-w-md">
                                <span className="text-[8.5px] font-mono uppercase tracking-wider text-slate-400 block font-bold mr-1">Direct Vendor Pay Info:</span>
                                {vendor.zaadNumber && (
                                  <span className="text-[9.5px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded font-bold">Zaad: <strong className="select-all underline cursor-help">{vendor.zaadNumber}</strong></span>
                                )}
                                {vendor.edahabNumber && (
                                  <span className="text-[9.5px] font-mono text-amber-800 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded font-bold">Edahab: <strong className="select-all underline cursor-help">{vendor.edahabNumber}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status for this vendor's item */}
                        <div className="flex flex-col items-start sm:items-end shrink-0 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Fulfillment status</span>
                          <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${
                            itemStatus === 'delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' :
                            itemStatus === 'shipped' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' :
                            itemStatus === 'processing' ? 'bg-amber-50 border-amber-205 text-amber-800' :
                            'bg-slate-100 border-slate-205 text-slate-600'
                          }`}>
                            {itemStatus === 'shipped' ? '🚚 Out for delivery' : itemStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Update History Log list */}
              <div className="space-y-4 text-left border-t border-slate-100 pt-6">
                <h4 className="font-semibold text-xs text-slate-800">Carrier Scan logs</h4>
                <div className="space-y-3.5 relative pl-4 border-l border-slate-200 font-sans">
                  {selectedOrder.statusHistory.map((sh, idx) => (
                    <div key={idx} className="relative">
                      {/* Visual pointer bulp icon */}
                      <span className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-white shadow-sm"></span>
                      <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                        <div>
                          <span className="capitalize font-bold text-indigo-700 text-[10px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded mr-2 uppercase">{sh.status}</span>
                          <span className="text-slate-700 font-medium">{sh.note || 'No carrier scanner comments recorded'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 sm:mt-0">{new Date(sh.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery meta parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-xs text-slate-500">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-800 uppercase text-[9px] font-mono tracking-wider mb-1">Destination Shipping</span>
                    <span className="block font-medium">{selectedOrder.shippingAddress.fullName}</span>
                    <span className="block text-slate-500">{selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}, {selectedOrder.shippingAddress.country}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-800 uppercase text-[9px] font-mono tracking-wider mb-1">Estimated delivery time bounds</span>
                    <span className="block font-medium">{new Date(selectedOrder.estimatedDelivery).toLocaleDateString()} at Villa</span>
                    <span className="block select-none text-[10px] text-slate-400 mt-1">Carried via fast local post air-channel.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Sub View: Print Invoice layout Simulation */}
          {invoiceOrder && (
            <div id="invoice-bill-print-modal-wrapper" className="bg-white rounded p-6 sm:p-8 border border-slate-200 mb-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-center no-print border-b border-slate-100 pb-4">
                <button 
                  onClick={() => setInvoiceOrder(null)} 
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  ← Back to History
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" /> Save as PDF / Print official receipt
                  </button>
                </div>
              </div>

              {/* Paper styled block layout */}
              <div id="invoice-bill-print" className="p-6 sm:p-8 bg-white text-black rounded border border-slate-200 border-t-8 border-indigo-600 select-all shadow-lg max-w-3xl mx-auto font-sans">
                
                {/* Invoice Header Branding */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-dashed border-slate-200">
                  <div className="space-y-2.5">
                    {/* Official SuuqHub Logo */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 shrink-0 bg-indigo-50/80 rounded-lg p-1 border border-indigo-205">
                        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Store awning stripes */}
                          <path d="M12 20 L23 42 C24 44 21 47 18 47 C15 47 12 44 13 42 L12 20 Z" fill="#0e75cc" />
                          <path d="M30 20 L33 42 C34 44 31 47 28 47 C25 47 22 44 23 42 L30 20 Z" fill="#7ebd24" />
                          <path d="M48 20 L44 42 C43 44 40 47 37 47 C34 47 32 44 33 42 L41 20 Z" fill="#0e75cc" />
                          <path d="M66 20 L59 42 C58 44 55 47 52 47 C49 47 47 44 48 42 L60 20 Z" fill="#7ebd24" />
                          <path d="M84 20 L74 42 C73 44 70 47 67 47 C64 47 62 44 63 42 L78 20 Z" fill="#0e75cc" />
                          {/* Store base structure */}
                          <path d="M16 47 L16 80 C16 84 20 86 24 86 L76 86 C80 86 84 84 84 80 L84 47" stroke="#0e75cc" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          {/* Pinpoint overlay */}
                          <path d="M50 40 C38 40 33 48 33 58 C33 71 50 87 50 87 C50 87 67 71 67 58 C67 48 62 40 50 40 Z" fill="#7ebd24" />
                          <circle cx="50" cy="54" r="5" fill="#ffffff" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-display font-black text-lg tracking-tight uppercase block text-slate-900 leading-none">SUUQHUB</span>
                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-indigo-600 block mt-0.5">SMART MARKET PLACE</span>
                      </div>
                    </div>
                    
                    {/* Official HQ Address */}
                    <div className="text-xs text-slate-500 font-sans space-y-0.5 leading-relaxed text-left">
                      <p className="font-bold text-slate-800">SuuqHub Global Logistics Hub</p>
                      <p>Wadaada Avenue, Near Central Mosque</p>
                      <p className="text-indigo-600 font-semibold">Hargeisa, Somaliland</p>
                      <p className="text-[10px] font-mono">Web: www.suuqhub.com | Tel: +252-63-4400000</p>
                    </div>
                  </div>

                  {/* Receipt Meta */}
                  <div className="text-left md:text-right space-y-1 md:w-auto w-full border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                    <h1 className="font-display font-black text-xs uppercase tracking-wider bg-indigo-50 text-indigo-805 px-3 py-1.5 rounded-md inline-block text-[11px] mb-2 font-black">
                      SUUQHUB Marketplace Receipt
                    </h1>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="text-[9px] text-slate-400 font-mono block">RECEIPT REFERENCE</span>
                        <span className="font-mono font-bold text-xs text-slate-900">{invoiceOrder.id.toUpperCase()}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[9px] text-slate-400 font-mono block">TRANSACTION DATE</span>
                        <span className="font-mono text-xs text-slate-800 font-semibold">{new Date(invoiceOrder.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[9px] text-slate-400 font-mono block">HANDOVER DESIGNATION</span>
                        <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                          invoiceOrder.deliveryMethod === 'pickup'
                            ? 'bg-teal-50 border-teal-200 text-teal-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          {invoiceOrder.deliveryMethod === 'pickup' ? '🛒 Self Pickup (Free)' : '🚚 Home Delivery'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 border-b border-slate-150 text-left text-xs text-slate-600">
                  <div className="space-y-1">
                    <span className="block text-[9.5px] text-slate-400 uppercase font-mono tracking-widest font-bold">CLIENT / RECIPIENT BILL TO:</span>
                    <p className="font-bold text-slate-800 text-sm">{invoiceOrder.shippingAddress.fullName}</p>
                    <p className="text-[12px] font-medium text-slate-550 leading-relaxed max-w-xs">
                      {invoiceOrder.shippingAddress.addressLine1}, {invoiceOrder.shippingAddress.city}, {invoiceOrder.shippingAddress.state}, {invoiceOrder.shippingAddress.country}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="text-[9.5px] text-slate-400 font-mono">Registered Contact:</span>
                      <span className="font-mono text-slate-800 font-semibold">{invoiceOrder.shippingAddress.phone}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 md:text-right md:items-end flex flex-col">
                    <span className="block text-[9.5px] text-slate-400 uppercase font-mono tracking-widest font-bold">PAYMENT DETAILS & VERIFICATION:</span>
                    <p className="font-bold text-slate-850 font-sans text-xs">{invoiceOrder.paymentMethod}</p>
                    {invoiceOrder.mobilePayment && (
                      <div className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-150 p-2 rounded-lg text-left md:text-right mt-1.5 w-full leading-snug space-y-0.5">
                        <p className="font-bold text-slate-700">Mobile Transfer Logged:</p>
                        <p>Txn ID: <span className="font-bold text-indigo-600 underline select-all">{invoiceOrder.mobilePayment.transactionNumber}</span></p>
                        <p>Sender Phone: {invoiceOrder.mobilePayment.senderNumber}</p>
                        <p>Sender Name: {invoiceOrder.mobilePayment.senderName}</p>
                        <p className="text-[9px] text-slate-400">Date: {invoiceOrder.mobilePayment.dateTime}</p>
                      </div>
                    )}
                    <div className="pt-1">
                      <span className="text-emerald-700 font-black uppercase text-[10px] font-mono bg-emerald-50 border border-emerald-200 inline-block px-3 py-1 rounded shadow-3xs">
                        🛡️ PAID & SECURED IN FULL
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 italic">SuuqHub transaction settled under Abu Dhabi logistics & gateway codes.</p>
                  </div>
                </div>

                {/* Items Detailed Table */}
                <div className="py-5 space-y-3.5">
                  <span className="block text-left text-[9.5px] text-slate-400 uppercase font-mono tracking-widest font-bold">ITEMIZED TRANSACTION BREAKDOWN:</span>
                  <div className="space-y-2 border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 font-bold text-[9px] font-mono bg-slate-50 text-slate-500 uppercase tracking-wider p-3 border-b border-slate-200">
                      <span className="col-span-6 text-left">Product Title / Merchant Offer</span>
                      <span className="col-span-2 text-center">Unit Price</span>
                      <span className="col-span-2 text-center">Quantity</span>
                      <span className="col-span-2 text-right">Extended Value</span>
                    </div>
                    {invoiceOrder.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-slate-705 p-3 text-xs text-left items-center hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
                        <div className="col-span-6 text-left leading-snug">
                          <span className="font-bold text-slate-800 text-xs block">{item.title}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.selectedColor ? (
                              <span className="text-[9px] font-mono bg-slate-105 bg-slate-100 text-slate-550 border border-slate-200 px-1.5 py-0.2 rounded font-semibold">
                                Color: {item.selectedColor}
                              </span>
                            ) : null}
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 rounded font-bold">SKU Ref: {item.productId?.slice(-5).toUpperCase() || 'CATALOG'}</span>
                          </div>
                        </div>
                        <span className="col-span-2 text-center font-mono font-medium text-slate-600">${item.price}</span>
                        <span className="col-span-2 text-center font-mono font-bold text-slate-900 bg-slate-100 inline-block max-w-[40px] mx-auto py-0.5 rounded border border-slate-200 text-center">{item.quantity}</span>
                        <span className="col-span-2 text-right font-mono font-extrabold text-slate-950">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals & Signature Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-dashed border-slate-205">
                  
                  {/* Left Column: Official Stamp and Signature Seal */}
                  <div className="flex items-center gap-4 text-left p-4 bg-slate-50/70 border border-slate-150 rounded-lg relative overflow-hidden select-none">
                    <div className="w-16 h-16 opacity-85 shrink-0">
                      {/* Interactive Gold Verification Stamp */}
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none" xmlns="http://www.w3.org/2005/svg">
                        <circle cx="50" cy="50" r="46" stroke="#047857" strokeWidth="3" strokeDasharray="4 2" />
                        <circle cx="50" cy="50" r="40" stroke="#047857" strokeWidth="1" />
                        <path d="M26,50 C26,50 36,65 50,65 C64,65 74,50 74,50" stroke="#047857" strokeWidth="2.5" />
                        <polygon points="53,23 57,32 67,34 60,42 62,52 53,47 44,52 46,42 39,34 49,32" fill="#d4af37" />
                        <text x="50" y="80" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">VERIFIED</text>
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-bold uppercase font-mono tracking-wider block text-slate-800">SUUQHUB Official Audit Seal</span>
                      <p className="text-[10px] text-slate-500 font-sans leading-tight">
                        Secured through Hargeisa digital gateway clearance. This serves as an official proof of ownership voucher.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Numeric Summary breakdown */}
                  <div className="space-y-2 text-xs font-semibold leading-relaxed text-slate-700">
                    <div className="flex justify-between font-sans border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Cart Subtotal:</span>
                      <span className="font-mono text-slate-800">${invoiceOrder.subtotal}</span>
                    </div>
                    {invoiceOrder.discount > 0 ? (
                      <div className="flex justify-between text-emerald-650 border-b border-slate-100 pb-1.5 font-bold">
                        <span>Applied Discount Coupon:</span>
                        <span className="font-mono text-emerald-700">-${invoiceOrder.discount}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Logistics & Handling:</span>
                      <span className="font-mono text-slate-800">${invoiceOrder.shippingCost}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Registered VAT (5%):</span>
                      <span className="font-mono text-slate-800">${invoiceOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 text-slate-900 border-t border-slate-400">
                      <span className="font-bold text-sm uppercase tracking-tight text-slate-900">Total Balance Paid:</span>
                      <span className="font-mono text-indigo-600 text-lg font-black tracking-tight">${invoiceOrder.total.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Footer terms */}
                <div className="text-center font-mono text-[9px] text-slate-400 mt-8 pt-4 border-t border-slate-200 uppercase tracking-widest leading-loose">
                  <p>© 2026 SUUQHUB LOGISTICS & MARKETPLACE SYSTEMS CORP</p>
                  <p>THANK YOU FOR YOUR PATRONAGE • LAND OF HONEST MERCHANT COOPERATIVES • HARGEISA, SOMALILAND</p>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Helpdesk system CRM */}
          {activeMenu === 'tickets' && !selectedTicket && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-sans font-bold text-lg text-slate-900 tracking-tight">Support CRM Help Center</h2>
                <span className="text-[11px] text-slate-400 flex items-center gap-1"><Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" /> Active support node</span>
              </div>

              {/* Tickets list */}
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <p className="p-8 text-center bg-white border border-slate-200 rounded text-slate-400 text-xs">No active help request tickets filed</p>
                ) : (
                  tickets.map((tkt) => (
                    <div key={tkt.id} className="bg-white border border-slate-200 p-4 rounded flex items-center justify-between text-left hover:border-indigo-400 transition shadow-xs">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Ticket code #{tkt.id}</span>
                        <h4 className="font-semibold text-slate-800 text-xs mt-0.5">{tkt.subject}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Total thread replies: {tkt.messages.length}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          tkt.status === 'open' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>{tkt.status}</span>
                        <button
                          onClick={() => setSelectedTicket(tkt)}
                          className="px-3 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs rounded transition text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Open Chat
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Ticket Form */}
              <form onSubmit={handleCreateTicket} className="bg-white p-6 rounded border border-slate-200 space-y-4 text-left shadow-sm">
                <h3 className="font-bold text-xs text-slate-700 block uppercase tracking-wider mb-2">Request help from CRM center</h3>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Subject of issue</label>
                  <input
                    required
                    type="text"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="e.g., Return code queries"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Detailed Message explaining request</label>
                  <textarea
                    required
                    rows={3}
                    value={newTicketMsg}
                    onChange={(e) => setNewTicketMsg(e.target.value)}
                    placeholder="Write detailed questions here"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="w-full py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-indigo-700 transition cursor-pointer"
                >
                  {creatingTicket ? 'Sending...' : 'File Support Help Request'}
                </button>
              </form>
            </div>
          )}

          {/* Selected CRM chat thread replies panel */}
          {selectedTicket && (
            <div className="bg-white rounded p-6 sm:p-8 border border-slate-200 flex flex-col h-[500px] shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <button onClick={() => setSelectedTicket(null)} className="text-xs text-slate-400 hover:text-slate-800 mb-1.5 cursor-pointer flex items-center gap-1">← Back to tickets</button>
                  <h3 className="font-semibold text-sm text-slate-800">Subject thread: "{selectedTicket.subject}"</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">#{selectedTicket.id}</span>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs flex flex-col">
                {selectedTicket.messages.map((m, idx) => (
                  <div key={idx} className={`max-w-[75%] p-3.5 rounded ${m.sender === 'user' ? 'bg-indigo-600 text-white self-end ml-auto' : 'bg-slate-100 text-slate-700 mr-auto text-left'}`}>
                    <p className="leading-relaxed">{m.text}</p>
                    <span className={`block text-[8px] font-mono mt-1 text-right ${m.sender === 'user' ? 'text-white/65' : 'text-slate-400'}`}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>

              {/* Replies Entry form */}
              <form onSubmit={handleSendTicketReply} className="flex gap-2.5 border-t border-slate-100 pt-4.5">
                <input
                  required
                  type="text"
                  value={ticketReplyMsg}
                  onChange={(e) => setTicketReplyMsg(e.target.value)}
                  placeholder="Enter message replies..."
                  className="flex-grow text-xs bg-slate-50 border border-slate-200 rounded px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Customer profile addresses detail compilation */}
          {activeMenu === 'profile' && (
            <div className="bg-white rounded p-6 border border-slate-200 space-y-6 text-left text-xs text-slate-600 shadow-sm">
              <h3 className="font-sans font-bold text-base text-slate-900">Profile & Address Manager</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded border border-slate-200">
                  <span className="block font-bold text-[10px] uppercase font-mono tracking-wider mb-2 text-slate-400">Personal Details</span>
                  <p className="text-slate-800 font-semibold mb-1">Salem Al-Mansoori</p>
                  <p className="text-slate-500 font-mono">salem@mideast.com</p>
                </div>

                <div className="p-4 bg-slate-50 rounded border border-slate-200">
                  <span className="block font-bold text-[10px] uppercase font-mono tracking-wider mb-2 text-slate-400">Settings Config</span>
                  <div className="flex gap-4">
                    <span>Lang: <span className="text-indigo-600 font-bold font-mono">EN</span></span>
                    <span>Cur: <span className="text-indigo-600 font-bold font-mono">USD</span></span>
                  </div>
                </div>
              </div>

              <div>
                <span className="block font-bold text-[10px] uppercase font-mono tracking-wider mb-2 text-slate-400">Saved Villa Addresses</span>
                <div className="p-4 bg-slate-50 rounded border border-slate-200 relative">
                  <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">Default address</span>
                  <p className="font-semibold text-slate-850">Villa 14, Al Bateen Area</p>
                  <p className="text-slate-500 mt-1">Abu Dhabi, United Arab Emirates</p>
                  <p className="text-slate-500 font-mono mt-1">+971 50 123 4567</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
