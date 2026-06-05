/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Sparkles, AlertCircle, DollarSign, Package, Check, ShoppingBag, Eye, ShieldCheck, CheckCircle2, Upload, Trash2, Image, Truck, Calendar, User, MapPin, CreditCard, ArrowRight, Clock, Tag, Sliders, X, Percent } from 'lucide-react';
import { Product, Vendor, Order, OrderItem, OrderStatus, Coupon, ProductVariant } from '../types';

const safeParseError = async (res: Response, defaultMsg: string): Promise<string> => {
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      return data.error || data.message || defaultMsg;
    }
    const text = await res.text();
    if (text && text.length < 200 && !text.trim().startsWith('<')) {
      return text.trim();
    }
  } catch (e) {
    console.error('Error parsing response:', e);
  }
  return defaultMsg;
};

interface VendorPortalProps {
  userId: string;
  userEmail: string;
  userRole: string;
  lang: 'en' | 'ar' | 'es';
  currentCurrency: 'USD' | 'EUR' | 'AED';
}

export default function VendorPortal({
  userId,
  userEmail,
  userRole,
  lang,
  currentCurrency
}: VendorPortalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'campaigns' | 'coupons' | 'finance' | 'settings'>('products');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [transitioningOrderId, setTransitioningOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Vendor Finance & Settings Settings
  const [zaadNumber, setZaadNumber] = useState('');
  const [edahabNumber, setEdahabNumber] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Remittance Form States
  const [activeRemitOrderId, setActiveRemitOrderId] = useState<string | null>(null);
  const [remitTxnId, setRemitTxnId] = useState('');
  const [remitSenderMobile, setRemitSenderMobile] = useState('');
  const [remitDateTime, setRemitDateTime] = useState('');
  const [remitNotes, setRemitNotes] = useState('');
  const [remitMsg, setRemitMsg] = useState('');
  const [remitSuccess, setRemitSuccess] = useState(false);
  const [remitProvider, setRemitProvider] = useState<'zaad' | 'edahab'>('zaad');

  useEffect(() => {
    if (selectedVendor) {
      setZaadNumber(selectedVendor.zaadNumber || '');
      setEdahabNumber(selectedVendor.edahabNumber || '');
      setRepresentativeName(selectedVendor.representativeName || '');
    }
  }, [selectedVendor]);

  // Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Hero Slide Campaigns
  const [heroCampaigns, setHeroCampaigns] = useState<any[]>([]);
  const [campTitle, setCampTitle] = useState('');
  const [campSubtitle, setCampSubtitle] = useState('');
  const [campImage, setCampImage] = useState('');
  const [campPricingTier, setCampPricingTier] = useState('Frontpage Premium Hero');
  const [campDuration, setCampDuration] = useState('14');
  const [campMsg, setCampMsg] = useState('');
  const [campIsSuccess, setCampIsSuccess] = useState(false);
  const [isDraggingCampImage, setIsDraggingCampImage] = useState(false);

  // Form states for posting or editing product
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('10');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // New optional details (variants, discount price, product story, specs)
  const [discountPrice, setDiscountPrice] = useState('');
  const [productStory, setProductStory] = useState('');

  // Color variants states
  const [colorName, setColorName] = useState('');
  const [colorPrice, setColorPrice] = useState('');
  const [colorStock, setColorStock] = useState('20');
  const [variantsColors, setVariantsColors] = useState<ProductVariant[]>([]);

  // Size variants states
  const [sizeName, setSizeName] = useState('');
  const [sizePrice, setSizePrice] = useState('');
  const [sizeStock, setSizeStock] = useState('20');
  const [variantsSizes, setVariantsSizes] = useState<ProductVariant[]>([]);

  // Specifications states
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  // Coupon Manager states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinSpend, setCouponMinSpend] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponIsSuccess, setCouponIsSuccess] = useState(false);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormMsg('Please upload a valid image file (PNG, JPG, WEBP).');
      setIsSuccess(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setFormMsg(''); // reset message
      }
    };
    reader.onerror = () => {
      setFormMsg('Failed to process image file.');
      setIsSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddColorVariant = () => {
    if (!colorName.trim()) return;
    const newCol: ProductVariant = {
      id: `col-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: colorName.trim(),
      priceModifier: Number(colorPrice || 0),
      stock: Number(colorStock || 0)
    };
    setVariantsColors([...variantsColors, newCol]);
    setColorName('');
    setColorPrice('');
    setColorStock('20');
  };

  const handleRemoveColorVariant = (id: string) => {
    setVariantsColors(variantsColors.filter(c => c.id !== id));
  };

  const handleAddSizeVariant = () => {
    if (!sizeName.trim()) return;
    const newSz: ProductVariant = {
      id: `sz-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: sizeName.trim(),
      priceModifier: Number(sizePrice || 0),
      stock: Number(sizeStock || 0)
    };
    setVariantsSizes([...variantsSizes, newSz]);
    setSizeName('');
    setSizePrice('');
    setSizeStock('20');
  };

  const handleRemoveSizeVariant = (id: string) => {
    setVariantsSizes(variantsSizes.filter(s => s.id !== id));
  };

  const handleAddSpecification = () => {
    if (!specKey.trim() || !specValue.trim()) return;
    setSpecifications({ ...specifications, [specKey.trim()]: specValue.trim() });
    setSpecKey('');
    setSpecValue('');
  };

  const handleRemoveSpecification = (keyToRemove: string) => {
    const updated = { ...specifications };
    delete updated[keyToRemove];
    setSpecifications(updated);
  };

  // Form states for registering new vendor
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newRepName, setNewRepName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newDesc, setNewDesc] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [registerMsg, setRegisterMsg] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [userEmail]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pRes, vRes, oRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/vendors'),
        fetch('/api/orders')
      ]);
      const pData = await pRes.json();
      const vData = await vRes.json();
      const oData = await oRes.json();

      // Filter vendors to isolate ONLY the logged-in representative's email
      const matchingVendors = vData.filter(
        (v: Vendor) => v.email && v.email.toLowerCase() === userEmail.toLowerCase()
      );

      setVendors(matchingVendors);

      // Select matching vendor profile if configured
      if (matchingVendors.length > 0) {
        const defaultVendor = matchingVendors[0];
        setSelectedVendor(defaultVendor);
        
        // Filter products of this specific vendor
        const filteredProducts = pData.filter((p: Product) => p.vendorId === defaultVendor.id);
        setProducts(filteredProducts);

        // Filter orders that contain at least one item from this vendor's catalog
        const filteredOrders = oData.filter((ord: Order) => 
          ord.items.some((item) => filteredProducts.some((p: Product) => p.id === item.productId))
        );
        setOrders(filteredOrders);
      } else {
        setSelectedVendor(null);
        setProducts([]);
        setOrders([]);
      }
      
      await fetchHeroCampaigns();
      await fetchCoupons();
    } catch (err) {
      console.error('Error synchronizing vendor portal:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
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
      console.error('Failed to load hero campaigns:', err);
    }
  };

  const fetchVendorProducts = async (vendorId: string) => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders')
      ]);
      const pData = await pRes.json();
      const oData = await oRes.json();

      const vendorItems = pData.filter((p: Product) => p.vendorId === vendorId);
      setProducts(vendorItems);

      const filteredOrders = oData.filter((ord: Order) => 
        ord.items.some((item) => vendorItems.some((p: Product) => p.id === item.productId))
      );
      setOrders(filteredOrders);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectVendor = (vendorId: string) => {
    const v = vendors.find(item => item.id === vendorId) || null;
    setSelectedVendor(v);
    if (v) {
      fetchVendorProducts(v.id);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    setSettingsMsg('');
    try {
      const res = await fetch(`/api/vendors/${selectedVendor.id}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaadNumber,
          edahabNumber,
          representativeName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess(true);
        setSettingsMsg('Merchant mobile numbers and credentials saved successfully!');
        setSelectedVendor(data);
        setVendors(prev => prev.map(v => v.id === data.id ? data : v));
        setTimeout(() => setSettingsMsg(''), 4500);
      } else {
        setSettingsSuccess(false);
        setSettingsMsg(data.error || 'Failed to update credentials');
      }
    } catch {
      setSettingsSuccess(false);
      setSettingsMsg('Connection error updating credentials');
    }
  };

  const handlePostRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRemitOrderId) return;
    setRemitMsg('');
    try {
      const remittanceDetails = {
        provider: remitProvider,
        transactionNumber: remitTxnId,
        senderNumber: remitSenderMobile,
        dateRemitted: remitDateTime || new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      const res = await fetch(`/api/orders/${activeRemitOrderId}/remittance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryFeeRemittanceStatus: 'submitted',
          deliveryFeeRemittanceDetails: remittanceDetails
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRemitSuccess(true);
        setRemitMsg('SuuqHub delivery charges remittance logged successfully! Status queued and waiting for confirmation.');
        setOrders(prev => prev.map(o => o.id === data.id ? data : o));
        setTimeout(() => {
          setActiveRemitOrderId(null);
          setRemitTxnId('');
          setRemitSenderMobile('');
          setRemitNotes('');
          setRemitMsg('');
        }, 3000);
      } else {
        setRemitSuccess(false);
        setRemitMsg(data.error || 'Logistics fee submission rejected');
      }
    } catch {
      setRemitSuccess(false);
      setRemitMsg('Logistics fee transmission network error');
    }
  };

  const handleTransitionOrderStatus = async (orderId: string, status: OrderStatus, note: string) => {
    setTransitioningOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      if (res.ok) {
        if (selectedVendor) {
          await fetchVendorProducts(selectedVendor.id);
        } else {
          await fetchInitialData();
        }
      } else {
        const errMsg = await safeParseError(res, "Failed to update order status.");
        alert(errMsg);
      }
    } catch (err) {
      console.error('Error transitioning order status:', err);
    } finally {
      setTransitioningOrderId(null);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newRepName || !newEmail) return;
    setRegisterMsg('');
    setRegisterSuccess(false);

    const payload = {
      vendorName: newVendorName,
      representativeName: newRepName,
      email: newEmail,
      category: newCategory,
      description: newDesc,
      taxId: newTaxId,
      status: 'pending'
    };

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewVendorName('');
        setNewRepName('');
        setNewEmail('');
        setNewDesc('');
        setNewTaxId('');
        setRegisterMsg("Merchant registration successful! Status is marked as 'Pending approval'. Select SuperAdmin from the top eye-bar to verify this account.");
        setRegisterSuccess(true);
        
        // Refresh vendors
        const vRes = await fetch('/api/vendors');
        const vData = await vRes.json();
        setVendors(vData);

        const newlyCreated = vData.find((item: Vendor) => item.email.toLowerCase() === payload.email.toLowerCase());
        if (newlyCreated) {
          setSelectedVendor(newlyCreated);
          fetchVendorProducts(newlyCreated.id);
        }
        setShowRegisterForm(false);
      } else {
        const errMsg = await safeParseError(res, "Onboarding failed.");
        setRegisterMsg(errMsg);
        setRegisterSuccess(false);
      }
    } catch (err) {
      console.error(err);
      setRegisterMsg("Network link failed.");
      setRegisterSuccess(false);
    }
  };

  const handleCampImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setCampMsg('Please upload a valid image file (PNG, JPG, WEBP).');
      setCampIsSuccess(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCampImage(reader.result);
        setCampMsg(''); // reset message
      }
    };
    reader.onerror = () => {
      setCampMsg('Failed to process image file.');
      setCampIsSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePostCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle || !campImage || !selectedVendor) {
      setCampMsg('Please provide a banner title and drag/upload an image.');
      setCampIsSuccess(false);
      return;
    }
    setCampMsg('');

    const days = parseInt(campDuration, 10) || 7;
    const fee = days * 25; // $25 per day campaign tier

    const payload = {
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.vendorName,
      image: campImage,
      title: campTitle,
      subtitle: campSubtitle,
      pricingTier: campPricingTier,
      durationDays: days,
      feeUSD: fee
    };

    try {
      const res = await fetch('/api/hero-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCampTitle('');
        setCampSubtitle('');
        setCampImage('');
        setCampMsg(`Campaign submitted successfully! Placed in queue for platform Superadmin audit. Billed fee: $${fee}.`);
        setCampIsSuccess(true);
        await fetchHeroCampaigns();
      } else {
        const errMsg = await safeParseError(res, 'Failed to submit campaign.');
        setCampMsg(errMsg);
        setCampIsSuccess(false);
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      setCampMsg('Network link error when posting campaign.');
      setCampIsSuccess(false);
    }
  };

  const handlePostProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category || !selectedVendor) return;
    setFormMsg('');
    setIsSuccess(false);

    const payload: any = {
      title,
      description,
      price: Number(price),
      category,
      brand: selectedVendor.vendorName,
      stock: Number(stock),
      sku: sku || `SKU-VEN-${Math.floor(1000 + Math.random() * 9000)}`,
      image: image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.vendorName,
      variants: {
        colors: variantsColors.length > 0 ? variantsColors : undefined,
        sizes: variantsSizes.length > 0 ? variantsSizes : undefined
      },
      specifications: specifications,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      productStory: productStory || undefined
    };

    const isEditMode = !!editingProduct;
    const url = isEditMode ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = isEditMode ? 'PUT' : 'POST';

    if (!isEditMode) {
      payload.subcategory = 'Vendor List';
      payload.isApproved = false; // Must be approved by superadmin before going live on store catalogue
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setTitle('');
        setPrice('');
        setSku('');
        setStock('10');
        setImage('');
        setDescription('');
        setDiscountPrice('');
        setProductStory('');
        setVariantsColors([]);
        setVariantsSizes([]);
        setSpecifications({});
        setEditingProduct(null);

        if (isEditMode) {
          setFormMsg("Product listing has been updated successfully.");
        } else {
          setFormMsg("Listing successfully submitted to Admin verification queue. Status is marked as 'Pending approval'.");
        }
        setIsSuccess(true);
        fetchVendorProducts(selectedVendor.id);
      } else {
        const errMsg = await safeParseError(res, "Submission failed.");
        setFormMsg(errMsg);
        setIsSuccess(false);
      }
    } catch (err) {
      console.error(err);
      setFormMsg("Transmission failed.");
      setIsSuccess(false);
    }
  };

  const handlePostCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponValue || !selectedVendor) {
      setCouponMsg('Please provide a code and a value.');
      setCouponIsSuccess(false);
      return;
    }
    setCouponMsg('');

    const payload = {
      code: couponCode.trim().toUpperCase(),
      discountType: couponType,
      value: Number(couponValue),
      minSpend: Number(couponMinSpend || 0),
      expiryDate: couponExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      active: true,
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.vendorName
    };

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCouponCode('');
        setCouponValue('');
        setCouponMinSpend('');
        setCouponExpiry('');
        setCouponMsg(`Coupon ${payload.code} has been successfully created and registered!`);
        setCouponIsSuccess(true);
        await fetchCoupons();
      } else {
        const errMsg = await safeParseError(res, "Failed to create coupon.");
        setCouponMsg(errMsg);
        setCouponIsSuccess(false);
      }
    } catch (err) {
      console.error(err);
      setCouponMsg("Network error when posting coupon.");
      setCouponIsSuccess(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const res = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCouponMsg("Coupon campaign deleted.");
        setCouponIsSuccess(true);
        await fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateRandomCoupon = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VND-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponCode(code);
    setCouponMsg('');
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setPrice(String(p.price));
    setCategory(p.category || 'Electronics');
    setSku(p.sku || '');
    setStock(String(p.stock));
    setImage(p.image || '');
    setDescription(p.description || '');
    setDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
    setProductStory(p.productStory || '');
    setVariantsColors(p.variants?.colors || []);
    setVariantsSizes(p.variants?.sizes || []);
    setSpecifications(p.specifications || {});
    setFormMsg('');
    setIsSuccess(false);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setTitle('');
    setPrice('');
    setCategory('Electronics');
    setSku('');
    setStock('10');
    setImage('');
    setDescription('');
    setDiscountPrice('');
    setProductStory('');
    setVariantsColors([]);
    setVariantsSizes([]);
    setSpecifications({});
    setFormMsg('');
    setIsSuccess(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFormMsg("Listing deleted successfully.");
        setIsSuccess(true);
        setConfirmDeleteId(null);
        if (selectedVendor) {
          fetchVendorProducts(selectedVendor.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-2 font-mono text-xs">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span>Synchronizing Independent Seller Database...</span>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4 space-y-6 text-left font-sans">
        {registerSuccess && registerMsg && (
          <div className="p-4 rounded border bg-emerald-50 border-emerald-250 text-emerald-800 text-xs flex gap-3.5 items-start">
            <span className="w-4 h-4 bg-emerald-100 rounded-full text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
            <div>{registerMsg}</div>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-850 text-xs flex gap-3.5 items-start shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="font-bold text-slate-850 uppercase tracking-widest text-[10px]">Merchant Profile Mapping Unconfigured</p>
            <p className="text-slate-605 text-xs text-slate-705 leading-relaxed">
              Your logged-in Seller representative account <span className="font-mono bg-white font-bold px-1.5 py-0.5 rounded border border-amber-200 text-slate-800">{userEmail}</span> has been authenticated, but there is no active storefront mapped to this Email address inside the omnichannel seller's database.
            </p>
            <div className="bg-white/80 p-3.5 rounded border border-amber-150 text-[11.5px] text-slate-700 font-sans leading-relaxed mt-2 space-y-1.5 animate-fadeIn">
              <span className="font-black text-amber-900 block tracking-wide uppercase text-[9.5px]">How to resolve this inside the sandbox:</span>
              <p>1. Switch your active role by clicking <b className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold">SuperAdmin</b> in the top test-bar under <i>Live Sandbox Mode</i>.</p>
              <p>2. Scroll down to the <b>Store Staff & Vendors</b> table database tab inside the Admin Console.</p>
              <p>3. Find a vendor profile or click <b>"Credentials"</b> on any seller, update their Email address to match your credential Email: <b>{userEmail}</b>, and click Save.</p>
              <p>4. Once re-saved, return to this tab to manage your isolated corporate catalog.</p>
              
              <div className="pt-3 mt-3 border-t border-amber-200/60">
                <span className="font-black text-indigo-900 block tracking-wide uppercase text-[9.5px] mb-1.5">Or request a brand new merchant storefront account:</span>
                <button
                  type="button"
                  id="btn-onboard-storefront"
                  onClick={() => {
                    setShowRegisterForm(true);
                    setNewEmail(userEmail);
                    setNewRepName(representativeName || '');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" /> Onboard My Storefront Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {showRegisterForm && (
          <form onSubmit={handleRegisterVendor} className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-4 animate-fadeIn" id="unmapped-vendor-req-form">
            <h3 className="font-bold text-sm text-indigo-600 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 animate-pulse" /> Merchant Registration & Onboarding
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Submit your corporate and representative credentials to request secondary vendor directory catalog privileges on SuuqHub Omnichannel. Accounts will require manual administrative authorization by the platform Superadmin backoffice.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Company / Store Name</label>
                <input required type="text" placeholder="e.g., SuuqHub Organic Foods" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Legal Representative Name</label>
                <input required type="text" placeholder="e.g., Sarah Connor" value={newRepName} onChange={(e) => setNewRepName(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Representative Email</label>
                <input required type="email" placeholder="sarah@corp.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Unified Tax ID / TRN</label>
                <input type="text" placeholder="TRN-9983751" value={newTaxId} onChange={(e) => setNewTaxId(e.target.value)} className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Core Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-850 focus:bg-white focus:outline-none cursor-pointer">
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Grocery">Grocery</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Enterprise Storefront Description</label>
              <textarea placeholder="Tell us about the products you wish to publish to our catalog..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowRegisterForm(false)} className="px-4 py-2 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded cursor-pointer text-[10px] uppercase tracking-wider">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer text-[10px] uppercase tracking-wider">
                Submit Registration Request
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  const isSelectedApproved = selectedVendor && selectedVendor.status === 'approved';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-left space-y-6 font-sans">
      
      {/* Dynamic profile header selector hub - strictly isolated to owner brand */}
      <div className="bg-slate-50 border border-slate-205 rounded p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-bold">Acting Marketplace Merchant profile</span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-bold text-indigo-950 bg-white border border-slate-200 px-3 py-2 rounded shadow-xs flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-4 h-4 text-indigo-600 animate-pulse" /> {selectedVendor?.vendorName}
            </span>
            
            <span className={`text-[10px] px-2.5 py-1.5 rounded uppercase font-black tracking-wider border ${
              isSelectedApproved 
                ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                : 'bg-amber-50 border-amber-250 text-amber-705'
            }`}>
              {selectedVendor?.status} Account
            </span>
          </div>
        </div>

        <div className="text-[10.5px] text-slate-400 font-mono font-medium max-w-sm border-l border-slate-200 pl-4 space-y-0.5 leading-snug">
          <div><span className="text-slate-500 font-bold uppercase">REPRESENTATIVE:</span> {selectedVendor?.representativeName}</div>
          <div><span className="text-slate-500 font-bold uppercase">EMAIL CORE KEY:</span> {selectedVendor?.email}</div>
          <div><span className="text-slate-500 font-bold uppercase">UNIFIED TAX REG:</span> {selectedVendor?.taxId || "N/A"}</div>
        </div>
      </div>

      {/* Onboarding Register Merchant Form */}
      {showRegisterForm && (
        <form onSubmit={handleRegisterVendor} className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="font-bold text-sm text-indigo-600 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5" /> Merchant Registration & Onboarding
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Submit your corporate and representative credentials to request secondary vendor directory catalog privileges on SuuqHub Omnichannel. Accounts will require manual administrative authorization by the platform Superadmin backoffice.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Company / Store Name</label>
              <input required type="text" placeholder="e.g., SuuqHub Organic Foods" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Legal Representative Name</label>
              <input required type="text" placeholder="e.g., Sarah Connor" value={newRepName} onChange={(e) => setNewRepName(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Representative Email</label>
              <input required type="email" placeholder="sarah@corp.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Unified Tax ID / TRN</label>
              <input type="text" placeholder="TRN-9983751" value={newTaxId} onChange={(e) => setNewTaxId(e.target.value)} className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Core Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-850 focus:bg-white focus:outline-none cursor-pointer">
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Living">Home & Living</option>
                <option value="Beauty">Beauty & Health</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Store Description</label>
            <textarea rows={2} placeholder="Brief details about what your brand distributes..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-805 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"></textarea>
          </div>

          <button type="submit" className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer shadow-sm">
            Onboard Merchant Account
          </button>
        </form>
      )}

      {registerMsg && (
        <div className={`p-4 text-xs rounded border flex gap-3 items-start ${
          registerSuccess ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-red-50 border-red-200 text-red-750'
        }`}>
          {registerSuccess ? <CheckCircle2 className="w-5 h-5 text-indigo-605 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-650 mt-0.5 flex-shrink-0" />}
          <div>
            <span className="font-bold block mb-0.5">Application Alert Log</span>
            <p className="leading-relaxed">{registerMsg}</p>
          </div>
        </div>
      )}

      {/* Diagnostic Warning Alert if chosen vendor is pending */}
      {!isSelectedApproved && selectedVendor && (
        <div className="p-4 rounded border bg-amber-50 border-amber-200 text-amber-850 text-xs flex gap-3.5 items-start">
          <AlertCircle className="w-5 h-5 text-amber-705 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block uppercase tracking-wider text-[10px]">Merchant Status: Suspended (Awaiting Platform Audit)</span>
            <p className="leading-relaxed">
              Your acted storefront <b>{selectedVendor.vendorName}</b> is currently awaiting approval from the platform SuperAdmin.
            </p>
            <p className="text-[11px] text-amber-800 font-mono">
              💡 <b>How to approve</b>: Click <b>"SuperAdmin"</b> in the top eye-bar under <i>Live Sandbox Preview Mode</i>. Head to <b>Vendor Approvals</b>, and click <b>Approve</b> to instantly activate this storefront.
            </p>
          </div>
        </div>
      )}

      {/* Core Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
        
        {/* Left column: Merchant Sidebar Controller */}
        <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-8">
          
          {/* Main vertical navigator */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest font-mono">Merchant Console</span>
            
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'products', label: 'Store Products Editor', desc: 'Add & modify inventory', count: 0 },
                { id: 'orders', label: 'Customer Orders', desc: 'Incoming customer orders', count: orders.filter(o => o.status !== 'delivered').length },
                { id: 'campaigns', label: 'Showcase Campaigns', desc: 'Banners & sliders submissions', count: heroCampaigns.filter(c => c.vendorId === selectedVendor?.id && c.status === 'pending').length },
                { id: 'coupons', label: 'Coupon Vouchers', desc: 'Promotional discount campaigns', count: coupons.filter(c => c.vendorId === selectedVendor?.id).length },
                { id: 'finance', label: 'Logistics & Remittances', desc: 'Earnings & financial ledger', count: 0 },
                { id: 'settings', label: 'Merchant Payment Details', desc: 'Mobile wallets config', count: 0 }
              ].map((subTab) => {
                const isActive = activeTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveTab(subTab.id as any)}
                    className={`w-full text-left cursor-pointer px-3.5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border ${isActive ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm' : 'bg-white text-slate-650 border-slate-200/60 hover:bg-slate-50 hover:text-slate-900 shadow-3xs'}`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-extrabold leading-tight">{subTab.label}</span>
                      <span className={`text-[9.5px] font-normal leading-tight mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400 font-mono'}`}>{subTab.desc}</span>
                    </div>
                    {subTab.count > 0 && (
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded font-black ${isActive ? 'bg-white text-indigo-700' : 'bg-indigo-150 text-indigo-700 animate-pulse'}`}>
                        {subTab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Merchant Status box */}
          <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isSelectedApproved ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider font-mono">Storefront Status</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mapped under brand identifier: <span className="font-bold text-slate-700 font-mono block mt-0.5 break-all">{selectedVendor?.id}</span>
            </p>
          </div>

        </div>

        {/* Right column: Main Workspace */}
        <div className="lg:col-span-9 space-y-6">

          {/* Core statistics panels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Acting brand</span>
              <span className="text-sm font-sans font-black text-slate-900 mt-1 truncate block" title={selectedVendor ? selectedVendor.vendorName : 'N/A'}>
                {selectedVendor ? selectedVendor.vendorName : 'N/A'}
              </span>
              <span className="text-[9.5px] text-indigo-500 mt-1 leading-none font-mono">Active marketplace</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Ledger Balance</span>
              <span className="text-sm font-sans font-black text-slate-900 mt-1">
                ${(selectedVendor?.earnings || 0).toLocaleString()} USD
              </span>
              <span className="text-[9.5px] text-emerald-600 font-medium mt-1 leading-none">Unreleased earnings</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Approved Catalog</span>
              <span className="text-sm font-sans font-black text-slate-900 mt-1">
                {products.filter(p=>p.isApproved).length} Products
              </span>
              <span className="text-[9.5px] text-slate-500 mt-1 leading-none">Approved listings</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
              <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Total Intake</span>
              <span className="text-sm font-sans font-black text-slate-900 mt-1">
                {orders.length} Placed
              </span>
              <span className="text-[9.5px] text-xs text-indigo-600 mt-1 leading-none font-mono font-bold">Incoming stream</span>
            </div>

          </div>

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Submit/Edit Product listing */}
          <div className="lg:col-span-12 xl:col-span-5 bg-white rounded p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-1">
              <h2 className="font-sans font-bold text-sm uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <PlusCircle className="w-4.5 h-4.5" /> {editingProduct ? 'Edit Catalog Listing' : 'Submit Vendor Listing'}
              </h2>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 border text-slate-600 uppercase tracking-wider rounded hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancel Edit
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              {editingProduct 
                ? 'Modify variants, narrative details, price levels, or technical specs for this catalog product listing.' 
                : 'Upload new merchandise items directly to the multi-vendor catalogue index. All submissions require administrative authorization of the platform Superadmin before going live.'}
            </p>

            {!isSelectedApproved ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500 font-mono space-y-2">
                <span className="font-bold text-rose-600 block">⚠️ Form Suspended</span>
                <p>You must select or register an **approved** merchant vendor identity to submit new catalogue item listings.</p>
              </div>
            ) : (
              <form onSubmit={handlePostProduct} className="space-y-4">
                {formMsg && (
                  <div className={`p-3 text-xs rounded border flex gap-2.5 items-start ${
                    isSuccess ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-red-50 border-red-200 text-red-750'
                  }`}>
                    {isSuccess ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-605" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <span>{formMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Product Title</label>
                  <input required type="text" placeholder="e.g., Slim Bluetooth Earbuds" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-205 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Price ($ USD)</label>
                    <input required type="number" step="0.01" placeholder="45.99" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Stock Units</label>
                    <input required type="number" placeholder="50" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Custom SKU</label>
                    <input type="text" placeholder="SKU-EB-SLIM" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-850 focus:bg-white focus:outline-none cursor-pointer">
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Living">Home & Living</option>
                      <option value="Beauty">Beauty & Health</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Product Visual Asset</label>
                    <button
                      type="button"
                      onClick={() => {
                        setImage('');
                      }}
                      className="text-[9px] font-mono font-bold text-indigo-600 hover:underline cursor-pointer uppercase"
                    >
                      Clear Current
                    </button>
                  </div>

                  {image ? (
                    <div className="relative group rounded border border-indigo-200 bg-indigo-50/10 p-3.5 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-14 h-14 rounded overflow-hidden bg-white border border-slate-205 flex-shrink-0 shadow-xs">
                          <img 
                            src={image} 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover" 
                            alt="Product Upload View" 
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        </div>
                        <div className="overflow-hidden text-left">
                          <span className="block text-xs font-semibold text-slate-800 truncate">Asset Linked Successfully</span>
                          <span className="block text-[10px] text-slate-400 font-mono font-medium truncate max-w-[210px]">
                            {image.startsWith('data:') ? 'Local Base64 upload stream' : image}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-mono text-[9px] uppercase tracking-wider font-bold shadow-xs cursor-pointer flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded p-6 text-center select-none cursor-pointer transition-all duration-150 ${
                          isDragging 
                            ? 'border-indigo-600 bg-indigo-50/40 scale-[0.98]' 
                            : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50'
                        }`}
                      >
                        <input
                          id="vendor-image-uploader"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImageFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        <label htmlFor="vendor-image-uploader" className="cursor-pointer block space-y-2.5">
                          <div className="mx-auto w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-slate-800 font-semibold">
                              Drag and drop image, or <span className="text-indigo-600 underline">browse your files</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Supports PNG, JPG, JPEG, WEBP
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-[1px] bg-slate-100 flex-1"></div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-wide">OR</span>
                        <div className="h-[1px] bg-slate-100 flex-1"></div>
                      </div>

                      <div>
                        <input
                          type="url"
                          placeholder="Paste remote direct image URL instead..."
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-855 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">detailed listing description</label>
                  <textarea required rows={3} placeholder="Technical details, dimensions, warranties..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"></textarea>
                </div>

                {/* Promo Sale Tag / Discount Price */}
                <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-800 uppercase font-bold">
                    <Percent className="w-3.5 h-3.5 text-amber-600" /> Optional Promotional Markdown
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1 tracking-wider font-semibold">Discount price ($ USD)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 34.99 (Lower than regular price of standard listings)" 
                      value={discountPrice} 
                      onChange={(e) => setDiscountPrice(e.target.value)} 
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500" 
                    />
                    {discountPrice && Number(discountPrice) >= Number(price) && (
                      <span className="text-[9px] text-rose-650 font-medium block mt-1.5">💡 Attention: Markdown price must be lower than normal base price</span>
                    )}
                  </div>
                </div>

                {/* Product Story Narrative */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Product Brand Story / Heritage
                  </label>
                  <textarea 
                    rows={2} 
                    placeholder="Provide a story about the craftsmanship, sourcing, or inspiration of this product..." 
                    value={productStory} 
                    onChange={(e) => setProductStory(e.target.value)} 
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  ></textarea>
                </div>

                {/* Product Color Variants Editor */}
                <div className="border border-slate-150 p-4 rounded-lg bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-700 uppercase font-bold">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Color Variants ({variantsColors.length})
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Color Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Onyx Black" 
                        value={colorName} 
                        onChange={(e) => setColorName(e.target.value)} 
                        className="w-full text-[11px] bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Price Delta ($)</label>
                      <input 
                        type="number" 
                        placeholder="+/- Offset Price" 
                        value={colorPrice} 
                        onChange={(e) => setColorPrice(e.target.value)} 
                        className="w-full text-[11px] font-mono bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Stock Amount</label>
                      <input 
                        type="number" 
                        placeholder="Variant Qty" 
                        value={colorStock} 
                        onChange={(e) => setColorStock(e.target.value)} 
                        className="w-full text-[11px] font-mono bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleAddColorVariant}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[10px] uppercase tracking-wider rounded transition cursor-pointer"
                  >
                    + Register Color Variant Group
                  </button>

                  {/* Interactively Render Added Colors */}
                  {variantsColors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {variantsColors.map((cv) => (
                        <span key={cv.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md font-mono text-[9px] text-slate-700 shadow-3xs">
                          <span className="font-semibold text-slate-800">{cv.name}</span>
                          <span className="text-slate-400 font-normal">({cv.priceModifier >= 0 ? `+$${cv.priceModifier}` : `-$${Math.abs(cv.priceModifier)}`} / Qty: {cv.stock})</span>
                          <button type="button" onClick={() => handleRemoveColorVariant(cv.id)} className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-xs">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Size Variants Editor */}
                <div className="border border-slate-150 p-4 rounded-lg bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-700 uppercase font-bold">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Size / Spec Options ({variantsSizes.length})
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Size Option</label>
                      <input 
                        type="text" 
                        placeholder="e.g., L, 256GB" 
                        value={sizeName} 
                        onChange={(e) => setSizeName(e.target.value)} 
                        className="w-full text-[11px] bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Price Delta ($)</label>
                      <input 
                        type="number" 
                        placeholder="+/- Offset Price" 
                        value={sizePrice} 
                        onChange={(e) => setSizePrice(e.target.value)} 
                        className="w-full text-[11px] font-mono bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Stock Amount</label>
                      <input 
                        type="number" 
                        placeholder="Variant Qty" 
                        value={sizeStock} 
                        onChange={(e) => setSizeStock(e.target.value)} 
                        className="w-full text-[11px] font-mono bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleAddSizeVariant}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[10px] uppercase tracking-wider rounded transition cursor-pointer"
                  >
                    + Register Size Option Group
                  </button>

                  {/* Interactively Render Added Sizes */}
                  {variantsSizes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {variantsSizes.map((sv) => (
                        <span key={sv.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md font-mono text-[9px] text-slate-700 shadow-3xs">
                          <span className="font-semibold text-slate-800">{sv.name}</span>
                          <span className="text-slate-400 font-normal">({sv.priceModifier >= 0 ? `+$${sv.priceModifier}` : `-$${Math.abs(sv.priceModifier)}`} / Qty: {sv.stock})</span>
                          <button type="button" onClick={() => handleRemoveSizeVariant(sv.id)} className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-xs">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Technical Specifications Maker */}
                <div className="border border-slate-150 p-4 rounded-lg bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-700 uppercase font-bold">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" /> Technical Specifications ({Object.keys(specifications).length})
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Spec Key</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Battery Capacity" 
                        value={specKey} 
                        onChange={(e) => setSpecKey(e.target.value)} 
                        className="w-full text-[11px] bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Spec Value</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 5000 mAh" 
                        value={specValue} 
                        onChange={(e) => setSpecValue(e.target.value)} 
                        className="w-full text-[11px] bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddSpecification}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[10px] uppercase tracking-wider rounded transition cursor-pointer"
                  >
                    + Register Technical Metric Item
                  </button>

                  {/* Interactively Render Added Specs */}
                  {Object.keys(specifications).length > 0 && (
                    <div className="space-y-1 block max-h-32 overflow-y-auto pt-1 bg-white border border-slate-150 rounded p-2.5">
                      {Object.entries(specifications).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-[10.5px] font-mono border-b border-slate-50 pb-1">
                          <span className="text-slate-500 font-semibold">{key}:</span>
                          <span className="text-slate-800 flex items-center gap-1.5 font-bold">
                            {val}
                            <button type="button" onClick={() => handleRemoveSpecification(key)} className="text-rose-500 hover:text-rose-700 font-bold px-1 text-sm">✕</button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer shadow-sm">
                  {editingProduct ? 'Save Updated Listing' : 'Create Marketplace Submission'}
                </button>
              </form>
            )}
          </div>

          {/* Right Side: Submitted Items Approval status lists */}
          <div className="lg:col-span-7 bg-white rounded p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-800">
              {selectedVendor ? selectedVendor.vendorName : 'Selected Merchant'}'s submitted catalogue ({products.length})
            </h2>
            
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] pr-1">
              {products.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-400">No submissions uploaded yet for this seller.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="py-4 flex gap-4 text-left items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded bg-slate-50 overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs line-clamp-1">{p.title}</h4>
                        <span className="block text-[10px] text-indigo-505 text-indigo-500 font-mono mt-0.5">{p.category}</span>
                        <div className="flex gap-3 mt-1 text-[10px] font-mono text-slate-400">
                          <span>Price: <span className="text-slate-700 font-semibold">${p.price}</span></span>
                          <span>Stock: <span className="text-slate-700 font-semibold">{p.stock}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-sm border ${
                        p.isApproved 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-amber-50 border-amber-200 text-amber-705'
                      }`}>
                        {p.isApproved ? 'LIVE approved' : 'pending verify'}
                      </span>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1 text-[10px]"
                        title="Edit product specifications, discounts, and story"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button with Custom Inline Confirmation */}
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-205">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-2 py-1 bg-rose-600 text-white font-bold text-[9px] uppercase rounded hover:bg-rose-700 cursor-pointer shadow-3xs"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-1 bg-slate-200 text-slate-700 font-bold text-[9px] uppercase rounded hover:bg-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded border border-slate-200 transition cursor-pointer flex items-center justify-center"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 text-left animate-in fade-in duration-200" id="vendor-orders-section">
          {/* Header Dashboard section */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 animate-pulse" /> {selectedVendor?.vendorName} order management intake
              </h3>
              <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-2xl">
                This console is filtered securely to your storefront items. You are responsible for dispatching, packing, and transitioning fulfillment statuses across active customer cycles.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-205 w-fit">
              {['all', 'pending', 'processing', 'shipped', 'delivered'].map((status) => {
                const count = orders.filter(o => status === 'all' || o.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveStatusFilter(status)}
                    className={`px-3 py-1.5 cursor-pointer rounded text-[10px] font-bold uppercase tracking-wider transition ${
                      activeStatusFilter === status
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Listings Content */}
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">No customer orders recorded</h4>
                <p className="text-[11.5px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  As soon as consumers procure catalogued assets published by your store, their real-time dispatch forms will stream to this queue.
                </p>
              </div>
            </div>
          ) : orders.filter(o => activeStatusFilter === 'all' || o.status === activeStatusFilter).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 font-mono text-xs">
              No product orders are currently in the "{activeStatusFilter.toUpperCase()}" queue stage.
            </div>
          ) : (
            <div className="space-y-5">
              {orders
                .filter(o => activeStatusFilter === 'all' || o.status === activeStatusFilter)
                .map((ord) => {
                  const vendorPortionItems = ord.items.filter(item => products.some(p => p.id === item.productId));
                  const vendorPortionSum = vendorPortionItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const isFullyDelivered = ord.status === 'delivered';

                  return (
                    <div key={ord.id} className="bg-white border rounded-xl border-slate-205 shadow-2xs overflow-hidden transition hover:border-indigo-200" id={`vendor-ord-card-${ord.id}`}>
                      {/* Card visual header */}
                      <div className="bg-slate-50/50 border-b border-slate-100 p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-xs text-slate-800 bg-white border border-slate-205 px-2.5 py-0.5 rounded shadow-3xs select-all">
                              {ord.id}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                              ord.status === 'delivered' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
                              ord.status === 'shipped' ? 'bg-indigo-50 border-indigo-250 text-indigo-700' :
                              'bg-amber-50 border-amber-250 text-amber-705'
                            }`}>
                              {ord.status === 'shipped' ? '🚚 Dispatched (Shipped)' : ord.status}
                            </span>
                            
                            {/* Delivery Method Badge */}
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                              ord.deliveryMethod === 'pickup'
                                ? 'bg-teal-50 border-teal-205 text-teal-700'
                                : 'bg-blue-50 border-blue-255 text-blue-700'
                            }`}>
                              {ord.deliveryMethod === 'pickup' ? '🛒 Self Pickup' : '📦 Home Delivery'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-sans">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ordered date: {new Date(ord.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Revenue Share Display */}
                        <div className="bg-emerald-50/80 border border-emerald-150 rounded-lg px-3.5 py-2 text-right">
                          <span className="block text-[8.5px] uppercase font-bold text-emerald-700 tracking-wider">Your merchant portion</span>
                          <span className="text-base font-sans font-black text-slate-900 leading-none">${vendorPortionSum.toFixed(2)}</span>
                          <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">of total ${ord.total.toFixed(2)} checkout</span>
                        </div>
                      </div>

                      {/* Content Grid Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* Store Items (7 cols) */}
                        <div className="md:col-span-7 p-4.5 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Your Store Goods ({vendorPortionItems.length})</span>
                            {ord.items.length > vendorPortionItems.length && (
                              <span className="text-[9.5px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-100">
                                Contains other merchant items
                              </span>
                            )}
                          </div>

                          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {vendorPortionItems.map((item, idx) => (
                              <div key={idx} className="flex gap-3.5 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                                <div className="w-10 h-10 rounded overflow-hidden bg-white border border-slate-200 shrink-0">
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <span className="block text-xs font-semibold text-slate-800 truncate">{item.title}</span>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-slate-400 mt-0.5 font-mono">
                                    <span>Quantity: <b className="text-slate-700">{item.quantity}</b></span>
                                    <span>Unit: <b className="text-slate-750">${item.price}</b></span>
                                    {item.selectedColor && (
                                      <span className="bg-white px-1 border border-slate-150 inline-block uppercase text-[8.5px] font-semibold text-indigo-600 rounded">Color: {item.selectedColor}</span>
                                    )}
                                    {item.selectedSize && (
                                      <span className="bg-white px-1 border border-slate-150 inline-block uppercase text-[8.5px] font-semibold text-indigo-600 rounded">Size: {item.selectedSize}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="font-mono text-xs font-black text-slate-800 shrink-0">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer Address (5 cols) */}
                        <div className="md:col-span-5 p-4.5 bg-slate-50/10 space-y-3.5">
                          <span className="text-[9.5px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Shipment delivery parameters</span>
                          
                          <div className="space-y-3 text-xs text-slate-700">
                            <div className="flex items-center gap-1.5 font-sans">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-900">{ord.shippingAddress.fullName}</span>
                            </div>

                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5 leading-snug text-[11.5px] text-slate-600 font-sans">
                                <p>{ord.shippingAddress.addressLine1}</p>
                                {ord.shippingAddress.addressLine2 && <p>{ord.shippingAddress.addressLine2}</p>}
                                <p>{ord.shippingAddress.city}, {ord.shippingAddress.state} {ord.shippingAddress.zipCode}</p>
                                <p className="font-black text-slate-500 text-[10px] uppercase tracking-wide">{ord.shippingAddress.country}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-dashed border-slate-150">
                              <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Contact Phone:</span>
                              <span className="font-mono font-medium text-slate-800 text-[11px]">{ord.shippingAddress.phone || "N/A"}</span>
                            </div>

                            <div className="flex flex-col gap-1.5 w-full">
                              <div className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded font-mono border inline-block ${
                                  ord.paymentMethod && ord.paymentMethod.includes('Zaad') ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                                  ord.paymentMethod && ord.paymentMethod.includes('Edahab') ? 'bg-amber-50 text-amber-800 border-amber-150' :
                                  'bg-slate-100 text-slate-650 border-slate-200'
                                }`}>{ord.paymentMethod}</span>
                              </div>
                              {ord.mobilePayment && (
                                <div className="text-[10px] font-mono bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-slate-600 space-y-0.5 text-left w-full">
                                  <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">📶 Mobile Transfer Details:</p>
                                  <p>Txn ID: <span className="underline select-all font-bold text-indigo-600">{ord.mobilePayment.transactionNumber}</span></p>
                                  <p>From: {ord.mobilePayment.senderNumber}</p>
                                  <p>Owner: {ord.mobilePayment.senderName}</p>
                                  <p>Time: {ord.mobilePayment.dateTime}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom status logs tracking */}
                      <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" /> 
                            {expandedOrderId === ord.id ? "Collapse processing history" : "Inspect activity timeline"} ({ord.statusHistory?.length || 1})
                          </button>

                          {expandedOrderId === ord.id && (
                            <div className="mt-4 border-l-2 border-slate-200 pl-4.5 space-y-3.5 py-1 max-w-xl transition-all">
                              {ord.statusHistory?.map((hist, hIdx) => (
                                <div key={hIdx} className="relative text-[11px] leading-relaxed">
                                  <span className="absolute -left-[23.5px] top-1.5 w-2 h-2 rounded-full border border-white bg-slate-400"></span>
                                  <div className="flex items-center gap-2 font-mono text-[9px] font-black">
                                    <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase">{hist.status}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-400">{new Date(hist.timestamp).toLocaleString()}</span>
                                  </div>
                                  <p className="text-slate-650 mt-1 italic text-slate-700">"{hist.note || 'Dispatch status change update.'}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Order Control transitions actions matching role logic */}
                        <div className="flex gap-2 justify-end items-center">
                          {transitioningOrderId === ord.id && (
                            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold font-mono">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> executing update...
                            </div>
                          )}

                          {ord.deliveryMethod !== 'pickup' ? (
                            <>
                              {ord.status === 'pending' ? (
                                <button
                                  disabled={transitioningOrderId !== null}
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'processing', `Store seller merchant ${selectedVendor?.vendorName} has approved checkout and packaged the item. Ready for SuuqHub courier pickup.`)}
                                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <ArrowRight className="w-4 h-4" /> Approve & Pack order (Home Delivery)
                                </button>
                              ) : ord.status === 'processing' ? (
                                <div className="flex flex-col gap-1 text-left p-3.5 bg-amber-50 border border-amber-205 rounded-lg max-w-xs sm:max-w-sm font-sans">
                                  <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
                                    📦 Packed & Awaiting SuuqHub Dispatch
                                  </span>
                                  <p className="text-[10px] text-amber-700 leading-normal">
                                    Vendor packaging done. SuuqHub operations has been notified and will handle courier dispatching shortly.
                                  </p>
                                </div>
                              ) : ord.status === 'shipped' ? (
                                <div className="flex flex-col gap-1 text-left p-3.5 bg-indigo-50 border border-indigo-150 rounded-lg max-w-xs sm:max-w-sm font-sans">
                                  <span className="text-[10px] uppercase font-bold text-indigo-800 flex items-center gap-1">
                                    🚚 Dispatched with SuuqHub Courier
                                  </span>
                                  <p className="text-[10px] text-indigo-750 leading-normal font-medium">
                                    Active dispatch status: Out in transit with SuuqHub's central delivery fleet.
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1 text-left p-3.5 bg-emerald-50 border border-emerald-150 rounded-lg max-w-xs sm:max-w-sm font-sans">
                                  <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                                    ✅ Delivered successfully
                                  </span>
                                  <p className="text-[10px] text-emerald-750 leading-normal">
                                    Completed home delivery fulfillment.
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {ord.status === 'pending' && (
                                <button
                                  disabled={transitioningOrderId !== null}
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'processing', `Store seller merchant ${selectedVendor?.vendorName} has approved checkout. Customer self-pickup package is being structured.`)}
                                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <ArrowRight className="w-4 h-4" /> Approve & Pack order (Pickup)
                                </button>
                              )}

                              {ord.status === 'processing' && (
                                <button
                                  disabled={transitioningOrderId !== null}
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'shipped', `Sellers packaging done. Package is prepared and marked waiting for client self-pickup.`)}
                                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95 animate-pulse"
                                >
                                  <Truck className="w-4 h-4" /> Ready for Customer Pickup
                                </button>
                              )}

                              {ord.status === 'shipped' && (
                                <button
                                  disabled={transitioningOrderId !== null}
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'delivered', `Fulfillment verified; confirmed patient client picked up items directly at storefront.`)}
                                  className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <Check className="w-4 h-4 font-bold" /> Complete Self Pickup handover
                                </button>
                              )}
                            </>
                          )}

                          {isFullyDelivered && (
                            <div className="flex items-center gap-2 text-[10px] text-emerald-750 bg-emerald-50 border border-emerald-150 px-3 py-2 rounded-lg font-black uppercase tracking-wider font-mono shadow-3xs">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-3" /> Fulfillment complete
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200" id="vendor-campaigns-section">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4 text-left">
            <h2 className="font-sans font-bold text-sm uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4.5 h-4.5" /> Request Hero Banner Promo
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Feature products on the primary landing page carousel slider of SuuqHub! Superadmin charges a promo service fee of <b>$25.00 AED/USD per day</b>.
            </p>

            {!selectedVendor || selectedVendor.status !== 'approved' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500 font-mono space-y-2">
                <span className="font-bold text-rose-600 block">⚠️ Form Suspended</span>
                <p>You must select or register an active approved vendor identity to request dynamic carousel advertising slots.</p>
              </div>
            ) : (
              <form onSubmit={handlePostCampaign} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Promotion Main Title</label>
                  <input required type="text" placeholder="e.g., Midnight Soundscapes Aura Elite" value={campTitle} onChange={(e) => setCampTitle(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Subheading / Description</label>
                  <input type="text" placeholder="e.g., Up to 40% discount with code SUUQ10 today" value={campSubtitle} onChange={(e) => setCampSubtitle(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Pricing Tier</label>
                    <select value={campPricingTier} onChange={(e) => setCampPricingTier(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-850 focus:bg-white focus:outline-none cursor-pointer">
                      <option value="Frontpage Premium Hero">Frontpage Premium Hero</option>
                      <option value="VIP Super Banner">VIP Super Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Duration (Days)</label>
                    <select value={campDuration} onChange={(e) => setCampDuration(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-850 focus:bg-white focus:outline-none cursor-pointer">
                      <option value="7">7 Days ($175)</option>
                      <option value="14">14 Days ($350)</option>
                      <option value="30">30 Days ($750)</option>
                    </select>
                  </div>
                </div>

                {/* Banner Image Drag and Drop Upload */}
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1.5 tracking-wider">Slide Showcase Image</label>
                  
                  {campImage ? (
                    <div className="relative rounded border border-slate-200 bg-slate-100 overflow-hidden h-32 flex items-center justify-center">
                      <img src={campImage} alt="Preview Banner" className="w-[100%] h-[100%] object-cover" />
                      <button type="button" onClick={() => setCampImage('')} className="absolute top-2 right-2 p-1.5 bg-red-650 text-white rounded-full hover:bg-red-700 transition cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingCampImage(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingCampImage(false); }}
                      onDrop={(e) => { e.preventDefault(); setIsDraggingCampImage(false); if (e.dataTransfer.files?.length) handleCampImageFile(e.dataTransfer.files[0]); }}
                      className={`h-32 border-2 border-dashed rounded flex flex-col items-center justify-center p-4 transition-colors cursor-pointer select-none ${
                        isDraggingCampImage ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/30'
                      }`}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = (e: any) => {
                          if (e.target.files?.length) handleCampImageFile(e.target.files[0]);
                        };
                        fileInput.click();
                      }}
                    >
                      <Image className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-medium text-slate-605 block">Drag & drop image or click to browse</span>
                      <span className="text-[9px] text-slate-400 font-mono">PNG, JPG, WEBP formats</span>
                    </div>
                  )}
                  
                  {/* Visual Premium Image Presets Helper */}
                  <div className="mt-2 text-left">
                    <span className="block text-[8.5px] uppercase font-mono text-slate-400 mb-1 font-bold tracking-wider">Or Select Aesthetic Showcase Presets:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setCampImage("https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=80")}
                        className="px-2 py-1 border border-slate-200 rounded text-[9px] bg-slate-50 hover:bg-white truncate font-medium font-mono cursor-pointer"
                      >
                        ⏱️ Smartwatch
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampImage("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80")}
                        className="px-2 py-1 border border-slate-200 rounded text-[9px] bg-slate-50 hover:bg-white truncate font-medium font-mono cursor-pointer"
                      >
                        🎧 Headset
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampImage("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80")}
                        className="px-2 py-1 border border-slate-200 rounded text-[9px] bg-slate-50 hover:bg-white truncate font-medium font-mono cursor-pointer"
                      >
                        🎒 BackpackPreset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="bg-indigo-50 border border-indigo-150 rounded p-3 text-left mb-3">
                    <span className="block text-[9px] uppercase font-mono text-slate-550 font-bold tracking-wider">Charged Service Fee Summary</span>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-slate-600 font-medium">Daily Rate ({campDuration} Days)</span>
                      <span className="font-mono text-indigo-750 font-bold">${parseInt(campDuration, 10) * 25}.00 AED/USD</span>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Submit Campaign Banner
                  </button>
                </div>
              </form>
            )}

            {campMsg && (
              <div className={`p-4 text-xs rounded border flex gap-3 items-start ${
                campIsSuccess ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-red-50 border-red-200 text-red-750'
              }`}>
                {campIsSuccess ? <CheckCircle2 className="w-5 h-5 text-indigo-605 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-650 mt-0.5 flex-shrink-0" />}
                <div>
                  <span className="font-bold block mb-0.5">Application Status Report</span>
                  <p className="font-mono text-[10px] leading-relaxed">{campMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Submitted History list */}
          <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Requested Image Banners ({heroCampaigns.filter(c => c.vendorId === selectedVendor?.id).length})</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Review your real-time slider requests, fees charged, and superadmin authorization statuses.</p>

            <div className="space-y-4">
              {heroCampaigns.filter(c => c.vendorId === selectedVendor?.id).length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded bg-slate-50/50">
                  <Image className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <span className="text-xs font-mono text-slate-500 block">No slider promotional campaigns requested yet.</span>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">Submitted campaigns appear here with real-time approved timelines.</p>
                </div>
              ) : (
                heroCampaigns.filter(c => c.vendorId === selectedVendor?.id).map((camp) => (
                  <div key={camp.id} className="p-4 border border-slate-200 rounded bg-slate-50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-3.5 items-center">
                      <div className="w-16 h-12 bg-slate-200 rounded border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={camp.image} alt="Campaign preview" className="w-full h-full object-cover animate-pulse" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <span className="block text-xs font-bold text-slate-900">{camp.title}</span>
                        <p className="text-[11px] text-slate-500 italic max-w-sm">"{camp.subtitle || 'No subtitle provided.'}"</p>
                        <div className="flex flex-wrap gap-2 pt-1 font-mono">
                          <span className="text-[8.5px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1.5 rounded">{camp.pricingTier}</span>
                          <span className="text-[8.5px] bg-slate-200/60 text-slate-650 px-1.5 rounded">Duration: {camp.durationDays} Days</span>
                          <span className="text-[8.5px] bg-emerald-55 bg-emerald-50 text-emerald-800 font-bold px-1.5 rounded">Paid: ${camp.feeUSD}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5 self-stretch sm:self-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-black tracking-wide ${
                        camp.status === 'approved'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : camp.status === 'rejected'
                          ? 'bg-red-50 border border-red-200 text-red-700'
                          : 'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}>
                        {camp.status}
                      </span>
                      {camp.status === 'rejected' && camp.rejectionReason && (
                        <span className="text-[9.5px] font-mono text-red-605 block max-w-[150px] text-wrap text-right leading-tight">Reason: {camp.rejectionReason}</span>
                      )}
                      <span className="text-[8.5px] font-mono text-slate-400">{new Date(camp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-250 font-sans text-left" id="vendor-coupons-section">
          {/* Left Column: Register Coupon Form */}
          <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-sans font-bold text-sm uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 mb-1">
              <Tag className="w-4.5 h-4.5" /> Mint Coupon Campaign
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Spawn standard alphanumeric coupon vouchers that customers can leverage during checkout. These promo codes apply store-wide on your items.
            </p>

            {!selectedVendor || selectedVendor.status !== 'approved' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500 font-mono space-y-2">
                <span className="font-bold text-rose-600 block">⚠️ Form Suspended</span>
                <p>Register an approved storefront to create discount coupons.</p>
              </div>
            ) : (
              <form onSubmit={handlePostCoupon} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Coupon Code</label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomCoupon}
                      className="text-[9.5px] font-mono font-black text-indigo-600 hover:text-indigo-850 hover:underline cursor-pointer uppercase font-bold"
                    >
                      🎲 Generate Code
                    </button>
                  </div>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. SPECIAL30" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Discount Type</label>
                    <select 
                      value={couponType} 
                      onChange={(e) => setCouponType(e.target.value as 'percentage' | 'fixed')} 
                      className="w-full text-xs bg-slate-50 border border-slate-205 rounded px-4 py-3 text-slate-800 cursor-pointer focus:bg-white focus:outline-none"
                    >
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="fixed">Fixed Amount ($ USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">
                      {couponType === 'percentage' ? 'Percentage Value (%)' : 'Discount Amount ($)'}
                    </label>
                    <input 
                      required 
                      type="number" 
                      placeholder={couponType === 'percentage' ? '20' : '15'} 
                      value={couponValue} 
                      onChange={(e) => setCouponValue(e.target.value)} 
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Min Spend ($)</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 50 (0 for none)" 
                      value={couponMinSpend} 
                      onChange={(e) => setCouponMinSpend(e.target.value)} 
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Expiration Date</label>
                    <input 
                      type="date" 
                      value={couponExpiry} 
                      onChange={(e) => setCouponExpiry(e.target.value)} 
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 px-4 py-2.5 rounded text-slate-800 cursor-pointer focus:bg-white focus:outline-none" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Tag className="w-4 h-4" /> Issue Coupon Campaign
                </button>
              </form>
            )}

            {couponMsg && (
              <div className={`p-4 text-xs rounded border flex gap-3 items-start ${
                couponIsSuccess ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-red-50 border-red-200 text-red-750'
              }`}>
                {couponIsSuccess ? <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-650 mt-0.5 shrink-0" />}
                <div>
                  <span className="font-bold block mb-0.5">Application Status Report</span>
                  <p className="font-mono text-[10px] leading-relaxed">{couponMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Existing Coupons list */}
          <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wider">
              Published Store Coupons ({coupons.filter(c => c.vendorId === selectedVendor?.id).length})
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ticket list of active coupon campaigns for your brand storefront. Customers apply these during shopping checkout checks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.filter(c => c.vendorId === selectedVendor?.id).length === 0 ? (
                <div className="col-span-2 p-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  <Tag className="w-8 h-8 text-slate-355 mx-auto mb-2" />
                  <span className="text-xs font-mono text-slate-500 font-bold block">No coupon campaigns active yet.</span>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">Click "Generate Code" or customize a key to start your first campaign!</p>
                </div>
              ) : (
                coupons.filter(c => c.vendorId === selectedVendor?.id).map((cp) => {
                  const isExpired = cp.expiryDate ? new Date(cp.expiryDate) < new Date() : false;
                  return (
                    <div 
                      key={cp.id} 
                      className="border-2 border-dashed border-slate-200 hover:border-indigo-300 bg-slate-50/30 p-4 rounded-xl relative overflow-hidden transition-all duration-200 flex flex-col justify-between h-40 group"
                    >
                      {/* Ticket Stub Cuts (Visual Left/Right semi-circles!) */}
                      <div className="absolute left-[-8px] top-[48%] w-4 h-4 rounded-full bg-slate-100 border-r border-slate-200"></div>
                      <div className="absolute right-[-8px] top-[48%] w-4 h-4 rounded-full bg-slate-100 border-l border-slate-200"></div>

                      <div className="space-y-1.5 pl-2">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="text-sm font-mono font-black tracking-wider text-slate-900 select-all bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {cp.code}
                          </span>
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase font-black ${
                            isExpired 
                              ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                              : cp.isActive 
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                              : 'bg-slate-200 text-slate-650'
                          }`}>
                            {isExpired ? 'expired' : cp.isActive ? 'active' : 'inactive'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 font-bold">
                          {cp.discountType === 'percentage' ? `${cp.value}% Off` : `$${cp.value} Off`} Your Order
                        </p>
                        
                        <p className="text-[10px] text-slate-505 text-slate-500 leading-normal">
                          {cp.minSpend > 0 ? `Minimum order value of $${cp.minSpend}` : 'Applicable store-wide on all your products'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 bg-slate-50/10 pl-2">
                        <span className="text-[9px] font-mono text-slate-400">
                          Expires: {cp.expiryDate || 'Never'}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(cp.id)}
                          className="p-1 px-2 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded transition font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && selectedVendor && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6 text-left animate-in fade-in duration-200" id="vendor-portal-settings">
          <div>
            <h2 className="font-sans font-bold text-sm uppercase tracking-wider text-indigo-650 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-2">
              <Sliders className="w-5 h-5 text-indigo-600" /> Platform mobile payment Configurations
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define your brand's official merchant telephone lines for Somaliland's popular mobile wallets (Zaad & eDahab). SuuqHub customers will send digital payments directly to these lines during their checkout sandbox flows.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {settingsMsg && (
              <div className={`p-4 text-xs rounded-lg border flex gap-3 items-center ${
                settingsSuccess ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-red-50 border-red-200 text-red-750'
              }`}>
                {settingsSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{settingsMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Store Owner / Representative Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Salem Al-Mansoori"
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-emerald-150 bg-emerald-50/10 space-y-2">
                <span className="text-[10px] font-mono font-black tracking-wider text-emerald-600 uppercase flex items-center gap-1">
                  🟢 Zaad Service Tel
                </span>
                <p className="text-[10.5px] text-slate-500 leading-normal">Your primary Somaliland subscriber line to receive Zaad transfers.</p>
                <input
                  required
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 634400213"
                  value={zaadNumber}
                  onChange={(e) => setZaadNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-4 rounded-xl border border-amber-150 bg-amber-50/10 space-y-2">
                <span className="text-[10px] font-mono font-black tracking-wider text-amber-700 uppercase flex items-center gap-1">
                  🟡 eDahab Service Tel
                </span>
                <p className="text-[10.5px] text-slate-500 leading-normal">Your primary Somaliland subscriber line to receive eDahab wallets.</p>
                <input
                  required
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 627700213"
                  value={edahabNumber}
                  onChange={(e) => setEdahabNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-550"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Merchant configurations
            </button>
          </form>
        </div>
      )}

      {activeTab === 'finance' && selectedVendor && (() => {
        // Compute Finance metrics
        const totalMobileEarned = orders
          .filter(o => o.paymentMethod && (o.paymentMethod.includes('Zaad') || o.paymentMethod.includes('Edahab')))
          .reduce((sum, o) => sum + o.total, 0);

        const deliveryOwedList = orders.filter(o => o.deliveryMethod === 'delivery' && (o.deliveryFeeRemittanceStatus === 'owed' || !o.deliveryFeeRemittanceStatus));
        const totalRemittableFees = deliveryOwedList.reduce((sum, o) => sum + (o.shippingCost ?? 15), 0);

        const awaitingVerificationList = orders.filter(o => o.deliveryFeeRemittanceStatus === 'submitted');
        const verifiedFeesList = orders.filter(o => o.deliveryFeeRemittanceStatus === 'confirmed');

        return (
          <div className="space-y-6 text-left animate-in fade-in duration-200" id="vendor-portal-finance">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-250 p-5 shadow-xs">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold mb-1">Mobile customer payments Total</span>
                <span className="text-xl font-mono font-black text-slate-900">${totalMobileEarned.toFixed(2)} USD</span>
                <p className="text-[10px] text-slate-400 mt-1">Directly credited to your configured telephone vaults.</p>
              </div>

              <div className="bg-rose-50/50 rounded-xl border border-rose-150 p-5 shadow-xs">
                <span className="text-[10px] text-rose-500 block uppercase font-mono tracking-wider font-bold mb-1">Owed logistics Fees</span>
                <span className="text-xl font-mono font-black text-rose-800">${totalRemittableFees.toFixed(2)} USD</span>
                <p className="text-[10px] text-rose-600/80 mt-1">{deliveryOwedList.length} Home Delivery orders pending remittance.</p>
              </div>

              <div className="bg-indigo-50/30 rounded-xl border border-indigo-150 p-5 shadow-xs">
                <span className="text-[10px] text-indigo-600 block uppercase font-mono tracking-wider font-bold mb-1">Remittances logged waiting Audit</span>
                <span className="text-xl font-mono font-black text-indigo-800">{awaitingVerificationList.length} Transactions</span>
                <p className="text-[10px] text-indigo-500 mt-1">Pending approval checking by platform controllers.</p>
              </div>
            </div>

            {/* Core Ledger Segment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Remittance Action Form when order is selected */}
              {activeRemitOrderId ? (() => {
                const targetOrder = orders.find(o => o.id === activeRemitOrderId);
                if (!targetOrder) return null;
                return (
                  <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-xl p-5 border border-indigo-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                        <DollarSign className="w-4.5 h-4.5" /> Submit Remittance Form
                      </h4>
                      <button 
                        onClick={() => setActiveRemitOrderId(null)}
                        className="p-1 px-2.5 bg-slate-100 font-mono text-[9px] font-black rounded text-slate-500 hover:bg-slate-200 uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      Remit the required delivery charge of <strong className="text-slate-800">${(targetOrder.shippingCost ?? 15).toFixed(2)} USD</strong> for order <strong className="font-mono text-indigo-605">#{targetOrder.id.substring(0, 8)}</strong> to SuuqHub admin:
                    </p>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5 text-xs">
                      <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">SuuqHub central remittance details</span>
                      <p className="font-semibold text-slate-800">Please send mobile wallet transfer to:</p>
                      <ul className="space-y-1 text-[11px] font-mono pl-1 text-slate-700">
                        <li>• Zaad Number: <strong className="text-emerald-700">638899122</strong></li>
                        <li>• eDahab Number: <strong className="text-amber-700">628899122</strong></li>
                      </ul>
                    </div>

                    <form onSubmit={handlePostRemittance} className="space-y-3.5">
                      {remitMsg && (
                        <div className={`p-3 text-[10.5px] rounded border flex gap-2 items-start ${
                          remitSuccess ? 'bg-indigo-50 border-indigo-150 text-indigo-700' : 'bg-red-50 border-red-150 text-red-700'
                        }`}>
                          {remitSuccess ? <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 select-none" /> : <AlertCircle className="w-4.5 h-4.5 text-red-600" />}
                          <span>{remitMsg}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Choose Payment Wallet Method used</label>
                        <select
                          value={remitProvider}
                          onChange={(e) => setRemitProvider(e.target.value as 'zaad' | 'edahab')}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 cursor-pointer focus:bg-white focus:outline-none"
                        >
                          <option value="zaad">Zaad Pay Mobile Network</option>
                          <option value="edahab">eDahab Wallet Network</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Your Mobile Number Sent From</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. 634411222"
                            value={remitSenderMobile}
                            onChange={(e) => setRemitSenderMobile(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Official Wallet receipt transaction ID</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. TX-W9818"
                            value={remitTxnId}
                            onChange={(e) => setRemitTxnId(e.target.value)}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-805 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Brief transfer details note</label>
                        <input
                          type="text"
                          placeholder="e.g. remitted via Zaad for order"
                          value={remitNotes}
                          onChange={(e) => setRemitNotes(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" /> Remit Logistics ${(targetOrder.shippingCost ?? 15)}
                      </button>
                    </form>
                  </div>
                );
              })() : (
                <div className="lg:col-span-12 xl:col-span-5 bg-indigo-50/20 border border-indigo-150 p-5 rounded-xl text-xs space-y-3">
                  <span className="text-[10px] font-mono font-black tracking-wider text-indigo-700 uppercase block">Logistics fee remittance manual</span>
                  <p className="leading-relaxed text-slate-600">
                    For every order delivered directly to the client's home, the platform coordinates dispatch logs. Merchants are required to remit the order's specific delivery cost back to SuuqHub Central.
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    To remit, review the <strong>SuuqHub central Ledger</strong> in the right-side box, isolate any status labeled <span className="px-1.5 py-0.5 bg-rose-150 text-rose-800 border-rose-200 rounded text-[9.5px] font-bold">owed</span>, click the remit action key, transfer money via your mobile subscriber, and post receipt details to trigger validation.
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-slate-500 flex items-center justify-between">
                    <span>Verified transfers history:</span>
                    <span className="font-bold text-slate-800">{verifiedFeesList.length} total orders approved</span>
                  </div>
                </div>
              )}

              {/* Right Column: Ledger Orders Grid */}
              <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Platform Logistics Ledger</h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{orders.filter(o=>o.deliveryMethod==='delivery').length} Logistics items</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                        <th className="p-2.5">Order Info</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5">Remittance Status</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {orders.filter(o => o.deliveryMethod === 'delivery').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 italic">No delivery logistics logged for this storefront.</td>
                        </tr>
                      ) : (
                        orders.filter(o => o.deliveryMethod === 'delivery').map((o) => {
                          const remStatus = o.deliveryFeeRemittanceStatus || 'owed';
                          return (
                            <tr key={o.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-mono">
                                <span className="font-bold text-slate-800">#{o.id.substring(0, 8)}</span>
                                <span className="text-[9.5px] text-slate-400 block">{o.customerName}</span>
                              </td>
                              <td className="p-2.5 text-slate-500 font-mono">
                                {o.createdAt ? o.createdAt.substring(0,10) : 'N/A'}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-805">
                                ${(o.shippingCost ?? 15).toFixed(2)}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                  remStatus === 'confirmed' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                                    : remStatus === 'submitted' 
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-150 animate-pulse' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-150'
                                }`}>
                                  {remStatus === 'owed' ? 'owed' : remStatus === 'submitted' ? 'pending audit' : 'verified / paid'}
                                </span>
                                {remStatus === 'submitted' && o.deliveryFeeRemittanceDetails && (
                                  <span className="block text-[8px] font-mono mt-0.5 text-slate-400">
                                    Txn: {o.deliveryFeeRemittanceDetails.transactionNumber}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                {remStatus === 'owed' ? (
                                  <button
                                    onClick={() => {
                                      setActiveRemitOrderId(o.id);
                                      setRemitSenderMobile('');
                                      setRemitTxnId('');
                                      setRemitNotes('');
                                    }}
                                    className="px-2 py-1 text-[9.5px] font-mono font-bold bg-indigo-55 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded uppercase transition cursor-pointer"
                                  >
                                    Remit Wallet
                                  </button>
                                ) : (
                                  <span className="text-slate-450 italic text-[10px]">Submitted</span>
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
          </div>
        );
      })()}
        </div>
      </div>
    </div>
  );
}
