/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, DollarSign, Users, Award, TrendingUp, Check, Play, Trash2, Edit, Save, Plus, Loader2, Lock, Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Product, Order, Coupon, SupportTicket, OrderStatus, Vendor, HeroCampaign } from '../types';
import { formatPrice } from '../utils';

interface AdminPortalProps {
  userId: string;
  lang: 'en' | 'ar' | 'es';
  currency: 'USD' | 'EUR' | 'AED';
}

export default function AdminPortal({
  userId,
  lang,
  currency
}: AdminPortalProps) {
  // DB states from Express
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [salesReport, setSalesReport] = useState<{ date: string; sales: number; orders: number }[]>([]);

  const [loading, setLoading] = useState(true);

  // Active sub tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'vendors' | 'orders' | 'coupons' | 'tickets' | 'campaigns'>('analytics');

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
  const [updatingLogistics, setUpdatingLogistics] = useState<boolean>(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes, cRes, tRes, sRes, vRes, dRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/coupons'),
        fetch('/api/tickets'),
        fetch('/api/reports/sales'),
        fetch('/api/vendors'),
        fetch('/api/delivery-config')
      ]);

      const pData = await pRes.json();
      const oData = await oRes.json();
      const cData = await cRes.json();
      const tData = await tRes.json();
      const sData = await sRes.json();
      const vData = await vRes.json();
      const dData = await dRes.json();

      setProducts(pData);
      setOrders(oData);
      setCoupons(cData);
      setTickets(tData);
      setSalesReport(sData);
      setVendors(vData);
      setDeliveryFee(dData.deliveryFee ?? 15);
      setNewDeliveryFeeText(String(dData.deliveryFee ?? 15));
      setEnableCard(dData.enableCard !== false);
      setEnableCod(dData.enableCod !== false);

      await fetchHeroCampaigns();
    } catch (err) {
      console.error('Error synchronizing admin datastore:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaymentMethod = async (method: 'card' | 'cod', enabled: boolean) => {
    try {
      setUpdatingLogistics(true);
      const res = await fetch('/api/delivery-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [method === 'card' ? 'enableCard' : 'enableCod']: enabled
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEnableCard(data.enableCard !== false);
        setEnableCod(data.enableCod !== false);
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
      }
    } catch (err) {
      console.error('Error updating vendor status:', err);
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Centralized omnichannel controller for multi-vendor catalog auditing, billing structures, client CRM tickets, and site-wide marketing slides.</p>
        </div>
        <div className="mt-3 md:mt-0 flex items-center gap-2 md:self-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-750 rounded border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            Session: System Superadmin
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
                { id: 'orders', label: 'Fulfillments Manager', count: orders.filter(o=>o.status !== 'delivered').length, desc: 'Shipping & Payment configs' },
                { id: 'campaigns', label: 'Store Slider Showcase', count: heroCampaigns.filter(c => c.status === 'pending').length, desc: 'Hero slider banners' },
                { id: 'coupons', label: 'Vouchers & Coupons', count: coupons.length, desc: 'Store-wide active promotions' },
                { id: 'tickets', label: 'CRM Help Tickets', count: tickets.filter(t=>t.status==='open').length, desc: 'Consumer support threads' }
              ].map((subTab) => {
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
              <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider font-mono">Omnichannel Health</span>
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
              Onboard and verify third-party sellers requesting access to SuuqHub Omnichannel inventory distribution. Pending merchants cannot list products until approved by the platform manager.
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
                  <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    💳 Payment Gateway Toggles
                  </span>
                  <p className="text-[11px] font-sans text-slate-500 leading-relaxed mt-1">
                    Toggle checkout options. <b>ZAAD</b> and <b>eDahab</b> peer-to-peer mobile payments are natively always enabled.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  
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
                      <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${enableCard ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
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
                      <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${enableCod ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

            <div className="overflow-x-auto rounded border border-slate-205">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-mono text-[9px] text-slate-500">
                  <tr>
                    <th className="p-3">Order Code</th>
                    <th className="p-3">buyer Details</th>
                    <th className="p-3 text-center">Handover Type</th>
                    <th className="p-3 text-center">Bill total</th>
                    <th className="p-3 text-center">Fulfill dates</th>
                    <th className="p-3 text-center">Payment Info</th>
                    <th className="p-3 text-center">Dispatched status</th>
                    <th className="p-3 text-right">controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{ord.id}</td>
                      <td className="p-3 text-xs">
                        <span className="block font-semibold text-slate-800">{ord.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ord.customerEmail}</span>
                      </td>

                      {/* Handover type badge column */}
                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border tracking-wider inline-block ${
                          ord.deliveryMethod === 'pickup'
                            ? 'bg-teal-50 border-teal-205 text-teal-700'
                            : 'bg-blue-50 border-blue-255 text-blue-700'
                        }`}>
                          {ord.deliveryMethod === 'pickup' ? '🛒 Self Pickup' : '📦 Home Delivery'}
                        </span>
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-slate-900">${ord.total}</td>
                      <td className="p-3 text-center font-mono text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                      
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded border inline-block font-bold ${
                          ord.paymentMethod === 'Cash on Delivery' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          ord.paymentMethod && ord.paymentMethod.includes('Zaad') ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold' :
                          ord.paymentMethod && ord.paymentMethod.includes('Edahab') ? 'bg-amber-50 text-amber-800 border-amber-200 font-extrabold' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>{ord.paymentMethod}</span>
                        {ord.mobilePayment && (
                          <div className="text-[10px] font-mono text-slate-500 mt-2.5 space-y-0.5 text-left max-w-[150px] mx-auto border-t border-slate-100 pt-1.5 leading-snug">
                            <p className="font-bold text-slate-755">Txn: <span className="underline select-all font-bold text-indigo-600">{ord.mobilePayment.transactionNumber}</span></p>
                            <p>From: {ord.mobilePayment.senderNumber}</p>
                            <p>Name: {ord.mobilePayment.senderName}</p>
                            <p className="text-[9px] text-slate-400">{ord.mobilePayment.dateTime}</p>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${
                          ord.status === 'delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          ord.status === 'shipped' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold' :
                          'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {ord.status === 'shipped' ? '🚚 Dispatched' : ord.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          {ord.deliveryMethod !== 'pickup' ? (
                            <>
                              {ord.status === 'pending' && (
                                <span className="text-[10px] text-amber-600 bg-amber-55 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded font-bold font-mono uppercase">
                                  🕒 Awaiting Vendor Pack
                                </span>
                              )}
                              {ord.status === 'processing' && (
                                <button
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'shipped', 'SuuqHub Logistics has dispatched the order. Package in transit with express couriers to your Abu Dhabi address.')}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded text-xs cursor-pointer inline-flex items-center gap-1 active:scale-95 transition"
                                >
                                  🚚 Ship Out (Dispatch)
                                </button>
                              )}
                              {ord.status === 'shipped' && (
                                <button
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'delivered', 'SuuqHub Courier has successfully delivered the home shipment. Enjoy your purchase!')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-xs cursor-pointer inline-flex items-center gap-1 active:scale-95 transition"
                                >
                                  ✅ Declare Delivered
                                </button>
                              )}
                              {ord.status === 'delivered' && (
                                <span className="text-emerald-700 text-[10px] font-bold uppercase mr-2 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">
                                  Archived verified
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-[10.5px] italic font-medium">
                              Managed by Merchant (Self-Pickup)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
