/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, DollarSign, Users, Award, TrendingUp, Check, Play, Trash2, Edit, Save, Plus, Loader2, Lock, Key, Eye, EyeOff, ShieldCheck, RefreshCw, Search, SlidersHorizontal, Store, Clock, ArrowRight, AlertCircle, MapPin, User, CreditCard, Copy, Sparkles, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, Order, Coupon, SupportTicket, OrderStatus, Vendor, HeroCampaign } from '../types';
import { formatPrice } from '../utils';

interface AdminPortalProps {
  userId: string;
  lang: 'en' | 'ar' | 'es';
  currency: 'USD' | 'EUR' | 'AED';
  userRole?: string;
}

export default function AdminPortal({
  userId,
  lang,
  currency,
  userRole
}: AdminPortalProps) {
  // DB states from Express
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [salesReport, setSalesReport] = useState<{ date: string; sales: number; orders: number }[]>([]);
  const [deliveryManagers, setDeliveryManagers] = useState<any[]>([]);

  // Delivery Manager creation form states
  const [dmName, setDmName] = useState('');
  const [dmEmail, setDmEmail] = useState('');
  const [dmPassword, setDmPassword] = useState('');
  const [dmSuccess, setDmSuccess] = useState('');
  const [dmError, setDmError] = useState('');
  const [dmLoading, setDmLoading] = useState(false);

  // Expanded state for delivery orders row redesign
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);

  // Active sub tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'vendors' | 'orders' | 'coupons' | 'tickets' | 'campaigns' | 'delivery' | 'ledger'>('analytics');

  useEffect(() => {
    if (userRole === 'delivery_manager') {
      setActiveTab('delivery');
    }
  }, [userRole]);

  // Campaign auditing states
  const [heroCampaigns, setHeroCampaigns] = useState<HeroCampaign[]>([]);
  const [auditingCampaignId, setAuditingCampaignId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // Coupon form states
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState('10');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');

  // Ticket processing state
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [replyTextMsg, setReplyTextMsg] = useState('');

  // Editing state for products
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductStock, setEditProductStock] = useState<number>(0);

  // Vendor Credentials Management States
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempRepName, setTempRepName] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  // Delivery Fee administration state variables
  const [deliveryFee, setDeliveryFee] = useState<number>(15);
  const [newDeliveryFeeText, setNewDeliveryFeeText] = useState<string>('15');
  const [enableCard, setEnableCard] = useState<boolean>(true);
  const [enableCod, setEnableCod] = useState<boolean>(true);
  const [enableZaad, setEnableZaad] = useState<boolean>(true);
  const [enableEdahab, setEnableEdahab] = useState<boolean>(true);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [updatingLogistics, setUpdatingLogistics] = useState<boolean>(false);

  // Search and filtered orders
  const [orderQuery, setOrderQuery] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [orderMethodFilter, setOrderMethodFilter] = useState<'all' | 'pickup' | 'delivery'>('delivery');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, [userId]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes, cRes, tRes, sRes, vRes, dRes, dmRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/coupons'),
        fetch('/api/tickets'),
        fetch('/api/reports/sales'),
        fetch('/api/vendors'),
        fetch('/api/delivery-config'),
        fetch('/api/delivery-managers')
      ]);

      const pData = await pRes.json();
      const oData = await oRes.json();
      const cData = await cRes.json();
      const tData = await tRes.json();
      const sData = await sRes.json();
      const vData = await vRes.json();
      const dData = await dRes.json();
      const dmData = dmRes.ok ? await dmRes.json() : [];

      setProducts(pData);
      setOrders(oData);
      setCoupons(cData);
      setTickets(tData);
      setSalesReport(sData);
      setVendors(vData);
      setDeliveryManagers(dmData);
      setDeliveryFee(dData.deliveryFee ?? 15);
      setNewDeliveryFeeText(String(dData.deliveryFee ?? 15));
      setEnableCard(dData.enableCard !== false);
      setEnableCod(dData.enableCod !== false);
      setEnableZaad(dData.enableZaad !== false);
      setEnableEdahab(dData.enableEdahab !== false);
      setGeminiApiKey(dData.geminiApiKey ?? '');

      await fetchHeroCampaigns();
    } catch (err) {
      console.error('Error synchronizing admin datastore:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaymentMethod = async (method: 'card' | 'cod' | 'zaad' | 'edahab', enabled: boolean) => {
    try {
      setUpdatingLogistics(true);
      const payload: any = {};
      if (method === 'card') payload.enableCard = enabled;
      else if (method === 'cod') payload.enableCod = enabled;
      else if (method === 'zaad') payload.enableZaad = enabled;
      else if (method === 'edahab') payload.enableEdahab = enabled;

      const res = await fetch('/api/delivery-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setEnableCard(data.enableCard !== false);
        setEnableCod(data.enableCod !== false);
        setEnableZaad(data.enableZaad !== false);
        setEnableEdahab(data.enableEdahab !== false);
      }
    } catch (err) {
      console.error('Error updating payment method toggle:', err);
    } finally {
      setUpdatingLogistics(false);
    }
  };

  const handleUpdateDeliveryFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const feeVal = parseFloat(newDeliveryFeeText);
    if (isNaN(feeVal) || feeVal < 0) {
      alert("Please enter a valid positive delivery fee amount.");
      return;
    }

    setUpdatingLogistics(true);
    try {
      const res = await fetch('/api/delivery-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee: feeVal })
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveryFee(data.deliveryFee);
        // Refresh orders
        const oRes = await fetch('/api/orders');
        const oData = await oRes.json();
        setOrders(oData);
      } else {
        alert("Failed to save delivery price.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingLogistics(false);
    }
  };

  const handleSaveGeminiApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingLogistics(true);
    try {
      const res = await fetch('/api/delivery-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey })
      });
      if (res.ok) {
        const data = await res.json();
        setGeminiApiKey(data.geminiApiKey ?? '');
        alert("Client-Side Gemini API Key for Hostinger saved successfully!");
      } else {
        alert("Failed to save Gemini key.");
      }
    } catch (err) {
      console.error('Error saving Gemini API key:', err);
    } finally {
      setUpdatingLogistics(false);
    }
  };

  const filteredAndSortedOrders = React.useMemo(() => {
    let list = [...orders];

    if (orderQuery.trim()) {
      const q = orderQuery.toLowerCase();
      list = list.filter(o => 
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.shippingAddress?.phone || '').toLowerCase().includes(q) ||
        (o.paymentMethod || '').toLowerCase().includes(q) ||
        (o.mobilePayment?.transactionNumber || '').toLowerCase().includes(q)
      );
    }

    if (orderStatusFilter !== 'all') {
      list = list.filter(o => o.status === orderStatusFilter);
    }

    if (orderMethodFilter !== 'all') {
      list = list.filter(o => o.deliveryMethod === orderMethodFilter);
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    });
  }, [orders, orderQuery, orderStatusFilter, orderMethodFilter]);

  const fetchHeroCampaigns = async () => {
    try {
      const res = await fetch('/api/hero-campaigns');
      if (res.ok) {
        const data = await res.json();
        setHeroCampaigns(data);
      }
    } catch (err) {
      console.error('Failed to load hero campaigns error:', err);
    }
  };

  const handleUpdateCampaignStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const res = await fetch(`/api/hero-campaigns/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (res.ok) {
        setAuditingCampaignId(null);
        setRejectReasonText('');
        await fetchHeroCampaigns();
      } else {
        alert('Failed to update campaign status.');
      }
    } catch (err) {
      console.error('Failed to update campaign:', err);
    }
  };

  // Vendor account approvals
  const handleUpdateVendorStatus = async (vendorId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/vendors/${vendorId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchAdminData();
      } else {
        const errDetail = await res.json().catch(() => ({}));
        alert(`Failed to update vendor status: ${errDetail.error || 'Unknown error occurred.'}`);
      }
    } catch (err) {
      console.error('Error updating vendor status:', err);
      alert('An error occurred while updating the vendor status.');
    }
  };

  const handleUpdateVendorCredentials = async (vendorId: string, email: string, password?: string, representativeName?: string) => {
    setUpdatingCredentials(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, representativeName })
      });
      if (res.ok) {
        await fetchAdminData();
        return true;
      } else {
        const errData = await res.json();
        alert(errData.error || 'Credentials update failed.');
        return false;
      }
    } catch (err) {
      console.error('Error updating vendor credentials:', err);
      return false;
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const handleCreateDeliveryManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmName || !dmEmail || !dmPassword) {
      setDmError("All fields are strictly required.");
      return;
    }
    setDmLoading(true);
    setDmError('');
    setDmSuccess('');
    try {
      const res = await fetch('/api/delivery-managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: dmName, email: dmEmail, password: dmPassword, role: 'delivery_manager' })
      });
      if (res.ok) {
        setDmSuccess("Delivery Manager account registered successfully!");
        setDmName('');
        setDmEmail('');
        setDmPassword('');
        await fetchAdminData();
      } else {
        const err = await res.json();
        setDmError(err.error || "Failed to register delivery manager.");
      }
    } catch (err) {
      setDmError("Network connectivity issue.");
    } finally {
      setDmLoading(false);
    }
  };

  // Vendor Approval action
  const handleApproveProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true })
      });

      if (res.ok) {
        await fetchAdminData();
      } else {
        const errDetail = await res.json().catch(() => ({}));
        alert(`Failed to approve product: ${errDetail.error || 'Unknown error occurred.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while approving the product.');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAdminData();
      } else {
        const errDetail = await res.json().catch(() => ({}));
        alert(`Failed to delete product: ${errDetail.error || 'Unknown error occurred.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting the product.');
    }
  };

  const handleUpdateStock = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: editProductStock })
      });

      if (res.ok) {
        setEditingProductId(null);
        await fetchAdminData();
      } else {
        const errDetail = await res.json().catch(() => ({}));
        alert(`Failed to update stock: ${errDetail.error || 'Unknown error occurred.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating the stock.');
    }
  };

  // Fulfillment state transition trigger
  const handleTransitionOrderStatus = async (id: string, status: OrderStatus, noteText?: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: noteText || `Approved and processed by administrative center` })
      });

      if (res.ok) {
        await fetchAdminData();
      } else {
        const errDetail = await res.json().catch(() => ({}));
        alert(`Failed to update order status: ${errDetail.error || 'Unknown error occurred.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating the order status.');
    }
  };

  const handleAuditRemittance = async (orderId: string, remittanceStatus: 'confirmed' | 'owed') => {
    try {
      const res = await fetch(`/api/orders/${orderId}/remittance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryFeeRemittanceStatus: remittanceStatus
        })
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error('Error auditing logistics remittance:', err);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode,
          discountType: newCouponType,
          value: Number(newCouponVal),
          minSpend: 50,
          expiryDate: '2026-12-31'
        })
      });

      if (res.ok) {
        setNewCouponCode('');
        setNewCouponVal('10');
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // File support thread replies
  const handleSupportTicketReply = async (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!replyTextMsg) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'support',
          text: replyTextMsg
        })
      });

      if (res.ok) {
        setReplyTextMsg('');
        setReplyTicketId(null);
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Computed metrics
  const totalSales = orders
    .filter(o => o.paymentStatus === 'paid' || o.paymentMethod === 'Cash on Delivery')
    .reduce((sum, ord) => sum + ord.total, 0);

  const pendingSubmissions = products.filter(p => !p.isApproved).length;
  const pendingVendorsCount = vendors.filter(v => v.status === 'pending').length;

  // Render responsive SVG dashboard charts (completely lightweight, highly interactive)
  const maxDayVal = salesReport.length > 0 ? Math.max(...salesReport.map(d => d.sales)) : 5000;
  const chartHeight = 160;
  const chartWidth = 500;

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-2 font-mono text-xs">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span>Synchronizing superadmin database credentials...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-left space-y-6 select-none font-sans">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-205">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">SuuqHub Administration Command</h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Centralized command controller for multi-vendor catalog auditing, billing structures, client CRM tickets, and site-wide marketing slides.</p>
        </div>
        <div className="mt-3 md:mt-0 flex items-center gap-2 md:self-end">
          <button
            onClick={() => fetchAdminData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-205 rounded-lg cursor-pointer shadow-3xs active:scale-95 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-505 ${loading ? 'animate-spin' : ''}`} />
            Sync Database
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-750 rounded border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            Session: {userRole === 'delivery_manager' ? 'Delivery Logistics Manager' : 'System Superadmin'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-8">
          
          {/* Quick Menu */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest font-mono">Control Terminals</span>
            
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'analytics', label: 'Executive Analytics', count: 0, desc: 'Gross revenue tracking' },
                { id: 'products', label: 'Inventory & Approvals', count: pendingSubmissions, desc: 'Vendor product audit' },
                { id: 'vendors', label: 'Vendor Approvals', count: pendingVendorsCount, desc: 'Staff & Seller profiles' },
                { id: 'delivery', label: 'Home Delivery Logistics', count: orders.filter(o => o.deliveryMethod === 'delivery' && o.status !== 'delivered').length, desc: 'Sortable deliveries, flat rates & packing checklists' },
                { id: 'ledger', label: 'Merchant Payout Ledger', count: orders.filter(o => o.deliveryMethod === 'delivery' && o.deliveryFeeRemittanceStatus === 'submitted').length, desc: 'Approve cellular mobile remittance receipts' },
                { id: 'orders', label: 'Store Self-Pickup Clearance', count: orders.filter(o => o.deliveryMethod === 'pickup' && o.status !== 'delivered').length, desc: 'Customer storefront handover' },
                { id: 'campaigns', label: 'Store Slider Showcase', count: heroCampaigns.filter(c => c.status === 'pending').length, desc: 'Hero slider banners' },
                { id: 'coupons', label: 'Vouchers & Coupons', count: coupons.length, desc: 'Store-wide active promotions' },
                { id: 'tickets', label: 'CRM Help Tickets', count: tickets.filter(t => t.status === 'open').length, desc: 'Consumer support threads' }
              ].filter(subTab => userRole !== 'delivery_manager' || subTab.id === 'delivery' || subTab.id === 'ledger').map((subTab) => {
                const isActive = activeTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => { setActiveTab(subTab.id as any); setReplyTicketId(null); }}
                    className={`w-full text-left cursor-pointer px-3.5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border ${isActive ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm' : 'bg-white text-slate-650 border-slate-200/60 hover:bg-slate-50 hover:text-slate-900 shadow-3xs'}`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-extrabold leading-tight">{subTab.label}</span>
                      <span className={`text-[9.5px] font-normal leading-tight mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400 font-mono'}`}>{subTab.desc}</span>
                    </div>
                    {subTab.count > 0 && (
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded font-black ${isActive ? 'bg-white text-indigo-700' : 'bg-rose-600 text-white animate-pulse'}`}>
                        {subTab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Summary Card on the Sidebar */}
          <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider font-mono">Marketplace Health</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/45 pb-1.5">
                <span className="text-slate-500">Service Status:</span>
                <span className="font-bold text-slate-800">Operational</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/45 pb-1.5">
                <span className="text-slate-500">Administered Shops:</span>
                <span className="font-bold text-indigo-800 font-mono">{vendors.length} Shops</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Gateways:</span>
                <span className="font-mono text-[10px] text-emerald-700 font-extrabold">ONLINE (SECURE)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Dashboard Terminal Content Section */}
        <div className="lg:col-span-9 space-y-6">

          {/* Subheader summary stats row inside content area */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Total Sales Ledger */}
            <div className="bg-white rounded-xl border border-slate-200 p-4.5 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Consolidated Sales</span>
              <span className="text-lg font-sans font-black text-slate-900 mt-1">{formatPrice(totalSales, currency)}</span>
              <span className="text-[9.5px] text-emerald-600 font-medium mt-1 leading-none">Live ledger synced</span>
            </div>

            {/* Total Active orders */}
            <div className="bg-white rounded-xl border border-slate-200 p-4.5 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Fulfillments Routed</span>
              <span className="text-lg font-sans font-black text-slate-900 mt-1">{orders.length} Orders</span>
              <span className="text-[9.5px] text-slate-500 mt-1 leading-none">Global catalog logs</span>
            </div>

            {/* Registered Customer stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-4.5 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">System Consumers</span>
              <span className="text-lg font-sans font-black text-slate-900 mt-1">14 Accounts</span>
              <span className="text-[9.5px] text-indigo-500 font-mono mt-1 leading-none">2 active sessions</span>
            </div>

            {/* Vendor Submissions monitoring */}
            <div className="bg-white rounded-xl border border-slate-200 p-4.5 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Pending Actions</span>
              <span className="text-lg font-sans font-black text-rose-600 mt-1">{pendingSubmissions} Overdues</span>
              <span className="text-[9.5px] text-rose-500 mt-1 leading-none">Needs supervisor stamp</span>
            </div>

          </div>

          {/* Admin Module content container panel */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-slate-700 shadow-sm">
        
        {/* Module 1: Executive Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 border border-slate-200 p-4 rounded gap-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <TrendingUp className="w-4.5 h-4.5 text-indigo-600" /> Revenue Curve (Past 7 Days Transactions)
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Dynamic financial reports automatically synchronized from storefront sales logs.</p>
              </div>
              <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded">Total accounted: <b className="text-slate-800 font-extrabold font-sans">${totalSales.toLocaleString()}</b></span>
            </div>

            {/* Premium Interactive SVG Chart */}
            <div className="relative w-full overflow-x-auto pb-4">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-2xl h-44 mx-auto block overflow-visible">
                {/* Horizontal reference grids */}
                <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2={chartWidth} y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                {/* SVG Curves generator */}
                {salesReport.length > 1 && (
                  <>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area fill path */}
                    <path
                      d={`M 0,${chartHeight - 10} ` + salesReport.map((day, idx) => {
                        const x = (idx / (salesReport.length - 1)) * chartWidth;
                        const y = chartHeight - 10 - (day.sales / maxDayVal) * (chartHeight - 40);
                        return `L ${x},${y}`;
                      }).join(' ') + ` L ${chartWidth},${chartHeight - 10} Z`}
                      fill="url(#salesGrad)"
                    />

                    {/* Line path */}
                    <path
                      d={salesReport.map((day, idx) => {
                        const x = (idx / (salesReport.length - 1)) * chartWidth;
                        const y = chartHeight - 10 - (day.sales / maxDayVal) * (chartHeight - 40);
                        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                    />

                    {/* Highlight dots */}
                    {salesReport.map((day, idx) => {
                      const x = (idx / (salesReport.length - 1)) * chartWidth;
                      const y = chartHeight - 10 - (day.sales / maxDayVal) * (chartHeight - 40);
                      return (
                        <g key={idx} className="group cursor-pointer">
                          <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                          <text x={x} y={y - 12} textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-800 opacity-0 group-hover:opacity-100 transition-opacity bg-white">
                            ${day.sales}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Date Labels */}
                {salesReport.map((day, idx) => {
                  const x = (idx / (salesReport.length - 1)) * chartWidth;
                  return (
                    <text key={idx} x={x} y={chartHeight + 12} textAnchor="middle" className="text-[10px] font-mono fill-slate-400 uppercase">
                      {day.date}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Module 2: Products Listing & Direct approvals */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">Approval Queue & Inventory Control</h3>
            
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-mono text-[9px] text-slate-500">
                  <tr>
                    <th className="p-3">listing details</th>
                    <th className="p-3">sku code</th>
                    <th className="p-3 text-center">price</th>
                    <th className="p-3 text-center">stock units</th>
                    <th className="p-3 text-center">origin seller</th>
                    <th className="p-3 text-right">actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 flex items-center gap-3">
                        <img src={p.image} className="w-8 h-8 rounded bg-slate-50 object-cover border border-slate-200" />
                        <div>
                          <span className="font-semibold text-slate-800 block">{p.title}</span>
                          <span className="text-[10px] text-slate-400">{p.category}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-500">{p.sku}</td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-800">${p.price}</td>
                      
                      {/* Active stock edits inline */}
                      <td className="p-3 text-center text-xs">
                        {editingProductId === p.id ? (
                          <div className="flex gap-1.5 justify-center items-center">
                            <input
                              type="number"
                              size={3}
                              value={editProductStock}
                              onChange={(e) => setEditProductStock(Number(e.target.value))}
                              className="bg-white text-slate-800 p-1 rounded font-mono text-center w-12 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-650"
                            />
                            <button onClick={() => handleUpdateStock(p.id)} className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded cursor-pointer"><Save className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2.5">
                            <span className="font-mono text-slate-700">{p.stock} units</span>
                            <button onClick={() => { setEditingProductId(p.id); setEditProductStock(p.stock); }} className="p-0.5 hover:text-indigo-600 cursor-pointer text-slate-400"><Edit className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center font-mono text-[10px] text-slate-400">
                        {p.vendorName || "In-House Store"}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          {!p.isApproved ? (
                            <button
                              onClick={() => handleApproveProduct(p.id)}
                              className="px-2.5 py-1.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer text-[10px] uppercase"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Live
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-sm text-[9px] uppercase font-mono">Approve active</span>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 p-2 rounded cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Module 2.5: Vendor Approvals */}
        {activeTab === 'vendors' && (
          <div className="space-y-4 font-sans text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">Merchant Registrations & Audits</h3>
            <p className="text-[11px] text-slate-500 max-w-2xl">
              Onboard and verify third-party sellers requesting access to SuuqHub (Smart Market Place) inventory distribution. Pending merchants cannot list products until approved by the platform manager.
            </p>

            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-mono text-[9px] text-slate-500">
                  <tr>
                    <th className="p-3">Merchant / Store Name</th>
                    <th className="p-3">Representative details</th>
                    <th className="p-3">Enterprise Category</th>
                    <th className="p-3">Tax ID</th>
                    <th className="p-3">Onboard date</th>
                    <th className="p-3 text-center">Authorization status</th>
                    <th className="p-3 text-right">Verification Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-mono text-xs">
                        No merchant vendor accounts detected in database.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((v) => (
                      <React.Fragment key={v.id}>
                        <tr className="hover:bg-slate-50/50 transition">
                          <td className="p-3">
                            <div>
                              <span className="block text-xs font-bold text-slate-800">{v.vendorName}</span>
                              <span className="text-[10px] text-slate-450 font-normal">{v.description || "No description supplied."}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="block text-xs font-semibold text-slate-800">{v.representativeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{v.email}</span>
                            {v.password ? (
                              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 font-semibold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">
                                <Lock className="w-2.5 h-2.5 text-emerald-500" /> PASS: {v.password}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 font-semibold mt-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-mono">
                                <Lock className="w-2.5 h-2.5 text-amber-500 animate-pulse" /> PENDING CREDENTIAL SETUP
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{v.category}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{v.taxId || "N/A"}</td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border ${
                              v.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              v.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                              'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Manage credentials */}
                              <button
                                onClick={() => {
                                  if (expandedVendorId === v.id) {
                                    setExpandedVendorId(null);
                                  } else {
                                    setExpandedVendorId(v.id);
                                    setTempEmail(v.email);
                                    setTempPassword(v.password || "");
                                    setTempRepName(v.representativeName);
                                  }
                                }}
                                className={`px-2 py-1 border font-bold rounded cursor-pointer text-[9px] uppercase tracking-wider inline-flex items-center gap-1 transition ${
                                  expandedVendorId === v.id
                                    ? 'bg-indigo-600 border-indigo-700 text-white'
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-indigo-650'
                                }`}
                              >
                                <Key className="w-2.5 h-2.5" /> credentials
                              </button>

                              {v.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateVendorStatus(v.id, 'approved')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer text-[9px] uppercase tracking-wider"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateVendorStatus(v.id, 'rejected')}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer text-[9px] uppercase tracking-wider"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-bold uppercase font-mono mr-1">audited</span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expander credentials panel block */}
                        {expandedVendorId === v.id && (
                          <tr className="bg-slate-50/50 animate-fadeIn" id={`vendor-creds-expand-${v.id}`}>
                            <td colSpan={7} className="p-4 bg-indigo-50/20 border-t border-b border-indigo-100">
                              <div className="max-w-2xl space-y-3.5 text-left p-4 border border-indigo-100 bg-white rounded shadow-sm relative mx-auto my-1">
                                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide">
                                  <Key className="w-3.5 h-3.5 text-indigo-600" /> Vendor Account & Owner System Credentials
                                </h4>
                                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                                  Super Admins manage corporate access keys for each storefront merchant here. These credentials synchronize in real-time. Modifying the entries will allow the vendor representative to immediately access their private catalogue dashboard.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                  <div>
                                    <label className="block text-[9px] font-mono uppercase bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded w-fit mb-1">Representative Name</label>
                                    <input
                                      type="text"
                                      value={tempRepName}
                                      onChange={(e) => setTempRepName(e.target.value)}
                                      className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans text-slate-800"
                                      placeholder="e.g. Sarah Connor"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-mono uppercase bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded w-fit mb-1">Login Email Address</label>
                                    <input
                                      type="email"
                                      value={tempEmail}
                                      onChange={(e) => setTempEmail(e.target.value)}
                                      className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans font-medium text-slate-800"
                                      placeholder="e.g. sarah@globaltrader.com"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-mono uppercase bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded w-fit mb-1">Password Credentials Token</label>
                                    <div className="relative">
                                      <input
                                        type={showPasswordMap[v.id] ? "text" : "password"}
                                        value={tempPassword}
                                        onChange={(e) => setTempPassword(e.target.value)}
                                        className="w-full text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded pl-2 pr-10 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono text-slate-850"
                                        placeholder="Password token or phrase"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowPasswordMap(prev => ({ ...prev, [v.id]: !prev[v.id] }))}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                                      >
                                        {showPasswordMap[v.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-slate-100">
                                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium border border-emerald-150">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant deployment on changes. Securely mapped.
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedVendorId(null)}
                                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-xs cursor-pointer transition font-medium"
                                    >
                                      Close
                                    </button>
                                    <button
                                      type="button"
                                      disabled={updatingCredentials}
                                      onClick={async () => {
                                        const ok = await handleUpdateVendorCredentials(v.id, tempEmail, tempPassword, tempRepName);
                                        if (ok) {
                                          setExpandedVendorId(null);
                                        }
                                      }}
                                      className="px-4 py-1.5 bg-indigo-605 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs transition"
                                    >
                                      {updatingCredentials ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Mapped Credentials
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Part 2.5B: Delivery Logistics Staff Registries */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 mt-6 border-t border-slate-200">
              {/* Form creation */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left">
                <span className="text-[9px] font-mono uppercase bg-indigo-50 border border-indigo-150 text-indigo-750 font-black px-2.5 py-1 rounded block w-fit mb-3.5 tracking-wider">
                  New Logistics Staff Key
                </span>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Onboard Delivery Manager</h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed mt-1 mb-4">
                  Register specialized logistics operators granted restricted access to only view and process requested home delivery orders.
                </p>

                <form onSubmit={handleCreateDeliveryManager} className="space-y-3">
                  <div>
                    <label className="block text-[9.5px] font-mono uppercase text-slate-500 font-bold mb-1">Full Representative Name</label>
                    <input
                      type="text"
                      required
                      value={dmName}
                      onChange={(e) => setDmName(e.target.value)}
                      placeholder="e.g. Abdirahman Ali"
                      className="w-full text-xs bg-white border border-slate-205 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans text-slate-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9.5px] font-mono uppercase text-slate-500 font-bold mb-1">Secure Courier Email</label>
                    <input
                      type="email"
                      required
                      value={dmEmail}
                      onChange={(e) => setDmEmail(e.target.value)}
                      placeholder="e.g. ali.delivery@suuqhub.com"
                      className="w-full text-xs bg-white border border-slate-205 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-mono uppercase text-slate-500 font-bold mb-1">Staff Access Password</label>
                    <input
                      type="password"
                      required
                      value={dmPassword}
                      onChange={(e) => setDmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs bg-white border border-slate-205 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono text-slate-800"
                    />
                  </div>

                  {dmError && (
                    <p className="text-[10.5px] text-rose-600 font-medium bg-rose-50 border border-rose-100 p-2 rounded">{dmError}</p>
                  )}
                  {dmSuccess && (
                    <p className="text-[10.5px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 p-2 rounded">{dmSuccess}</p>
                  )}

                  <button
                    type="submit"
                    disabled={dmLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {dmLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Authorize Delivery Manager"}
                  </button>
                </form>
              </div>

              {/* staff list table */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 text-left flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-1 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" /> Authorized Logistics & Courier Managers
                  </h4>
                  <p className="text-[10.5px] text-slate-500 leading-normal mb-4">
                    Active staff profiles registered in the database, with sandboxed access restricted purely to the Home Delivery Logistics panel.
                  </p>

                  <div className="overflow-x-auto border border-slate-150 rounded-lg animate-fadeIn">
                    <table className="w-full text-left font-sans text-[11px] text-slate-650">
                      <thead className="bg-slate-50/80 border-b border-slate-150 font-mono uppercase text-[8.5px] text-slate-450">
                        <tr>
                          <th className="p-3">Staff Profile Name</th>
                          <th className="p-3">Authorized Mail ID</th>
                          <th className="p-3">Credentials Token</th>
                          <th className="p-3">Access Level Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {deliveryManagers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 font-mono text-[10px]">
                              No delivery manager accounts registered yet. Use the form to onboard logistics operators.
                            </td>
                          </tr>
                        ) : (
                          deliveryManagers.map((dm) => (
                            <tr key={dm.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-semibold text-slate-800">{dm.representativeName}</td>
                              <td className="p-3 font-mono text-indigo-600 select-all">{dm.email}</td>
                              <td className="p-3">
                                <span className="font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-600 select-all font-bold">
                                  {dm.password}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] uppercase font-black bg-blue-50 border border-blue-200 text-blue-700 font-mono">
                                  {dm.role}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-indigo-50/30 border border-indigo-100 p-3.5 rounded-xl text-[10.5px] leading-relaxed text-slate-600 mt-4">
                  <span className="font-bold text-indigo-900 block mb-0.5">🔒 Sandboxed Credentials Policy</span>
                  Delivery staff credentials bypass standard customer checks to provide an instant local portal view centered uniquely around requested home delivery order queues.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module 3: Active Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">Fulfillment orders routing center</h3>
            
            {/* Logistics master control section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              
              {/* Shipping fee configuration */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left flex flex-col justify-between shadow-3xs">
                <div>
                  <span className="text-[10px] font-mono text-indigo-700 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    🛡️ SuuqHub Global Logistics Master Control
                  </span>
                  <p className="text-xs font-sans text-slate-600 leading-relaxed mt-2">
                    Set a flat delivery rate applied universally across all multi-vendor orders. Customers choosing <b>Home Delivery</b> will pay this fee, while <b>Self Pickup</b> remains entirely free ($0 USD).
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-xs font-mono text-slate-550">
                    Active Delivery Rate: <b className="text-indigo-600 text-sm font-bold font-mono">${deliveryFee} USD</b>
                  </span>
                  <form onSubmit={handleUpdateDeliveryFee} className="flex gap-2 w-full sm:w-auto sm:max-w-xs">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full sm:w-28 text-xs font-mono px-3 py-1.5 border rounded bg-white border-slate-250 text-slate-800"
                      value={newDeliveryFeeText}
                      onChange={(e) => setNewDeliveryFeeText(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={updatingLogistics}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition whitespace-nowrap active:scale-95 disabled:opacity-50"
                    >
                      {updatingLogistics ? 'Saving...' : 'Set Flat Fee'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Payment methods toggling configuration card */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left space-y-3 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-700 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    💳 Payment Gateway Toggles
                  </span>
                  <p className="text-[11px] font-sans text-slate-500 leading-relaxed mt-1">
                    Toggle active checkout payment methods across the entire platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  
                  {/* Credit Card Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-205 rounded-xl shadow-3xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-850 block leading-tight">Stripe Card Sandbox</span>
                      <span className="text-[9px] text-slate-400 font-mono">Credit / Debit card Pay</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('card', !enableCard)}
                      className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enableCard ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-205 ease-in-out ${enableCard ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                  {/* Cash on Delivery Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-205 rounded-xl shadow-3xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-850 block leading-tight">Cash on Delivery</span>
                      <span className="text-[9px] text-slate-400 font-mono">Collect bill upon arrival</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('cod', !enableCod)}
                      className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enableCod ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-205 ease-in-out ${enableCod ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                  {/* Zaad Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-205 rounded-xl shadow-3xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-850 block leading-tight">Zaad Mobile Pay</span>
                      <span className="text-[9px] text-emerald-600 font-mono font-bold">P2P Escrow Transfer</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('zaad', !enableZaad)}
                      className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enableZaad ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-205 ease-in-out ${enableZaad ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                  {/* eDahab Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-205 rounded-xl shadow-3xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-850 block leading-tight">eDahab Wallet Pay</span>
                      <span className="text-[9px] text-amber-700 font-mono font-bold">Mobile Wallet Transfer</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('edahab', !enableEdahab)}
                      className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enableEdahab ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-205 ease-in-out ${enableEdahab ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* Sub-tabs to completely segregate Home Delivery and Self Pickup queues */}
            <div className="flex border border-slate-200/80 bg-slate-100 p-1 rounded-xl shadow-3xs max-w-2xl text-left">
              <button
                type="button"
                onClick={() => {
                  setOrderMethodFilter('delivery');
                  setOrderStatusFilter('all');
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  orderMethodFilter === 'delivery'
                    ? 'bg-indigo-650 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                📦 Home Delivery Logistics Center
                <span className={`text-[10px] ml-1.5 px-2 py-0.5 rounded-full font-mono font-bold ${
                  orderMethodFilter === 'delivery' ? 'bg-indigo-800/60 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {orders.filter(o => o.deliveryMethod !== 'pickup').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderMethodFilter('pickup');
                  setOrderStatusFilter('all');
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  orderMethodFilter === 'pickup'
                    ? 'bg-indigo-650 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Store className="w-4 h-4 shrink-0" />
                🛒 Store Self-Pickup Clearance
                <span className={`text-[10px] ml-1.5 px-2 py-0.5 rounded-full font-mono font-bold ${
                  orderMethodFilter === 'pickup' ? 'bg-indigo-800/60 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {orders.filter(o => o.deliveryMethod === 'pickup').length}
                </span>
              </button>
            </div>

            {/* Search and Filter Row */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-left">
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search order ID, customer name, email, phone, payment ref..."
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-205 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-650 font-sans shadow-3xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex flex-wrap gap-1 bg-slate-200/65 p-1 rounded-lg border border-slate-205">
                  {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map((st) => {
                    const count = orders.filter(o => {
                      const matchMethod = orderMethodFilter === 'all' || o.deliveryMethod === orderMethodFilter;
                      const matchQuery = !orderQuery.trim() || (
                        o.id.toLowerCase().includes(orderQuery.toLowerCase()) ||
                        o.customerName.toLowerCase().includes(orderQuery.toLowerCase()) ||
                        o.customerEmail.toLowerCase().includes(orderQuery.toLowerCase()) ||
                        (o.shippingAddress?.phone || '').toLowerCase().includes(orderQuery.toLowerCase()) ||
                        (o.mobilePayment?.transactionNumber || '').toLowerCase().includes(orderQuery.toLowerCase())
                      );
                      return (st === 'all' || o.status === st) && matchMethod && matchQuery;
                    }).length;
                    
                    return (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider cursor-pointer transition-all ${
                          orderStatusFilter === st
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-305'
                        }`}
                      >
                        {st} <span className="opacity-70 font-mono text-[9px]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Redesigned High-End Bento Dispatch Board */}
            <div className="space-y-6">
              {filteredAndSortedOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-150 text-slate-450 font-mono text-xs">
                  ⚡ No orders matching selected fulfillment queue configurations in record logs.
                </div>
              ) : (
                filteredAndSortedOrders.map((ord) => {
                  // Compute direct item-level vendor details
                  const oBreakdown = (() => {
                    const itemsWithVendorInfo = ord.items.map(item => {
                      const prod = products.find(p => p.id === (item.productId || (item as any).id));
                      const vendor = prod ? vendors.find(v => v.id === prod.vendorId) : null;
                      const vendorStatus = (ord.vendorStatuses && vendor && ord.vendorStatuses[vendor.id]) || ord.status || 'pending';
                      return { ...item, vendor, vendorStatus };
                    });

                    const uniqueVendorsInvolved = Array.from(new Set(
                      itemsWithVendorInfo.map(item => item.vendor?.id).filter(Boolean) as string[]
                    )).map(vId => {
                      const vMeta = vendors.find(v => v.id === vId);
                      const vStatus = ord.vendorStatuses?.[vId] || (ord.status === 'delivered' ? 'delivered' : ord.status === 'shipped' ? 'shipped' : 'pending');
                      return {
                        id: vId,
                        name: vMeta?.vendorName || `Merchant Outlet (${vId.substring(0, 5)})`,
                        status: vStatus
                      };
                    });

                    const isMultiVendor = uniqueVendorsInvolved.length > 1;
                    const approvedVendors = uniqueVendorsInvolved.filter(v => v.status !== 'pending');
                    const pendingVendors = uniqueVendorsInvolved.filter(v => v.status === 'pending');
                    const totalVendorsCount = uniqueVendorsInvolved.length;
                    const approvedCount = approvedVendors.length;

                    const isPartiallyApproved = isMultiVendor && approvedCount > 0 && approvedCount < totalVendorsCount;
                    const allSellersApproved = totalVendorsCount > 0 && approvedCount === totalVendorsCount;

                    return {
                      itemsWithVendorInfo,
                      uniqueVendorsInvolved,
                      isMultiVendor,
                      approvedVendors,
                      pendingVendors,
                      totalVendorsCount,
                      approvedCount,
                      isPartiallyApproved,
                      allSellersApproved
                    };
                  })();

                  // Border styling based on current state
                  let borderLeftColor = 'border-l-4 border-l-amber-500';
                  if (ord.status === 'delivered') borderLeftColor = 'border-l-4 border-l-emerald-500';
                  else if (ord.status === 'shipped') borderLeftColor = 'border-l-4 border-l-indigo-600';
                  else if (oBreakdown.isPartiallyApproved) borderLeftColor = 'border-l-4 border-l-rose-400';

                  return (
                    <div 
                      key={ord.id} 
                      className={`bg-white border border-slate-205 rounded-2xl shadow-3xs hover:shadow-xs transition-all duration-200 overflow-hidden ${borderLeftColor}`}
                    >
                      {/* Top Bar Header */}
                      <div className="bg-slate-50/70 border-b border-slate-200/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-slate-800 tracking-wider flex items-center gap-1.5 text-xs">
                            <Package className="w-4 h-4 text-slate-500 shrink-0" />
                            {ord.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ord.id);
                              setCopiedId(ord.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            className="bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-indigo-650 px-2 py-1 rounded transition flex items-center gap-1 font-mono text-[9px] cursor-pointer"
                            title="Copy Order ID Code"
                          >
                            {copiedId === ord.id ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Copied!
                              </span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 shrink-0" /> Copy ID
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-mono text-slate-450 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {new Date(ord.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded border tracking-wider ${
                            ord.deliveryMethod === 'pickup'
                              ? 'bg-teal-50 border-teal-200 text-teal-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                            {ord.deliveryMethod === 'pickup' ? '🛒 Self Pickup' : '📦 Home Delivery'}
                          </span>
                        </div>
                      </div>

                      {/* Content Grids */}
                      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        
                        {/* Column 1: Purchaser Profile details & Address info */}
                        <div className="lg:col-span-3 space-y-3 pb-5 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-100 lg:pr-5">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-bold">Purchaser Profile</span>
                          
                          <div className="flex items-center gap-2.5">
                            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-3xs shrink-0">
                              {ord.customerName?.[0] || 'U'}
                            </div>
                            <div className="min-w-0 flex-1 leading-snug">
                              <span className="block font-black text-slate-800 text-xs truncate leading-normal">{ord.customerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">{ord.customerEmail}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-[11.5px] text-slate-700 pt-2 border-t border-slate-50">
                            {ord.shippingAddress?.phone && (
                              <p className="flex items-center gap-2 text-slate-700">
                                <span className="text-slate-400 font-mono uppercase text-[9px] font-bold">Phone:</span>
                                <strong className="font-sans font-extrabold select-all">{ord.shippingAddress.phone}</strong>
                              </p>
                            )}

                            {ord.deliveryMethod !== 'pickup' && ord.shippingAddress ? (
                              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mt-2 leading-relaxed text-left space-y-1">
                                <span className="text-[8.5px] font-mono uppercase tracking-wider text-slate-400 block font-bold">Delivery Address:</span>
                                <p className="font-bold text-slate-800 flex items-start gap-1 text-[11px]">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  {ord.shippingAddress.region}, {ord.shippingAddress.city}
                                </p>
                                <p className="text-slate-500 text-[10.5px] leading-relaxed pl-4.5">{ord.shippingAddress.district}, {ord.shippingAddress.streetAddress}</p>
                                {ord.shippingAddress.homeInstructions && (
                                  <div className="bg-indigo-50/60 border border-indigo-100 p-2 rounded text-[10px] text-indigo-800 leading-normal font-sans">
                                    💡 Instruction: <i>"{ord.shippingAddress.homeInstructions}"</i>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-teal-50/45 border border-teal-150 p-3 rounded-xl mt-2 leading-relaxed text-left">
                                <span className="text-[8.5px] font-mono uppercase tracking-wider text-teal-600 block font-bold">Handover Class:</span>
                                <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 text-xs">
                                  <Store className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  Customer Storefront Pickup
                                </p>
                                <p className="text-slate-500 text-[10px] mt-1 leading-normal">Fulfillment cleared strictly in person at the vendor storefront.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Bill Summary & Remittance details */}
                        <div className="lg:col-span-3 space-y-4 pb-5 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-100 lg:px-5">
                          <div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-bold mb-1.5">Basket & Pricing</span>
                            <div className="space-y-1 text-[11px] font-sans">
                              <div className="flex justify-between text-slate-550">
                                <span>Cart Subtotal:</span>
                                <span className="font-mono font-bold text-slate-700">${(ord.total - (ord.shippingCost || 0)).toFixed(2)}</span>
                              </div>
                              {ord.deliveryMethod !== 'pickup' && (
                                <div className="flex justify-between text-indigo-650 font-bold">
                                  <span>Logistics Delivery Fee:</span>
                                  <span className="font-mono">${ord.shippingCost ?? 15}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs pt-2 border-t border-slate-100 font-extrabold text-slate-900">
                                <span className="flex items-center gap-1 text-slate-800"><DollarSign className="w-4 h-4 text-emerald-600 shrink-0" /> Paid Amount:</span>
                                <span className="font-mono text-sm px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg">${ord.total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-bold mb-1.5">Gateway & Reference</span>
                            <span className={`text-[10px] font-mono px-2.5 py-1 rounded border inline-block font-extrabold ${
                              ord.paymentMethod === 'Cash on Delivery' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                              ord.paymentMethod && ord.paymentMethod.includes('Zaad') ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-black' :
                              ord.paymentMethod && ord.paymentMethod.includes('Edahab') ? 'bg-amber-50 text-amber-800 border-amber-200 font-black' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>{ord.paymentMethod}</span>
                            
                            {ord.mobilePayment && (
                              <div className="text-[10px] font-mono text-slate-600 mt-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl leading-relaxed space-y-0.5 text-left">
                                <p className="font-bold flex justify-between">
                                  <span className="text-slate-400 text-[8.5px]">PROVIDER:</span> 
                                  <span className="uppercase text-indigo-700">{ord.mobilePayment.provider}</span>
                                </p>
                                <p className="font-bold flex justify-between">
                                  <span className="text-slate-400 text-[8.5px]">TRANSACTION:</span> 
                                  <span className="underline select-all text-indigo-650 text-[10px] font-black">{ord.mobilePayment.transactionNumber}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-400 text-[8.5px]">SENDER:</span> 
                                  <span className="text-slate-800 font-bold">{ord.mobilePayment.senderNumber}</span>
                                </p>
                                <p className="text-[9px] text-slate-400 text-right mt-1 pt-1 border-t border-slate-200/50">{ord.mobilePayment.dateTime}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Multi-vendor Audits & Order Contents (Col Span 4) */}
                        <div className="lg:col-span-4 space-y-4 pb-5 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-100 lg:px-5 flex flex-col justify-between">
                          <div className="space-y-2 text-left">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-bold">Logistics Basket Contents</span>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {oBreakdown.itemsWithVendorInfo.map((itm, index) => (
                                <div key={index} className="flex gap-2.5 items-center p-2 bg-slate-50/70 border border-slate-150 rounded-xl hover:bg-slate-50/100 transition">
                                  <img 
                                    referrerPolicy="no-referrer"
                                    src={itm.image} 
                                    alt={itm.title} 
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" 
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{itm.title}</p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 leading-none">
                                      <span>Qty: {itm.quantity} • ${itm.price}</span>
                                      {itm.vendor && (
                                        <span className="text-indigo-600 font-bold truncate max-w-[125px]">🏪 {itm.vendor.vendorName}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Multi-Vendor real-time notification alerts (Requested Feature) */}
                          <div className="mt-auto pt-3 border-t border-slate-100/80">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-500 block font-bold mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              Multi-Vendor Dispatch Checklist
                            </span>
                            
                            {oBreakdown.isPartiallyApproved ? (
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] leading-relaxed text-rose-955 space-y-1 shadow-2xs border-l-4 border-l-rose-500">
                                <div className="flex items-start gap-1.5 font-sans font-bold text-rose-800 text-[11px]">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                                  <span>⚠️ PARTIALLY PACKED & AWAITING</span>
                                </div>
                                <p className="font-sans text-slate-755 leading-normal mt-1">
                                  Merchant partner <strong className="text-emerald-700 font-extrabold">{oBreakdown.approvedVendors.map(v => v.name).join(', ')}</strong> has approved and packed their portion, but we are <span className="font-bold text-rose-700 underline decoration-indigo-600">waiting for {oBreakdown.pendingVendors.map(v => v.name).join(', ')}</span> to approve and pack their items in order to dispatch.
                                </p>
                              </div>
                            ) : oBreakdown.isMultiVendor && oBreakdown.allSellersApproved && ord.status === 'pending' ? (
                              <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-[11px] leading-relaxed text-emerald-900 space-y-1 shadow-3xs border-l-4 border-l-emerald-500">
                                <div className="flex items-center gap-1.5 font-sans font-bold text-emerald-800">
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>🟢 ALL INVOLVED SELLERS APPROVED!</span>
                                </div>
                                <p className="font-sans text-slate-650 leading-normal">
                                  All {oBreakdown.totalVendorsCount} partner sellers have approved, packed, and cleared checkout details! SuuqHub can now dispatch central express logistics.
                                </p>
                              </div>
                            ) : oBreakdown.isMultiVendor && oBreakdown.approvedCount === 0 ? (
                              <div className="p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-[10.5px] leading-normal text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-sans font-medium">Awaiting initial packaging verifications from {oBreakdown.totalVendorsCount} distinct sellers...</span>
                              </div>
                            ) : (
                              /* Single-vendor scenarios */
                              <div className="text-[11px] font-sans">
                                {ord.status === 'pending' ? (
                                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-800 flex items-center gap-1.5 leading-tight text-left">
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Awaiting storefront seller to approve and finalize packaging.</span>
                                  </div>
                                ) : ord.status === 'processing' ? (
                                  <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-850 flex items-center gap-1.5 font-semibold leading-tight text-left">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Seller packed. Safe to dispatch with delivery couriers!</span>
                                  </div>
                                ) : (
                                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 font-mono text-[10px] tracking-wider text-center">
                                    Fulfillment history archived & closed.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 4: Handover & Courier update controls */}
                        <div className="lg:col-span-2 flex flex-col justify-between items-stretch lg:pl-5 pt-4 lg:pt-0">
                          <div className="space-y-1.5 text-center lg:text-right">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-450 block font-bold text-center">Dispatch Status</span>
                            <div className="inline-block w-full">
                              <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border block text-center tracking-wider font-mono ${
                                ord.status === 'delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                ord.status === 'shipped' ? 'bg-indigo-55 bg-indigo-50 border-indigo-250 text-indigo-800 font-extrabold animate-pulse' :
                                ord.status === 'processing' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                'bg-slate-100 border-slate-205 text-slate-600'
                              }`}>
                                {ord.status === 'shipped' ? '🚚 Dispatch Active' : ord.status === 'processing' ? '📦 Ready' : ord.status}
                              </span>
                            </div>
                          </div>

                          {/* Graphical Timeline */}
                          <div className="my-4 py-2 border-y border-dashed border-slate-100 flex flex-col justify-center text-left">
                            <div className="w-full bg-slate-100 rounded-full h-1">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  ord.status === 'delivered' ? 'w-full bg-emerald-500' :
                                  ord.status === 'shipped' ? 'w-3/4 bg-indigo-650' :
                                  ord.status === 'processing' ? 'w-1/2 bg-amber-500' :
                                  oBreakdown.approvedCount > 0 ? 'w-1/4 bg-rose-450 bg-rose-400' :
                                  'w-[10%] bg-slate-300'
                                }`}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase mt-1">
                              <span className={ord.status === 'pending' ? 'text-indigo-600 font-bold' : ''}>Cart</span>
                              <span className={ord.status === 'processing' ? 'text-indigo-600 font-bold' : ''}>Packs</span>
                              <span className={ord.status === 'shipped' ? 'text-indigo-600 font-bold' : ''}>Transit</span>
                              <span className={ord.status === 'delivered' ? 'text-emerald-600 font-bold' : ''}>Done</span>
                            </div>
                          </div>

                          {/* Controls & Actions */}
                          <div className="space-y-2 mt-auto">
                            {ord.status === 'pending' && (
                              <div className="text-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-normal">
                                <span className="text-[10px] font-bold text-slate-550 flex items-center justify-center gap-1 font-mono uppercase">
                                  <Clock className="w-3.5 h-3.5" /> 
                                  {oBreakdown.isPartiallyApproved ? 'Waiting Seller' : 'Awaiting Seller Pack'}
                                </span>
                              </div>
                            )}
                            
                            {ord.status === 'processing' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const note = ord.deliveryMethod === 'pickup'
                                    ? 'SuuqHub Admin verified packaging; order marked ready for customer storefront pickup.'
                                    : 'SuuqHub Logistics has dispatched the order. Package in transit with express couriers.';
                                  handleTransitionOrderStatus(ord.id, 'shipped', note);
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-3xs transition flex items-center justify-center gap-1.5 active:scale-95 text-center"
                              >
                                <Truck className="w-3.5 h-3.5 shrink-0" />
                                {ord.deliveryMethod === 'pickup' ? 'Mark Ready Pickup' : 'Dispatch (Ship)'}
                              </button>
                            )}

                            {ord.status === 'shipped' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const note = ord.deliveryMethod === 'pickup'
                                    ? 'SuuqHub Admin confirmed direct client storefront pickup handover completed successfully.'
                                    : 'SuuqHub Courier has successfully delivered the home shipment. Enjoy your purchase!';
                                  handleTransitionOrderStatus(ord.id, 'delivered', note);
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-3xs transition flex items-center justify-center gap-1.5 active:scale-95 text-center"
                              >
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                {ord.deliveryMethod === 'pickup' ? 'Complete Handover' : 'Arrived (Delivered)'}
                              </button>
                            )}

                            {ord.status === 'delivered' && (
                              <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-xl text-center">
                                <span className="text-emerald-700 font-extrabold font-mono text-[9px] uppercase tracking-wider block">
                                  ✓ ORDER DELIVERED
                                </span>
                                <span className="text-[8.5px] text-emerald-500 font-mono font-medium block mt-0.5">Archived successfully</span>
                              </div>
                            )}
                          </div>

                        </div>
                        
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Merchant Logistics Remittances & Auditing Ledger */}
            <div className="bg-white p-5 rounded-xl border border-slate-205 mt-8 space-y-4 text-left shadow-xs">
              <div className="flex border-b border-slate-100 pb-3 items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 font-sans mb-0.5 font-black">
                    🚚 Merchant Logistics Remittances & Auditing Ledger
                  </h4>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                    Approve or reject cellular mobile wallet payments sent by merchants matching platform delivery charges.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded font-bold uppercase border border-indigo-100 font-extrabold">
                    Flat Platform logistics fee: $15.00/order
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[9.5px] font-mono uppercase tracking-wider">
                      <th className="p-3">Order Code</th>
                      <th className="p-3">Buyer Details</th>
                      <th className="p-3">Sender Details</th>
                      <th className="p-3">Payment Info</th>
                      <th className="p-3 text-right">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[11px]">
                    {orders.filter(o => o.deliveryMethod === 'delivery').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">No delivery logistics orders registered in storage.</td>
                      </tr>
                    ) : (
                      orders.filter(o => o.deliveryMethod === 'delivery').map((ord) => {
                        const remStatus = ord.deliveryFeeRemittanceStatus || 'owed';
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/20 font-sans">
                            <td className="p-3 font-mono">
                              <span className="font-bold text-slate-800">#{ord.id.substring(0, 8)}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(ord.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 block">{ord.customerName}</span>
                              <span className="text-[10.5px] font-mono text-slate-400 block">Order total: ${ord.total}</span>
                              <span className="text-[10px] font-mono text-indigo-600 font-bold block">Logistics fee: ${ord.shippingCost ?? 15}</span>
                            </td>
                            <td className="p-3">
                              {ord.deliveryFeeRemittanceDetails ? (
                                <div className="space-y-0.5">
                                  <span className="text-[11px] font-bold text-slate-800 block font-sans">Number: {ord.deliveryFeeRemittanceDetails.senderNumber}</span>
                                  <span className="text-[9.5px] font-mono text-slate-400">Time: {ord.deliveryFeeRemittanceDetails.dateRemitted}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic block py-1.5">No transfer logs submitted</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider inline-block ${
                                  remStatus === 'confirmed' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-150 font-black' 
                                    : remStatus === 'submitted' 
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-150 animate-pulse font-black' 
                                    : 'bg-rose-50 text-rose-750 border border-rose-150'
                                }`}>
                                  {remStatus === 'owed' ? 'owed' : remStatus === 'submitted' ? 'submitted' : 'audit verified'}
                                </span>
                                {ord.deliveryFeeRemittanceDetails && (
                                  <div className="flex gap-2 items-center text-[10px] font-mono mt-0.5">
                                    <span className="text-slate-400 uppercase font-bold text-[9px]">{ord.deliveryFeeRemittanceDetails.provider}:</span>
                                    <span className="text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded font-bold underline select-all">{ord.deliveryFeeRemittanceDetails.transactionNumber}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {remStatus === 'submitted' && (
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleAuditRemittance(ord.id, 'confirmed')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition active:scale-95 flex items-center gap-0.5 font-sans font-extrabold"
                                  >
                                    Accept receipt
                                  </button>
                                  <button
                                    onClick={() => handleAuditRemittance(ord.id, 'owed')}
                                    className="bg-slate-50 border border-slate-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition active:scale-95 font-sans font-semibold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {remStatus === 'confirmed' && (
                                <span className="text-emerald-700 font-bold font-mono text-[9px] uppercase bg-emerald-50 border border-emerald-155 rounded-sm px-2.5 py-1 inline-block font-black">
                                  Verified ✓
                                </span>
                              )}
                              {remStatus === 'owed' && (
                                <span className="text-slate-400 italic text-[10px] tracking-wide inline-block py-1">
                                  Awaiting Transfer
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Module 3.5: Home Delivery Logistics & Remittances Center (New Feature) */}
        {activeTab === 'delivery' && (
          <div className="space-y-6 animate-fadeIn text-left font-sans">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                🚚 Home Delivery Logistics Command
              </h3>
              <p className="text-[11.5px] text-slate-550 mt-1">
                Configure centralized shipping flat-charges, monitor active couriers, inspect split multi-vendor packaging checklists, and audit mobile payments remittance ledger.
              </p>
            </div>

            {/* Flat Rate Setup & Payment Gateways Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Shipping fee configuration */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left flex flex-col justify-between shadow-3xs">
                <div>
                  <span className="text-[10px] font-mono text-indigo-700 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    🛡️ Flat Delivery Charge Config
                  </span>
                  <p className="text-xs font-sans text-slate-600 leading-relaxed mt-2">
                    Set a flat delivery rate applied universally across all multi-vendor orders. Customers choosing <b>Home Delivery</b> will pay this fee, while <b>Self Pickup</b> remains entirely free ($0 USD).
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-xs font-mono text-slate-550">
                    Active Delivery Rate: <b className="text-indigo-600 text-sm font-bold font-mono">${deliveryFee} USD</b>
                  </span>
                  <form onSubmit={handleUpdateDeliveryFee} className="flex gap-2 w-full sm:w-auto sm:max-w-xs">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full sm:w-28 text-xs font-mono px-3 py-1.5 border rounded bg-white border-slate-250 text-slate-800 focus:outline-none"
                      value={newDeliveryFeeText}
                      onChange={(e) => setNewDeliveryFeeText(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={updatingLogistics}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] px-3.5 py-1.5 rounded-lg font-bold cursor-pointer transition whitespace-nowrap active:scale-95"
                    >
                      {updatingLogistics ? 'Saving...' : 'Set Flat Fee'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Payment methods toggling configuration card */}
              <div className="bg-slate-50 border border-slate-205 p-5 rounded-2xl text-left space-y-3 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-700 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    💳 Escrow Payment Gateroads
                  </span>
                  <p className="text-[11px] font-sans text-slate-500 leading-relaxed mt-1">
                    Toggle active checkout payment methods across the entire platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {/* Credit Card Toggle */}
                  <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10.5px] font-bold text-slate-800 block">Stripe Card Pay</span>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('card', !enableCard)}
                      className={`relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${enableCard ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-205 ${enableCard ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                  {/* Cash on Delivery Toggle */}
                  <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10.5px] font-bold text-slate-800 block">Cash on Delivery</span>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('cod', !enableCod)}
                      className={`relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${enableCod ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-205 ${enableCod ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                  {/* Zaad Toggle */}
                  <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10.5px] font-bold text-slate-850 block">Zaad Mobile Pay</span>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('zaad', !enableZaad)}
                      className={`relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-205 focus:outline-none ${enableZaad ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-205 ${enableZaad ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Client-side Gemini Config Card for hostinger or serverless environment */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left shadow-3xs space-y-3 font-sans">
              <div>
                <span className="text-[10px] font-mono text-indigo-700 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  🤖 Hostinger &amp; Static Fallback Gemini AI Key
                </span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  When deployed on purely static hosting platforms like Hostinger (without a persistent Node.js background process), the multi-vendor shopping assistant executes direct browser-based REST queries. Save your Gemini API key below to enable live Sales suggestions &amp; item recommendations on your live Hostinger project!
                </p>
              </div>
              <form onSubmit={handleSaveGeminiApiKey} className="flex flex-col sm:flex-row gap-3 pt-1">
                <input
                  type="password"
                  placeholder="Enter fallback gemini API key (e.g. AIzaSy...)"
                  className="w-full text-xs font-mono px-3.5 py-1.5 border rounded-lg bg-white border-slate-250 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={updatingLogistics}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] px-5 py-1.5 rounded-lg font-bold cursor-pointer transition whitespace-nowrap active:scale-95"
                >
                  {updatingLogistics ? 'Saving...' : 'Save Gemini Key'}
                </button>
              </form>
            </div>

            {/* Status Filter buttons & search bar */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-left">
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search delivery orders by buyer name, phone..."
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-205 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-650 font-sans shadow-3xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase font-bold mr-1">Status:</span>
                {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map((st) => {
                  const count = orders.filter(o => {
                    if (o.deliveryMethod !== 'delivery') return false;
                    const matchQ = !orderQuery.trim() || o.customerName.toLowerCase().includes(orderQuery.toLowerCase()) || o.id.includes(orderQuery);
                    return (st === 'all' || o.status === st) && matchQ;
                  }).length;
                  return (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all cursor-pointer ${orderStatusFilter === st ? 'bg-indigo-600 text-white shadow-3xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {st} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beautiful, High-End Deliveries Logistics Board */}
            <div className="space-y-4">
              {orders.filter(o => {
                if (o.deliveryMethod !== 'delivery') return false;
                const matchQ = !orderQuery.trim() || o.customerName.toLowerCase().includes(orderQuery.toLowerCase()) || o.id.includes(orderQuery);
                const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                return matchQ && matchStatus;
              }).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 text-xs italic text-slate-450 font-mono">
                  📦 No Home Delivery orders matching selected filters are currently logged in system indices.
                </div>
              ) : (
                orders
                  .filter(o => {
                    if (o.deliveryMethod !== 'delivery') return false;
                    const matchQ = !orderQuery.trim() || o.customerName.toLowerCase().includes(orderQuery.toLowerCase()) || o.id.includes(orderQuery);
                    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                    return matchQ && matchStatus;
                  })
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((ord) => {
                    const isExpanded = !!expandedOrders[ord.id];
                    const toggleExpand = () => {
                      setExpandedOrders(prev => ({ ...prev, [ord.id]: !prev[ord.id] }));
                    };

                    const oBreakdown = (() => {
                      const itemsWithVendorInfo = ord.items.map(item => {
                        const prod = products.find(p => p.id === (item.productId || (item as any).id));
                        const vendor = prod ? vendors.find(v => v.id === prod.vendorId) : null;
                        const vendorStatus = (ord.vendorStatuses && vendor && ord.vendorStatuses[vendor.id]) || ord.status || 'pending';
                        return { ...item, vendor, vendorStatus };
                      });

                      const uniqueVendorsInvolved = Array.from(new Set(
                        itemsWithVendorInfo.map(item => item.vendor?.id).filter(Boolean) as string[]
                      )).map(vId => {
                        const vMeta = vendors.find(v => v.id === vId);
                        const vStatus = ord.vendorStatuses?.[vId] || (ord.status === 'delivered' ? 'delivered' : ord.status === 'shipped' ? 'shipped' : 'pending');
                        return {
                          id: vId,
                          name: vMeta?.vendorName || `Store Outlet`,
                          status: vStatus
                        };
                      });

                      const isMultiVendor = uniqueVendorsInvolved.length > 1;
                      const approvedVendors = uniqueVendorsInvolved.filter(v => v.status !== 'pending');
                      const pendingVendors = uniqueVendorsInvolved.filter(v => v.status === 'pending');
                      const totalVendorsCount = uniqueVendorsInvolved.length;
                      const approvedCount = approvedVendors.length;
                      const isPartiallyApproved = isMultiVendor && approvedCount > 0 && approvedCount < totalVendorsCount;
                      const allSellersApproved = totalVendorsCount > 0 && approvedCount === totalVendorsCount;

                      return {
                        itemsWithVendorInfo,
                        uniqueVendorsInvolved,
                        isMultiVendor,
                        approvedVendors,
                        pendingVendors,
                        isPartiallyApproved,
                        allSellersApproved
                      };
                    })();

                    // Styling helper variables
                    let borderStyle = 'border-l-4 border-l-amber-500';
                    if (ord.status === 'delivered') borderStyle = 'border-l-4 border-l-emerald-500';
                    else if (ord.status === 'shipped') borderStyle = 'border-l-4 border-l-indigo-600';
                    else if (oBreakdown.isPartiallyApproved) borderStyle = 'border-l-4 border-l-rose-450';

                    return (
                      <div key={ord.id} className={`bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden text-xs text-slate-705 ${borderStyle}`}>
                        {/* Single-Row Summary card */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Profile & Name */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-750 flex items-center justify-center font-bold text-xs font-sans">
                              {ord.customerName?.[0] || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-sans text-left">
                                <span className="font-mono font-black text-slate-800 tracking-wider text-xs">#{ord.id.substring(0, 10).toUpperCase()}</span>
                                <span className="text-[10px] text-slate-450 font-mono">
                                  {new Date(ord.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="text-slate-650 font-semibold text-xs mt-0.5 truncate font-sans text-left">
                                {ord.customerName} {ord.shippingAddress?.phone ? `• Tel: ${ord.shippingAddress.phone}` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Destination */}
                          <div className="min-w-0 flex-1 text-left text-xs text-slate-550">
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Destination</span>
                            <span className="font-bold text-slate-700 truncate block font-sans">
                              {ord.shippingAddress?.city}, {ord.shippingAddress?.region}
                            </span>
                            <span className="text-[10px] truncate block text-slate-500 font-sans">
                              {ord.shippingAddress?.district}, {ord.shippingAddress?.streetAddress}
                            </span>
                          </div>

                          {/* Price & Method */}
                          <div className="text-left md:text-right text-xs">
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Amount & Method</span>
                            <span className="font-mono font-black text-indigo-600 text-xs block">${ord.total.toFixed(2)}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold uppercase inline-block mt-0.5">
                              {ord.paymentMethod || 'Wallet'}
                            </span>
                          </div>

                          {/* Controls & Action trigger */}
                          <div className="flex items-center gap-3 justify-between md:justify-end">
                            <div className="text-left md:text-right">
                              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono text-left md:text-right">Courier Status</span>
                              <span className={`inline-block text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border tracking-wider font-mono mt-0.5 ${
                                ord.status === 'delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                ord.status === 'shipped' ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-extrabold animate-pulse' :
                                ord.status === 'processing' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                'bg-slate-105 border-slate-205 text-slate-600'
                              }`}>
                                {ord.status === 'shipped' ? '🚚 Out For Delivery' : ord.status === 'processing' ? '📦 Packed' : ord.status}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={toggleExpand}
                              className="p-1 px-2.5 py-1.5 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 text-slate-750 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-3xs transition h-8 hover:text-indigo-650"
                            >
                              <span className="font-semibold text-[10.5px]">{isExpanded ? 'View Less' : 'View More'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-550" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-555" />}
                            </button>
                          </div>
                        </div>

                        {/* Dropdown containing complete log details and status transitions */}
                        {isExpanded && (
                          <div className="p-5 bg-slate-50/75 border-t border-slate-150 grid grid-cols-1 lg:grid-cols-12 gap-6 leading-normal animate-fadeIn border-l-4 border-l-transparent">
                            {/* Col 1: Shipping Profile */}
                            <div className="lg:col-span-3 space-y-3 text-left pr-4 lg:border-r border-slate-102">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black font-mono block">Recipients Shipping Address</span>
                              <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-[11px] text-slate-650 space-y-1.5 shadow-3xs font-sans">
                                <p className="font-bold flex items-center gap-1.5 text-slate-805 text-xs">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {ord.shippingAddress?.region}, {ord.shippingAddress?.city}
                                </p>
                                <p className="pl-5 text-slate-550 leading-relaxed">{ord.shippingAddress?.district}, {ord.shippingAddress?.streetAddress}</p>
                                {ord.shippingAddress?.phone && <p className="font-mono mt-1 text-slate-800 pl-5 font-extrabold text-xs">Tel: {ord.shippingAddress.phone}</p>}
                                {ord.shippingAddress?.homeInstructions && (
                                  <p className="bg-amber-50 text-amber-900 border border-amber-100 rounded-lg p-2 mt-2 text-[9.5px] italic leading-normal col-span-2">
                                    💡 Instruction: "{ord.shippingAddress.homeInstructions}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Col 2: Multi-Vendor checklists */}
                            <div className="lg:col-span-4 space-y-3 text-left px-2 lg:border-r border-slate-102">
                              <span className="text-[9px] uppercase tracking-wider text-indigo-650 font-black font-mono block">Split-Vendor Packaging Checklist</span>
                              <div className="space-y-1.5 max-h-[150px] overflow-y-auto mt-1 pr-1">
                                {oBreakdown.itemsWithVendorInfo.map((itm, idx) => (
                                  <div key={idx} className="flex gap-2 items-center p-2 border border-slate-150 rounded-xl bg-white text-[10.5px] shadow-3xs">
                                    <span className="font-bold text-slate-700 flex-1 truncate">{itm.title} (x{itm.quantity})</span>
                                    {itm.vendor && (
                                      <div className="flex items-center gap-1.5 shrink-0 font-sans">
                                        <span className="text-slate-500 text-[10px]">🏪 {itm.vendor.vendorName}</span>
                                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${itm.vendorStatus !== 'pending' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'}`}>
                                          {itm.vendorStatus !== 'pending' ? '✓ READY' : '⏳ PENDING'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {oBreakdown.isPartiallyApproved ? (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl mt-3 text-[10.5px] leading-relaxed text-rose-800 space-y-0.5 border-l-4 border-l-rose-500 shadow-3xs">
                                  <div className="flex items-center gap-1 font-extrabold text-[10px] text-rose-900 tracking-wide uppercase">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" /> Split Dispatch Blocked
                                  </div>
                                  <p className="font-sans leading-normal text-slate-600">
                                    Waiting for storefront approval on pending items to assemble the complete unified shipment list.
                                  </p>
                                </div>
                              ) : oBreakdown.isMultiVendor && oBreakdown.allSellersApproved && ord.status === 'pending' ? (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-xl mt-3 text-[10.5px] leading-relaxed text-emerald-800 border-l-4 border-l-emerald-500 shadow-3xs">
                                  <div className="flex items-center gap-1 font-extrabold text-[10px] text-emerald-950 uppercase">
                                    <Check className="w-3.5 h-3.5 shrink-0" /> Unified Package Cleared!
                                  </div>
                                  <p className="text-slate-600 leading-normal font-sans">
                                    All partner vendors of this split order have approved the item release. Secure shipment can be compiled.
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            {/* Col 3: Ordered Summary list */}
                            <div className="lg:col-span-3 space-y-3 text-left px-2 lg:border-r border-slate-102">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black font-mono block">Order Summary Basket</span>
                              <div className="space-y-1.5 text-[10.5px] max-h-[140px] overflow-y-auto pr-1">
                                {ord.items.map((it, i) => (
                                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-150 shadow-3xs">
                                    <span className="text-slate-705 truncate max-w-[135px] font-semibold">{it.title} <b className="text-indigo-650 font-mono">x{it.quantity}</b></span>
                                    <span className="font-mono font-bold text-slate-800">${(it.price * (it.quantity || 1)).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-slate-200 space-y-1 font-sans text-slate-650 text-[10.5px]">
                                <div className="flex justify-between">
                                  <span>Items Subtotal:</span>
                                  <span className="font-mono">${(ord.total - (ord.shippingCost || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-indigo-700">
                                  <span>Courier Delivery fee:</span>
                                  <span className="font-mono">${ord.shippingCost ?? 15}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black text-slate-850 pt-1 border-t border-slate-155">
                                  <span>Grand Total Price:</span>
                                  <span className="font-mono text-indigo-755 font-black">${ord.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Col 4: Operations button */}
                            <div className="lg:col-span-2 flex flex-col justify-between pl-4 py-1 text-center lg:text-right space-y-5">
                              <div className="space-y-2">
                                <span className="text-[9.5px] font-mono uppercase tracking-widest text-slate-450 block font-bold text-center lg:text-right font-bold">Logistics Terminal</span>
                                <p className="text-[10px] text-slate-450 leading-relaxed text-center lg:text-right hidden sm:block">
                                  Control order fulfillment milestone stages dynamically below.
                                </p>
                              </div>

                              <div className="space-y-2">
                                {ord.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleTransitionOrderStatus(ord.id, 'processing')}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] uppercase rounded-xl shadow-3xs transition cursor-pointer active:scale-95 text-center"
                                  >
                                    Assemble & Pack
                                  </button>
                                )}
                                {ord.status === 'processing' && (
                                  <button
                                    type="button"
                                    onClick={() => handleTransitionOrderStatus(ord.id, 'shipped')}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] uppercase rounded-xl shadow-3xs transition cursor-pointer active:scale-95 text-center"
                                  >
                                    Courier Handover
                                  </button>
                                )}
                                {ord.status === 'shipped' && (
                                  <button
                                    type="button"
                                    onClick={() => handleTransitionOrderStatus(ord.id, 'delivered')}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10.5px] uppercase rounded-xl shadow-3xs transition cursor-pointer active:scale-95 text-center"
                                  >
                                    Confirm Arrived
                                  </button>
                                )}
                                {ord.status === 'delivered' && (
                                  <div className="text-emerald-700 bg-emerald-50 border border-emerald-250 font-black font-mono text-[10px] uppercase tracking-wider rounded-xl py-2.5 text-center w-full shadow-3xs">
                                    Handed Over ✓
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

          </div>
        )}

        {/* Dedicated Merchant Payout Ledger sub-menu tab as requested */}
        {activeTab === 'ledger' && (
          <div className="space-y-6 animate-fadeIn text-left font-sans">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                💼 Merchant Payouts Ledger
              </h3>
              <p className="text-[11.5px] text-slate-555 mt-1">
                Approve or reject cellular mobile wallet transfer receipts sent by merchant partners to reimburse the centralized delivery couriers fee.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 mt-8 space-y-4 text-left shadow-xs">
              <div className="flex border-b border-slate-100 pb-3 items-center justify-between gap-4 flex-wrap font-sans">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-0.5 font-black font-sans">
                    🚚 Merchant Payouts Ledger
                  </h4>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                    Approve or reject cellular mobile wallet transfer receipts sent by merchant partners to reimburse the centralized delivery couriers fee.
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase border border-indigo-100">
                    Flat logistics fee: $15.00/order
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 font-sans">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-3">Order Code</th>
                      <th className="p-3">Buyer Profile</th>
                      <th className="p-3">Payment Reference Detail</th>
                      <th className="p-3 text-right">Ledger Verification action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150-b text-[11px] text-slate-700">
                    {orders.filter(o => o.deliveryMethod === 'delivery').length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-5 text-center text-slate-400 italic font-mono">No delivery ledger records currently synced.</td>
                      </tr>
                    ) : (
                      orders
                        .filter(o => o.deliveryMethod === 'delivery')
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((ord) => {
                          const remStatus = ord.deliveryFeeRemittanceStatus || 'owed';
                          return (
                            <tr key={ord.id} className="hover:bg-slate-50/45 transition">
                              <td className="p-3 font-mono">
                                <span className="font-bold text-slate-800 block">#{ord.id.substring(0, 8).toUpperCase()}</span>
                                <span className="text-[10px] text-slate-400 block">{new Date(ord.createdAt).toLocaleDateString()}</span>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-slate-800 block">{ord.customerName}</span>
                                <span className="text-[10px] font-mono text-slate-450 font-sans block mt-0.5">Payable amount: ${ord.total}</span>
                              </td>
                              <td className="p-3">
                                {ord.deliveryFeeRemittanceDetails ? (
                                  <div className="space-y-0.5 text-xs text-left font-sans text-[11px]">
                                    <p className="text-slate-800 font-bold">Provider: <b className="uppercase text-indigo-600">{ord.deliveryFeeRemittanceDetails.provider}</b> (No: {ord.deliveryFeeRemittanceDetails.senderNumber})</p>
                                    <p className="font-mono text-[10px] text-slate-600">Trans ID: <span className="bg-slate-100 select-all font-black px-1 rounded">{ord.deliveryFeeRemittanceDetails.transactionNumber}</span> ({ord.deliveryFeeRemittanceDetails.dateRemitted})</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic font-sans text-[10.5px]">No mobile receipt logged</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {remStatus === 'submitted' && (
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleAuditRemittance(ord.id, 'confirmed')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition cursor-pointer font-sans"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAuditRemittance(ord.id, 'owed')}
                                      className="bg-slate-50 border border-slate-200 text-rose-500 hover:bg-rose-50 text-[10px] px-2.5 py-1 rounded transition cursor-pointer font-semibold font-sans"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                {remStatus === 'confirmed' && (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 text-[10px] uppercase font-mono">
                                    Verified ✓
                                  </span>
                                )}
                                {remStatus === 'owed' && (
                                  <span className="text-slate-400 italic font-mono text-[10.5px]">
                                    Awaiting remittance
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Module 4: Vouchers */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-fade">
            
            {/* Create Coupon Input form */}
            <form onSubmit={handleCreateCoupon} className="md:col-span-4 bg-slate-50 p-5 rounded border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-805">Issue Discount Voucher</h4>
              
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Coupon Code</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., CODSPECIAL"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded px-4 py-3 text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Type</label>
                  <select value={newCouponType} onChange={(e) => setNewCouponType(e.target.value as any)} className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-3 text-slate-850 focus:outline-none cursor-pointer">
                    <option value="percentage">Percent Off</option>
                    <option value="fixed">Fixed Off ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Deduction</label>
                  <input
                    required
                    type="number"
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded px-4 py-3 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs tracking-wider rounded transition cursor-pointer shadow-xs"
              >
                Assemble Live Coupon
              </button>
            </form>

            {/* Coupons database status lists */}
            <div className="md:col-span-8 bg-slate-50 p-5 rounded border border-slate-200 space-y-4 text-left text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Active Coupons ({coupons.length})</h4>
              <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded p-4">
                {coupons.map((c) => (
                  <div key={c.code} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded uppercase">{c.code}</span>
                      <span className="text-[10px] text-slate-500 block mt-2">Deduction: {c.value}{c.discountType === 'percentage' ? '%' : '$'} | Min spend: ${c.minSpend}</span>
                    </div>
                    <span className="text-[9px] uppercase font-mono font-bold text-emerald-705 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded">LIVE VOUCHER</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Module 5: Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">CRM help ticket message channels</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-5 space-y-4">
                {tickets.length === 0 ? (
                  <p className="p-4 text-center bg-slate-50 border border-slate-200 text-slate-400 text-xs">No opened help request tickets.</p>
                ) : (
                  tickets.map((tkt) => (
                    <div
                      key={tkt.id}
                      onClick={() => setReplyTicketId(tkt.id)}
                      className={`p-4 bg-white border rounded text-left hover:border-indigo-305 hover:bg-slate-50/50 transition cursor-pointer flex justify-between items-center ${
                        replyTicketId === tkt.id ? 'border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-500 shadow-xs' : 'border-slate-250'
                      }`}
                    >
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Ticket: #{tkt.id} | User: {tkt.userName}</span>
                        <h4 className="font-bold text-slate-800 text-xs mt-0.5">{tkt.subject}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-medium">{tkt.message}</p>
                      </div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        tkt.status === 'open' ? 'bg-amber-50 border-amber-250 text-amber-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}>{tkt.status}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Thread detail & Reply interface */}
              <div className="lg:col-span-7">
                {replyTicketId ? (
                  (() => {
                    const activeTicket = tickets.find(t => t.id === replyTicketId);
                    if (!activeTicket) return <p className="text-slate-450 text-xs text-center py-12">Ticket not found.</p>;
                    return (
                      <div className="bg-slate-50 p-6 rounded border border-slate-200 font-sans">
                        <div className="pb-3 border-b border-slate-200 mb-3">
                          <span className="block text-[8px] uppercase font-mono text-slate-400">ticket index: {activeTicket.id}</span>
                          <span className="block font-bold text-slate-800 text-sm mt-0.5">{activeTicket.subject}</span>
                          <p className="text-slate-600 text-xs leading-relaxed mt-2 p-3 bg-white border border-slate-200 rounded font-medium">{activeTicket.message}</p>
                        </div>

                        {/* Interactive message threat logs */}
                        <div className="space-y-3.5 py-4 max-h-[160px] overflow-y-auto pr-1">
                          {activeTicket.messages.map((m, mIdx) => (
                            <div key={mIdx} className={`p-3 rounded text-xs max-w-[80%] ${m.sender === 'support' ? 'bg-indigo-600 text-white self-end ml-auto' : 'bg-white border border-slate-200 text-slate-700 mr-auto text-left shadow-xs'}`}>
                              <p className="leading-snug">{m.text}</p>
                              <span className="block text-[8px] opacity-70 text-right mt-1 font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Send reply */}
                        <form onSubmit={(e) => handleSupportTicketReply(e, activeTicket.id)} className="flex gap-2.5 border-t border-slate-200 pt-4">
                          <input
                            required
                            type="text"
                            placeholder="Write support answer..."
                            value={replyTextMsg}
                            onChange={(e) => setReplyTextMsg(e.target.value)}
                            className="bg-white text-xs px-4 py-2.5 rounded border border-slate-200 flex-grow text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-605"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 rounded text-xs transition cursor-pointer"
                          >
                            Send Reply
                          </button>
                        </form>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-12 text-center bg-slate-50 border border-slate-20c rounded text-slate-400 text-xs border-dashed">
                    Select a support request ticket from the list to preview message threads and resolve queries.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Module 6: Carousel Showcase Banners Auditing */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6 text-left animate-in fade-in duration-200" id="admin-campaigns-section">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 animate-pulse" /> Promos & Slider Showcase Audit Panel
                </h3>
                <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-2xl text-left">
                  Inspect corporate requested slider ads, audit quality guidelines, check deposit status, and toggle approval status to display them directly on the SuuqHub main landing hero section.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded px-4 py-2.5 shrink-0 shadow-3xs font-mono text-center">
                <span className="block text-[8.5px] uppercase text-slate-400 font-bold tracking-wider">Total Slider Ad Volume</span>
                <span className="text-sm font-black text-slate-850">${heroCampaigns.reduce((acc, c) => acc + (c.status === 'approved' ? c.feeUSD : 0), 0)} Revenue Collected</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {heroCampaigns.length === 0 ? (
                <div className="p-12 text-center rounded bg-slate-50 border border-dashed border-slate-200">
                  <Package className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <span className="text-xs font-mono text-slate-500 block">No slider campaigns exist in database.</span>
                  <p className="text-[10.5px] text-slate-400 mt-1 max-w-md mx-auto">Once merchants submit layout slide suggestions, they will render here automatically for review.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {heroCampaigns.map((camp) => (
                    <div key={camp.id} className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:bg-slate-50/40 transition">
                      
                      {/* Left Block: Image Banner and Info details */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="w-28 h-16 rounded border border-slate-300 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-3xs">
                          <img src={camp.image} alt="Showcase Thumbnail" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{camp.title}</span>
                            <span className="text-[9px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Requested by: <b>{camp.vendorName}</b></span>
                          </div>
                          <p className="text-xs text-slate-550 italic">"{camp.subtitle || 'No description subtitle provided'}"</p>
                          
                          <div className="flex flex-wrap gap-2.5 pt-1 text-[10px] font-mono text-slate-500">
                            <span>Tier: <b className="text-indigo-600">{camp.pricingTier}</b></span>
                            <span>•</span>
                            <span>Duration: <b className="text-slate-800">{camp.durationDays} Days</b></span>
                            <span>•</span>
                            <span>Accrued Rate: <b className="text-emerald-700">${camp.feeUSD} USD</b></span>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Status Display and Verification controls */}
                      <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0 self-stretch md:self-auto justify-between md:justify-start">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[8.5px] font-mono font-black uppercase rounded tracking-wider ${
                            camp.status === 'approved'
                              ? 'bg-emerald-50 border border-emerald-250 text-emerald-700'
                              : camp.status === 'rejected'
                              ? 'bg-rose-50 border border-rose-200 text-rose-705 text-red-700'
                              : 'bg-amber-50 border border-amber-250 text-amber-705'
                          }`}>
                            {camp.status}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">{new Date(camp.createdAt).toLocaleDateString()}</span>
                        </div>

                        {camp.status === 'pending' && (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {auditingCampaignId === camp.id ? (
                              <div className="p-3 bg-rose-50 border border-rose-150 rounded-lg space-y-2 mt-1 w-full max-w-xs">
                                <span className="block text-[9px] uppercase font-mono font-black text-rose-700">Submit rejection reason:</span>
                                <input
                                  type="text"
                                  placeholder="e.g. Blurry logo visual quality..."
                                  value={rejectReasonText}
                                  onChange={(e) => setRejectReasonText(e.target.value)}
                                  className="w-full text-xs font-sans bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setAuditingCampaignId(null)}
                                    type="button"
                                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-705 rounded text-[10px] font-bold cursor-pointer transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleUpdateCampaignStatus(camp.id, 'rejected', rejectReasonText)}
                                    type="button"
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer transition"
                                  >
                                    Confirm Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCampaignStatus(camp.id, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10.5px] cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-3" /> Approve & Display
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setAuditingCampaignId(camp.id); setRejectReasonText(''); }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-bold text-[10.5px] cursor-pointer transition flex items-center gap-1"
                                >
                                  Reject Slot
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {camp.status === 'rejected' && camp.rejectionReason && (
                          <div className="bg-rose-50 text-[10px] text-rose-800 px-2.5 py-1.5 border border-rose-150 rounded text-right font-mono max-w-xs">
                            <span className="font-extrabold uppercase mr-1">Rejection reason:</span>
                            {camp.rejectionReason}
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  </div>
</div>
  );
}
