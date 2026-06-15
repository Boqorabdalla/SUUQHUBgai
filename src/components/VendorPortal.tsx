/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Sparkles, AlertCircle, DollarSign, Package, Check, ShoppingBag, Eye, ShieldCheck, CheckCircle2, Upload, Trash2, Image, Truck, Calendar, User, MapPin, CreditCard, ArrowRight, Clock, Tag, Sliders, X, Percent, RefreshCw, ChevronDown, ChevronRight, Users, BarChart2, FileText, Plus, Search } from 'lucide-react';
import { Product, Vendor, Order, OrderItem, OrderStatus, Coupon, ProductVariant, ProductCategory, SupportTicket } from '../types';

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

const compressBase64Image = (base64Str: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/') || base64Str.length < 40000) {
      resolve(base64Str);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (e) {
        console.warn('Canvas toDataURL failed or security exception:', e);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface VendorPortalProps {
  userId: string;
  userEmail: string;
  userRole: string;
  lang: 'en' | 'ar' | 'es';
  currentCurrency: 'USD' | 'EUR' | 'AED';
  onVendorUpdated?: () => void;
}

export default function VendorPortal({
  userId,
  userEmail,
  userRole,
  lang,
  currentCurrency,
  onVendorUpdated
}: VendorPortalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [availableCategories, setAvailableCategories] = useState<string[]>(['Electronics', 'Fashion', 'Living', 'Beauty']);
  const [fullCategoriesList, setFullCategoriesList] = useState<ProductCategory[]>([]);
  const [subcategory, setSubcategory] = useState('');

  // Tree sidebar navigation fold controllers
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    products: true,
    orders: true,
    promotions: true,
    marketing: true,
    reports: true,
    people: true,
    settings: true
  });

  // POS (Point of Sale) State
  const [posCart, setPosCart] = useState<{product: Product, quantity: number, selectedColor?: string, selectedSize?: string}[]>([]);
  const [posCategoryFilter, setPosCategoryFilter] = useState<'all' | 'physical' | 'digital'>('all');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posExtraDiscount, setPosExtraDiscount] = useState<string>('0');
  const [posSelectedCoupon, setPosSelectedCoupon] = useState<Coupon | null>(null);
  const [posPaidBy, setPosPaidBy] = useState<'cash' | 'card'>('cash');
  const [posPaidAmount, setPosPaidAmount] = useState<string>('');
  const [posSuccessInvoice, setPosSuccessInvoice] = useState<any | null>(null);
  const [posSelectedCategory, setPosSelectedCategory] = useState<string>('all');
  const [posAddingStatus, setPosAddingStatus] = useState<string>('');

  // Withdraw request modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawProvider, setWithdrawProvider] = useState<'zaad' | 'edahab'>('zaad');
  const [withdrawNumber, setWithdrawNumber] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawIsSuccess, setWithdrawIsSuccess] = useState(false);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState(500);
  const [alreadyWithdrawnAmount, setAlreadyWithdrawnAmount] = useState(600);

  // Advanced Reports Filters
  const [reportTransType, setReportTransType] = useState<'all' | 'order' | 'expense'>('all');
  const [reportPeriod, setReportPeriod] = useState<string>('year');
  const [reportSelectedCategory, setReportSelectedCategory] = useState<string>('all');

  // Clearance Configuration States
  const [clearanceRate, setClearanceRate] = useState<string>('15');
  const [clearanceActive, setClearanceActive] = useState<boolean>(false);
  const [clearanceMsg, setClearanceMsg] = useState<string>('');

  // Shipping Configuration States
  const [logisticShippingMethods, setLogisticShippingMethods] = useState([
    { id: '1', name: 'Standard Delivery', price: 15, active: true, etd: '1-2 Days' },
    { id: '2', name: 'Apex Speed Express', price: 30, active: true, etd: 'Within 4 Hours' },
    { id: '3', name: 'VIP Home Dropoff', price: 45, active: false, etd: 'Scheduled Evening' }
  ]);

  // Mock Customers Data
  const [mockCustomers, setMockCustomers] = useState([
    { id: 'cust-1', name: 'Khadar Ahmed', email: 'khadar@dahab.org', phone: '634455881', ordersCount: 5, totalSpend: 250 },
    { id: 'cust-2', name: 'Suhur Hersi', email: 'suhur@hubaal.com', phone: '624778899', ordersCount: 11, totalSpend: 840 },
    { id: 'cust-3', name: 'Mohamed Rage', email: 'rage@suuq.so', phone: '634120304', ordersCount: 2, totalSpend: 95 },
    { id: 'cust-4', name: 'Amal Duale', email: 'amal.duale@outlook.com', phone: '634991122', ordersCount: 16, totalSpend: 1450 }
  ]);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [custMsg, setCustMsg] = useState('');

  useEffect(() => {
    if (userRole === 'order_manager') {
      setActiveTab('orders');
    }
  }, [userRole]);

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');

  const matchStatusOption = (o: Order, filterVal: string) => {
    const s = ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) as string;
    if (!filterVal || filterVal === 'all') return true;
    
    if (filterVal === 'pending') return s === 'pending';
    if (filterVal === 'confirmed') return s === 'confirmed';
    if (filterVal === 'processing' || filterVal === 'packaging') return s === 'processing' || s === 'packaging';
    if (filterVal === 'shipped' || filterVal === 'delivery') return s === 'shipped' || s === 'out-for-delivery' || s === 'out_for_delivery';
    if (filterVal === 'delivered') return s === 'delivered';
    if (filterVal === 'returned') return s === 'returned';
    if (filterVal === 'failed') return s === 'failed' || s === 'failed_to_deliver';
    if (filterVal === 'canceled') return s === 'canceled';
    
    return s === filterVal;
  };
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [transitioningOrderId, setTransitioningOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Vendor Finance & Settings Settings
  const [zaadNumber, setZaadNumber] = useState('');
  const [edahabNumber, setEdahabNumber] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [banner, setBanner] = useState('');
  const [logo, setLogo] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [vendorDescription, setVendorDescription] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Remittance Form States
  const [activeRemitOrderId, setActiveRemitOrderId] = useState<string | null>(null);
  const [remitTxnId, setRemitTxnId] = useState('');
  const [remitSenderMobile, setRemitSenderMobile] = useState('');
  const [remitDateTime, setRemitDateTime] = useState('');
  const [remitNotes, setRemitNotes] = useState('');
  const [remitMsg, setRemitMsg] = useState('');
  const [remitSuccess, setRemitSuccess] = useState(false);
  const [remitProvider, setRemitProvider] = useState<'zaad' | 'edahab'>('zaad');

  // Emergency Help Form States
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [emergencyUrgency, setEmergencyUrgency] = useState('CRITICAL_POS_DOWN');
  const [emergencyMsg, setEmergencyMsg] = useState('');
  const [emergencySuccess, setEmergencySuccess] = useState(false);
  const [submittingEmergency, setSubmittingEmergency] = useState(false);
  const [supportTicketsList, setSupportTicketsList] = useState<SupportTicket[]>([]);

  const lastVendorIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (selectedVendor) {
      if (lastVendorIdRef.current !== selectedVendor.id) {
        setZaadNumber(selectedVendor.zaadNumber || '');
        setEdahabNumber(selectedVendor.edahabNumber || '');
        setRepresentativeName(selectedVendor.representativeName || '');
        setBanner(selectedVendor.banner || '');
        setLogo(selectedVendor.logo || '');
        setIsClosed(!!selectedVendor.isClosed);
        setVendorDescription(selectedVendor.description || '');
        setEmergencyPhone(selectedVendor.zaadNumber || selectedVendor.edahabNumber || '');
        lastVendorIdRef.current = selectedVendor.id;
      }
    } else {
      lastVendorIdRef.current = null;
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
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressBase64Image(reader.result, 600, 600, 0.75);
        setImage(compressed);
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

  useEffect(() => {
    // Silent background polling every 7 seconds to grab live order status changes from the SuperAdmin
    const interval = setInterval(() => {
      if (userEmail) {
        fetchInitialData(true);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const fetchInitialData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            setFullCategoriesList(catData);
            setAvailableCategories(catData.map((c: any) => c.name));
          }
        }
      } catch (catErr) {
        console.warn("Could not load dynamic categories for VendorPortal:", catErr);
      }

      const [pRes, vRes, oRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/vendors'),
        fetch('/api/orders')
      ]);
      const pData = await pRes.json();
      const vData = await vRes.json();
      const oData = await oRes.json();

      // Filter vendors to isolate ONLY the logged-in representative's email or sub-user email
      const isSuper = userRole === 'superadmin' || userRole === 'admin';
      const matchingVendors = isSuper
        ? vData
        : vData.filter(
            (v: Vendor) => 
              (v.email && v.email.toLowerCase() === userEmail.toLowerCase()) ||
              (v.subUsers && v.subUsers.some((su: any) => su.email && su.email.toLowerCase() === userEmail.toLowerCase()))
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
      await fetchSupportTickets();
    } catch (err) {
      console.error('Error synchronizing vendor portal:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setSupportTicketsList(data);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
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

  const handleSubmitEmergencyHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyPhone.trim() || !emergencyDescription.trim()) {
      setEmergencyMsg('Please enter both your phone number and description.');
      setEmergencySuccess(false);
      return;
    }

    setSubmittingEmergency(true);
    setEmergencyMsg('');
    try {
      const subject = `EMERGENCY CALLBACK REQUEST [${emergencyUrgency}]: ${selectedVendor?.vendorName || 'Unknown Merchant'}`;
      const message = `Callback requested by representative. Tel: ${emergencyPhone}. Issue: ${emergencyDescription}`;

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedVendor?.id || 'vendor-unknown',
          userName: selectedVendor?.representativeName || 'Merchant Representative',
          subject,
          message
        })
      });

      if (res.ok) {
        setEmergencySuccess(true);
        setEmergencyMsg(`Emergency callback registered! Our operator will contact you on ${emergencyPhone} shortly.`);
        setEmergencyDescription('');
        await fetchSupportTickets();
      } else {
        const errData = await res.json();
        setEmergencyMsg(errData.error || 'Failed to dispatch callback request.');
        setEmergencySuccess(false);
      }
    } catch (err) {
      console.error('Failed to submit emergency ticket:', err);
      setEmergencyMsg('Network failure when dispatching emergency callback request.');
      setEmergencySuccess(false);
    } finally {
      setSubmittingEmergency(false);
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

  const handleShopBannerFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSettingsMsg('Please upload a valid image file for the banner (PNG, JPG, WEBP).');
      setSettingsSuccess(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressBase64Image(reader.result, 1000, 400, 0.655);
        setBanner(compressed);
        setSettingsMsg('');
      }
    };
    reader.onerror = () => {
      setSettingsMsg('Failed to process uploaded banner image.');
      setSettingsSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleShopBannerFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSaveSettings initiated...");
    if (!selectedVendor) {
      console.warn("handleSaveSettings: No selected vendor profile found to update.");
      return;
    }
    setSettingsMsg('');
    setIsSavingSettings(true);

    const repName = (representativeName || '').trim();
    if (!repName) {
      setSettingsSuccess(false);
      setSettingsMsg('Store Owner / Representative name is required.');
      console.warn("handleSaveSettings validation failed: representativeName is empty.");
      setIsSavingSettings(false);
      return;
    }

    let finalLogo = (logo || '').trim();
    if (!finalLogo) {
      if (selectedVendor.vendorName) {
        finalLogo = selectedVendor.vendorName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
      }
      if (!finalLogo) {
        finalLogo = 'SH';
      }
    }

    try {
      console.log("Saving settings to server for vendor ID:", selectedVendor.id, {
        zaadNumber,
        edahabNumber,
        representativeName: repName,
        banner,
        logo: finalLogo,
        isClosed,
        description: vendorDescription
      });
      const res = await fetch(`/api/vendors/${selectedVendor.id}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaadNumber: zaadNumber || '',
          edahabNumber: edahabNumber || '',
          representativeName: repName,
          banner: banner || '',
          logo: finalLogo,
          isClosed: !!isClosed,
          description: vendorDescription || ''
        })
      });
      console.log("Credentials save response code:", res.status);
      const data = await res.json();
      console.log("Credentials save response data:", data);
      if (res.ok) {
        setSettingsSuccess(true);
        setSettingsMsg('Store settings and branding details saved successfully!');
        setSelectedVendor(data);
        setVendors(prev => prev.map(v => v.id === data.id ? data : v));
        // Reset local form states to match returned data
        setLogo(data.logo || '');
        setRepresentativeName(data.representativeName || '');
        if (onVendorUpdated) {
          onVendorUpdated();
        }
        setTimeout(() => setSettingsMsg(''), 4500);
      } else {
        setSettingsSuccess(false);
        setSettingsMsg(data.error || 'Failed to update credentials');
      }
    } catch (err) {
      console.error("Error saving store credentials:", err);
      setSettingsSuccess(false);
      setSettingsMsg('Connection error updating credentials');
    } finally {
      setIsSavingSettings(false);
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
        body: JSON.stringify({ status, note, vendorId: selectedVendor?.id })
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
        const isSuper = userRole === 'superadmin' || userRole === 'admin';
        const matchingVendors = isSuper
          ? vData
          : vData.filter(
              (v: Vendor) => 
                (v.email && v.email.toLowerCase() === userEmail.toLowerCase()) ||
                (v.subUsers && v.subUsers.some((su: any) => su.email && su.email.toLowerCase() === userEmail.toLowerCase()))
            );
        setVendors(matchingVendors);

        const newlyCreated = matchingVendors.find((item: Vendor) => item.email.toLowerCase() === payload.email.toLowerCase());
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
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressBase64Image(reader.result, 1000, 400, 0.655);
        setCampImage(compressed);
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
      subcategory: subcategory || 'General',
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
        setSubcategory('');
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
    setSubcategory(p.subcategory || '');
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
    setActiveTab('catalog_add');
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setTitle('');
    setPrice('');
    setCategory('Electronics');
    setSubcategory('');
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
    setActiveTab('catalog_list');
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
              Your logged-in Seller representative account <span className="font-mono bg-white font-bold px-1.5 py-0.5 rounded border border-amber-200 text-slate-800">{userEmail}</span> has been authenticated, but there is no active storefront mapped to this Email address inside the platform seller's database.
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
              Submit your corporate and representative credentials to request secondary vendor directory catalog privileges on SuuqHub (Smart Market Place). Accounts will require manual administrative authorization by the platform Superadmin backoffice.
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
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
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
            {vendors.length > 1 ? (
              <div className="relative inline-block">
                <select
                  value={selectedVendor?.id || ''}
                  onChange={(e) => handleSelectVendor(e.target.value)}
                  className="appearance-none font-bold text-indigo-950 bg-white border border-slate-205 pl-9 pr-9 py-2 rounded shadow-xs font-sans text-xs focus:outline-none focus:ring-1 focus:ring-indigo-650 cursor-pointer flex items-center h-9"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 animate-pulse" />
                </div>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ) : (
              <span className="text-sm font-bold text-indigo-950 bg-white border border-slate-200 px-3 py-2 rounded shadow-xs flex items-center gap-1.5 font-sans">
                <ShieldCheck className="w-4 h-4 text-indigo-600 animate-pulse" /> {selectedVendor?.vendorName}
              </span>
            )}
            
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
            Submit your corporate and representative credentials to request secondary vendor directory catalog privileges on SuuqHub (Smart Market Place). Accounts will require manual administrative authorization by the platform Superadmin backoffice.
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
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-8 max-h-[85vh] overflow-y-auto pr-1">
          
          {/* Main vertical folder-based sidebar navigator */}
          <div className="bg-emerald-950 border border-emerald-900 rounded-2xl p-4 space-y-4 text-emerald-100/95 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500/70 block tracking-widest font-mono">SuuqHub Merchant</span>
              <p className="text-[11px] font-sans font-bold text-white mt-1 truncate">{selectedVendor ? selectedVendor.vendorName : "Outlet Portal"}</p>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                {
                  title: 'Overview',
                  key: 'overview',
                  items: [
                    { id: 'dashboard', label: 'Dashboard', icon: Sliders },
                    { id: 'pos', label: 'POS System (Cashier)', icon: CreditCard }
                  ]
                },
                {
                  title: 'Product Management',
                  key: 'products',
                  items: [
                    { id: 'catalog_list', label: 'Product List', icon: Package },
                    { id: 'catalog_add', label: 'Add New Product', icon: PlusCircle },
                    { id: 'catalog_approved', label: 'Approved Products', icon: CheckCircle2 },
                    { id: 'catalog_denied', label: 'Denied Products', icon: AlertCircle },
                    { id: 'catalog_gallery', label: 'Product Gallery', icon: Image },
                    { id: 'catalog_stock', label: 'Limited Stocks', icon: AlertCircle, count: products.filter(p => !p.stock || Number(p.stock) < 10).length },
                    { id: 'catalog_import', label: 'Bulk Import', icon: Upload },
                    { id: 'catalog_reviews', label: 'Product Reviews', icon: Sparkles }
                  ]
                },
                {
                  title: 'Order Management',
                  key: 'orders',
                  items: [
                    { id: 'orders_all', label: 'All Orders', icon: ShoppingBag, count: orders.length },
                    { id: 'orders_pending', label: 'Pending Orders', icon: Clock, count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'pending').length },
                    { id: 'orders_confirmed', label: 'Confirmed Orders', icon: ShieldCheck, count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'confirmed').length },
                    { id: 'orders_packaging', label: 'Packaging Orders', icon: Package, count: orders.filter(o => { const s = (o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status; return s === 'processing' || s === 'packaging'; }).length },
                    { id: 'orders_delivery', label: 'Out For Delivery', icon: Truck, count: orders.filter(o => { const s = (o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status; return s === 'shipped' || s === 'out-for-delivery' || s === 'out_for_delivery'; }).length },
                    { id: 'orders_delivered', label: 'Delivered Orders', icon: Check, count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'delivered').length },
                    { id: 'orders_returned', label: 'Returned', icon: ArrowRight, count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'returned').length },
                    { id: 'orders_failed', label: 'Failed to Deliver', icon: AlertCircle, count: orders.filter(o => { const s = (o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status; return s === 'failed' || s === 'failed_to_deliver'; }).length },
                    { id: 'orders_canceled', label: 'Canceled', icon: X, count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'canceled').length }
                  ]
                },
                {
                  title: 'Promotion Management',
                  key: 'promotions',
                  items: [
                    { id: 'promotions_coupons', label: 'Coupon Vouchers', icon: Tag, count: coupons.filter(c => c.vendorId === selectedVendor?.id).length },
                    { id: 'promotions_clearance', label: 'Clearance Sales', icon: Percent }
                  ]
                },
                {
                  title: 'Marketing',
                  key: 'marketing',
                  items: [
                    { id: 'marketing_campaigns', label: 'Showcase Campaigns', icon: Sparkles }
                  ]
                },
                {
                  title: 'Reports & Analytics',
                  key: 'reports',
                  items: [
                    { id: 'reports_transactions', label: 'Transaction Report', icon: FileText },
                    { id: 'reports_products', label: 'Product Report', icon: BarChart2 },
                    { id: 'reports_orders', label: 'Order Report', icon: ShoppingBag },
                    { id: 'reports_vat', label: 'VAT Report', icon: FileText }
                  ]
                },
                {
                  title: 'People',
                  key: 'people',
                  items: [
                    { id: 'people_customers', label: 'Customers List', icon: Users },
                    { id: 'people_add', label: 'Add New Custom', icon: PlusCircle },
                    { id: 'people_delivery', label: 'Delivery Staff', icon: Truck },
                    { id: 'people_emergency', label: 'Emergency Help', icon: User }
                  ]
                },
                {
                  title: 'Settings',
                  key: 'settings',
                  items: [
                    { id: 'settings_shop', label: 'Shop Settings', icon: Sliders },
                    { id: 'settings_shipping', label: 'Shipping Methods', icon: Truck }
                  ]
                }
              ].map((section) => {
                // If user is order manager, they only manage orders
                if (userRole === 'order_manager' && section.key !== 'orders') {
                  return null;
                }
                const isSectionExpanded = expandedSections[section.key] !== false;
                return (
                  <div key={section.key} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setExpandedSections(prev => ({ ...prev, [section.key]: !isSectionExpanded }))}
                      className="cursor-pointer w-full flex items-center justify-between text-left text-[10px] font-black uppercase tracking-wider text-emerald-500/80 py-1 hover:text-white transition"
                    >
                      <span>{section.title}</span>
                      {isSectionExpanded ? <ChevronDown className="w-3 h-3 text-emerald-600" /> : <ChevronRight className="w-3 h-3 text-emerald-600" />}
                    </button>
                    
                    {isSectionExpanded && (
                      <div className="space-y-0.5 pl-1.5 border-l border-emerald-900/60 animate-in fade-in slide-in-from-left-1 duration-150">
                        {section.items.map((subItem) => {
                          const isActive = activeTab === subItem.id || 
                                           (subItem.id === 'catalog_list' && activeTab === 'products') || 
                                           (subItem.id === 'orders_all' && activeTab === 'orders') ||
                                           (subItem.id === 'promotions_coupons' && activeTab === 'coupons') ||
                                           (subItem.id === 'marketing_campaigns' && activeTab === 'campaigns') ||
                                           (subItem.id === 'settings_shop' && activeTab === 'settings');

                          const IconCmp = subItem.icon;
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => {
                                // Side effects or mappings
                                setActiveTab(subItem.id);
                                if (subItem.id.startsWith('orders_')) {
                                  const filter = subItem.id.replace('orders_', '');
                                  setActiveStatusFilter(filter);
                                }
                              }}
                              className={`cursor-pointer w-full text-left px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center justify-between ${isActive ? 'bg-emerald-800 text-white font-bold' : 'text-emerald-300/80 hover:bg-emerald-900/60 hover:text-white'}`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <IconCmp className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-605 text-emerald-500/70'}`} />
                                <span className="truncate">{subItem.label}</span>
                              </div>
                              {subItem.count !== undefined && subItem.count > 0 && (
                                <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold ${isActive ? 'bg-white text-emerald-900' : 'bg-emerald-900 text-emerald-300'}`}>
                                  {subItem.count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Merchant Status box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isSelectedApproved ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider font-mono">Storefront Status</span>
            </div>
            <p className="text-[11px] text-slate-555 leading-relaxed">
              Mapped under brand identifier: <span className="font-bold text-slate-700 font-mono block mt-0.5 break-all leading-normal text-[10px]">{selectedVendor?.id}</span>
            </p>
          </div>

        </div>

        {/* Right column: Main Workspace */}
        <div className="lg:col-span-9 space-y-6">

          {/* WORKSPACE COMPONENT CONTROLLER */}
          
          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-left animate-in fade-in duration-200">
              
              {/* Header block with statistics */}
              <div className="bg-white p-6 rounded-2xl border border-slate-205 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black font-sans text-slate-900 tracking-tight flex items-center gap-2">
                    Welcome Back, <span className="text-indigo-600">{representativeName || selectedVendor?.representativeName || "James Dawson"}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Monitor your multi-vendor storefront statistics, active wallet ledger, and client sales intake.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-md border text-center">
                    Agent: Active Session
                  </span>
                </div>
              </div>

              {/* Core Dynamic Stats Panels */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
                  <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Acting brand</span>
                  <span className="text-sm font-sans font-black text-slate-900 mt-1 truncate block" title={selectedVendor ? selectedVendor.vendorName : 'N/A'}>
                    {selectedVendor ? selectedVendor.vendorName : 'N/A'}
                  </span>
                  <span className="text-[9.5px] text-indigo-500 mt-1 leading-none font-mono font-bold uppercase">Active storefront</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
                  <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Wallet Ledger</span>
                  <span className="text-sm font-sans font-black text-emerald-700 mt-1">
                    ${(selectedVendor?.earnings || 10081.50).toLocaleString()} USD
                  </span>
                  <span className="text-[9.5px] text-emerald-600 font-medium mt-1 leading-none">Withdrawable balance</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
                  <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Approved listings</span>
                  <span className="text-sm font-sans font-black text-slate-900 mt-1">
                    {products.filter(p=>p.isApproved).length} Products
                  </span>
                  <span className="text-[9.5px] text-slate-500 mt-1 leading-none">Approved catalog items</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs text-left">
                  <span className="text-[9.5px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Intake Volume</span>
                  <span className="text-sm font-sans font-black text-indigo-700 mt-1">
                    {orders.length} Placed
                  </span>
                  <span className="text-[9.5px] text-xs text-indigo-600 mt-1 leading-none font-mono font-bold">Ordered commissions</span>
                </div>
              </div>

              {/* Business Analytics 4x2 grid of small metrics (0:13) */}
              <div className="bg-white rounded-2xl border border-slate-205 p-5 space-y-4 shadow-3xs">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-650" /> Business Analytics
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Overall order stage statistics</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Pending', count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'pending').length || 3, bg: 'bg-amber-50', hoverBorder: 'hover:border-amber-400', textColor: 'text-amber-700' },
                    { label: 'Confirmed', count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'confirmed').length || 4, bg: 'bg-blue-50', hoverBorder: 'hover:border-blue-400', textColor: 'text-blue-700' },
                    { label: 'Packaging', count: orders.filter(o => { const s = (o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status; return s === 'processing' || s === 'packaging'; }).length || 1, bg: 'bg-indigo-50', hoverBorder: 'hover:border-indigo-400', textColor: 'text-indigo-700' },
                    { label: 'Out for Delivery', count: orders.filter(o => { const s = (o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status; return s === 'shipped' || s === 'out-for-delivery' || s === 'out_for_delivery'; }).length || 1, bg: 'bg-purple-50', hoverBorder: 'hover:border-purple-400', textColor: 'text-purple-700' },
                    { label: 'Delivered', count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'delivered').length || 11, bg: 'bg-emerald-50', hoverBorder: 'hover:border-emerald-400', textColor: 'text-emerald-700' },
                    { label: 'Canceled', count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'canceled').length || 1, bg: 'bg-rose-50', hoverBorder: 'hover:border-rose-400', textColor: 'text-rose-700' },
                    { label: 'Returned', count: orders.filter(o => ((o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status) === 'returned').length || 1, bg: 'bg-slate-50', hoverBorder: 'hover:border-slate-400', textColor: 'text-slate-700' },
                    { label: 'Failed to Deliver', count: orders.filter(o => { const s = (o.vendorStatuses && selectedVendor && o.vendorStatuses[selectedVendor.id]) || o.status; return s === 'failed' || s === 'failed_to_deliver'; }).length || 2, bg: 'bg-red-50', hoverBorder: 'hover:border-red-400', textColor: 'text-red-700' }
                  ].map((metric, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border border-slate-100 ${metric.bg} ${metric.hoverBorder} transition-all duration-200 hover:shadow-xs flex flex-col justify-between text-left`}>
                      <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wide">{metric.label}</span>
                      <span className={`text-2xl font-black font-sans mt-2 ${metric.textColor}`}>{metric.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor Wallet Card and Statistics Row (0:13) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Card: Gradient balance wallet */}
                <div className="lg:col-span-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <CreditCard className="w-32 h-32 transform rotate-12" />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest font-black text-emerald-200 uppercase">Vendor Wallet balance</span>
                    <h3 className="text-3xl font-black font-sans tracking-tight pt-1">
                      ${(selectedVendor?.earnings || 10081.50).toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-emerald-150 font-mono pt-0.5">Avail. for payout request</p>
                  </div>
                  
                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawAmount(String(selectedVendor?.earnings || 10081.50));
                        setWithdrawNumber(selectedVendor?.zaadNumber || "063466113");
                        setWithdrawMsg("");
                        setWithdrawIsSuccess(false);
                        setShowWithdrawModal(true);
                      }}
                      className="cursor-pointer w-full text-center py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 rotate-180" /> Withdraw balance
                    </button>
                  </div>
                </div>

                {/* Right grid: balance metrics breakdown (0:13) */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Pending Withdraw', value: `$${pendingWithdrawAmount}.00`, desc: 'Processing outbounds', icon: Clock, iconColor: 'text-amber-500' },
                    { label: 'Already Withdrawn', value: `$${alreadyWithdrawnAmount}.00`, desc: 'Direct paid remittances', icon: CheckCircle2, iconColor: 'text-emerald-500' },
                    { label: 'Total Commercial / Sales', value: '$6,401.97', desc: 'Gross directory value', icon: DollarSign, iconColor: 'text-blue-500' },
                    { label: 'Total Delivery Charge', value: '$822.00', desc: 'Slight markup credits', icon: Truck, iconColor: 'text-purple-500' },
                    { label: 'Monthly Earning', value: '$2,534.50', desc: 'Calculated calendar yield', icon: Calendar, iconColor: 'text-teal-500' },
                    { label: 'Total Earning / Payouts', value: '$25,756.80', desc: 'Cumulative store income', icon: ShieldCheck, iconColor: 'text-indigo-500' }
                  ].map((walletItem, idx) => {
                    const IconObj = walletItem.icon;
                    return (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-205 p-4.5 flex flex-col justify-between text-left shadow-3xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider leading-none">{walletItem.label}</span>
                          <IconObj className={`w-4 h-4 ${walletItem.iconColor}`} />
                        </div>
                        <div className="mt-2.5">
                          <span className="text-lg font-black font-sans text-slate-800 block leading-tight">{walletItem.value}</span>
                          <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5">{walletItem.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Earning Statistics Chart block inside Dashboard */}
              <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 shadow-3xs text-left">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Earning Statistics</h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">Analytic timeline representation of daily sales commissions</p>
                </div>
                
                {/* SVG Visual line chart rendering */}
                <div className="h-44 w-full bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex-1 w-full relative flex items-end justify-between px-4 pb-2 border-b border-slate-200">
                    {/* Background helper lines */}
                    <div className="absolute inset-x-0 top-1/4 border-t border-slate-100 font-mono text-[8px] text-slate-350 select-none">$10,000</div>
                    <div className="absolute inset-x-0 top-2/4 border-t border-slate-100 font-mono text-[8px] text-slate-350 select-none">$5,000</div>
                    <div className="absolute inset-x-0 top-3/4 border-t border-slate-100 font-mono text-[8px] text-slate-350 select-none">$1,000</div>

                    {/* Chart line trace via SVG */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <polyline
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        points="5,80 20,65 35,45 50,75 65,30 80,48 95,15"
                      />
                      <path
                        fill="rgba(79, 70, 229, 0.04)"
                        d="M5,80 L20,65 L35,45 L50,75 L65,30 L80,48 L95,15 L95,100 L5,100 Z"
                      />
                    </svg>

                    {/* Interactive points & hover indicators */}
                    {[
                      { l: 'Mon', h: '20%' }, { l: 'Tue', h: '35%' }, { l: 'Wed', h: '55%' },
                      { l: 'Thu', h: '25%' }, { l: 'Fri', h: '70%' }, { l: 'Sat', h: '52%' }, { l: 'Sun', h: '85%' }
                    ].map((pt, i) => (
                      <div key={i} className="flex flex-col items-center z-10 group relative" style={{ height: pt.h }}>
                        {/* Hover Tooltip card */}
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[9px] font-mono font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          Sales: ${(i * 1250 + 1300).toLocaleString()}
                        </div>
                        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-3xs cursor-pointer group-hover:scale-130 transition-transform" />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold px-4 pt-1">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row Tables: Top Selling Products & Popular Listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white rounded-2xl border border-slate-205 p-5 shadow-3xs text-left">
                  <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Top Selling Products</h3>
                    <span className="text-[9.5px] text-indigo-650 font-bold font-mono">Bestsellers list</span>
                  </div>
                  
                  <div className="divide-y divide-slate-100 mt-2">
                    {products.slice(0, 4).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} className="w-10 h-10 object-cover rounded-md border border-slate-100" alt="" />
                          <div className="text-left">
                            <span className="text-xs font-bold text-slate-800 block line-clamp-1">{p.title}</span>
                            <span className="text-[9px] font-mono text-slate-400">SKU: {p.sku || `SKU-${p.id}`}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-sans font-black text-slate-900 block">${p.price}</span>
                          <span className="text-[10px] font-mono text-emerald-600">{20 - idx * 4} sales transacted</span>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-405 italic">No bestselling stats registered.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-205 p-5 shadow-3xs text-left">
                  <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Most Popular Products</h3>
                    <span className="text-[9.5px] text-teal-605 font-bold font-mono">Popularity ranking</span>
                  </div>
                  
                  <div className="divide-y divide-slate-100 mt-2">
                    {products.slice().reverse().slice(0, 4).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} className="w-10 h-10 object-cover rounded-md border border-slate-100" alt="" />
                          <div className="text-left">
                            <span className="text-xs font-bold text-slate-800 block line-clamp-1">{p.title}</span>
                            <span className="text-[9.5px] text-slate-400 font-mono">{p.category}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-slate-500 font-bold text-[10.5px]">
                          Rating: <span className="text-amber-500 font-black">★ {5.0 - (idx * 0.2)}</span>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-405 italic">No catalog listings matching.</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}


          {/* 2. POINT OF SALE VIEW (0:00 - 0:12) */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left animate-in fade-in duration-200">
              
              {/* Left Column: Product Selection Grid (Span 7) */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-205 p-5 space-y-4">
                
                {/* Search and Categories select */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-4 border-slate-100">
                  <div className="relative w-full sm:w-1/2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search barcode or item name..."
                      value={posSearchQuery}
                      onChange={(e) => setPosSearchQuery(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-205 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {['all', 'physical', 'digital'].map((ptype) => (
                      <button
                        key={ptype}
                        onClick={() => setPosCategoryFilter(ptype as any)}
                        className={`px-3 py-2 text-[10.5px] font-bold uppercase rounded-lg transition cursor-pointer font-mono ${posCategoryFilter === ptype ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'}`}
                      >
                        {ptype} Products
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategory selectors scroll list */}
                <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                  <button
                    onClick={() => setPosSelectedCategory('all')}
                    className={`px-3.5 py-1.5 rounded-full text-[10.5px] font-semibold border whitespace-nowrap cursor-pointer transition ${posSelectedCategory === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                  >
                    All Categories
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPosSelectedCategory(cat)}
                      className={`px-3 py-1 text-[10.5px] font-semibold border rounded-full whitespace-nowrap cursor-pointer transition ${posSelectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-605 hover:bg-slate-50 border-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {products
                    .filter(p => p.isApproved)
                    .filter(p => {
                      if (posCategoryFilter === 'physical' && p.category === 'Digital') return false;
                      if (posCategoryFilter === 'digital' && p.category !== 'Digital' && p.category !== 'Beauty' && p.category !== 'SaaS') {
                        // Let's assume Digital is labeled under category "Digital"
                      }
                      if (posSelectedCategory !== 'all' && p.category !== posSelectedCategory) return false;
                      if (posSearchQuery.trim()) {
                        const q = posSearchQuery.toLowerCase();
                        return p.title.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
                      }
                      return true;
                    })
                    .map((p) => {
                      const isAddingThis = posAddingStatus === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            // Add item to cart
                            setPosAddingStatus(p.id);
                            setTimeout(() => setPosAddingStatus(''), 250);
                            
                            const existing = posCart.find(ci => ci.product.id === p.id);
                            if (existing) {
                              setPosCart(posCart.map(ci => ci.product.id === p.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
                            } else {
                              setPosCart([...posCart, { product: p, quantity: 1 }]);
                            }
                          }}
                          className={`bg-white rounded-xl border border-slate-205 p-3 flex flex-col justify-between text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xs select-none ${isAddingThis ? 'ring-2 ring-indigo-500 scale-95' : 'hover:border-indigo-200 bg-slate-50/10'}`}
                        >
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-150 bg-white">
                            <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                            <span className="absolute bottom-1 right-1 font-mono text-[9px] font-bold bg-slate-905 bg-slate-900 text-white px-2 py-0.5 rounded-sm">
                              Qty: {p.stock}
                            </span>
                          </div>
                          <div className="mt-2.5 space-y-1">
                            <span className="text-[10px] text-slate-400 font-mono block tracking-wide">{p.category}</span>
                            <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 h-8 font-sans">{p.title}</h4>
                            <div className="flex items-center justify-between pt-1">
                              <span className="font-sans font-black text-xs text-indigo-700">${p.price}</span>
                              <span className="text-[8px] font-mono font-semibold bg-indigo-50 text-indigo-650 px-1.5 py-0.2 rounded uppercase">Select</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {products.filter(p => p.isApproved).length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 italic text-xs font-mono">
                      Please register and support approved products in catalogue first to utilize cash register cashier POS.
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Billing Section / Cash Register Cart (Span 5) */}
              <div className="xl:col-span-5 bg-slate-50 border border-slate-205 rounded-2xl p-4 space-y-4">
                
                <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                  <h3 className="text-sm font-sans font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-700" /> Billing Section
                  </h3>
                  <button
                    onClick={() => setPosCart([])}
                    className="text-[9.5px] font-mono font-bold text-rose-600 hover:underline uppercase cursor-pointer"
                  >
                    Clear Cart List
                  </button>
                </div>

                {/* Walk-in Customer drop down */}
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Walk-In Customer Context</label>
                  <select className="w-full text-xs font-sans bg-white border border-slate-205 rounded-lg px-3 py-2 bg-no-repeat cursor-pointer text-slate-755 focus:outline-none">
                    <option>Generic Walk-In Customer</option>
                    {mockCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                {/* Cart list */}
                <div className="bg-white border border-slate-200 rounded-xl max-h-[170px] overflow-y-auto p-2">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block pb-1 border-b mb-1">Cart Item List ({posCart.length})</span>
                  
                  {posCart.map((cartItem, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-b-0 border-slate-100 text-left">
                      <div className="flex items-center gap-2 truncate flex-1 pr-2">
                        <img src={cartItem.product.image} className="w-8 h-8 rounded object-cover border border-slate-105" alt="" />
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-800 block line-clamp-1 truncate leading-tight">{cartItem.product.title}</span>
                          <span className="text-[10px] font-mono text-indigo-500 font-semibold">${cartItem.product.price}</span>
                        </div>
                      </div>
                      
                      {/* Increment / Decrement actions */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 scale-90">
                          <button
                            onClick={() => {
                              if (cartItem.quantity <= 1) {
                                setPosCart(posCart.filter(ci => ci.product.id !== cartItem.product.id));
                              } else {
                                setPosCart(posCart.map(ci => ci.product.id === cartItem.product.id ? { ...ci, quantity: ci.quantity - 1 } : ci));
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-md text-[11px]"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-black text-slate-700 px-1.5">{cartItem.quantity}</span>
                          <button
                            onClick={() => {
                              setPosCart(posCart.map(ci => ci.product.id === cartItem.product.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
                            }}
                            className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-md text-[11px]"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => setPosCart(posCart.filter(ci => ci.product.id !== cartItem.product.id))}
                          className="text-rose-500 hover:text-rose-700 font-bold px-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {posCart.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 italic">No products added in POS register yet. Click any items on left directory list.</div>
                  )}
                </div>

                {/* Billing Summary Calculations (0:01) */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5 font-mono text-xs shadow-3xs text-left">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block pb-1 border-b">Billing Summary</span>
                  
                  {(() => {
                    const subtotal = posCart.reduce((s, k) => s + (k.product.price * k.quantity), 0);
                    // 10% discount dynamic offset
                    const itemDiscount = subtotal * 0.10; 
                    
                    // Coupon deduction
                    let couponDeduct = 0;
                    if (posSelectedCoupon) {
                      if (posSelectedCoupon.discountType === 'percentage') {
                        couponDeduct = (subtotal * posSelectedCoupon.value) / 100;
                      } else {
                        couponDeduct = posSelectedCoupon.value;
                      }
                    }

                    // Extra manual discount
                    const manualDeduct = Number(posExtraDiscount) || 0;
                    const tax = Math.max(0, subtotal - itemDiscount - couponDeduct - manualDeduct) * 0.15; // 15% VAT Somali rate
                    const totalCost = Math.max(0, subtotal - itemDiscount - couponDeduct - manualDeduct + tax);

                    // Change calculator
                    const paid = Number(posPaidAmount) || 0;
                    const changeVal = paid > totalCost ? paid - totalCost : 0;

                    return (
                      <div className="space-y-1 text-slate-600 text-[11.5px]">
                        <div className="flex justify-between">
                          <span>Sub Total:</span>
                          <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Product Discount (10%):</span>
                          <span>-${itemDiscount.toFixed(2)}</span>
                        </div>
                        
                        {/* Coupon selection dropdown */}
                        <div className="flex items-center justify-between pb-1 pt-1 border-t border-slate-50">
                          <span className="text-[10px] text-slate-400 uppercase">Coupon Voucher:</span>
                          <select
                            onChange={(e) => {
                              const found = coupons.find(cp => cp.code === e.target.value);
                              setPosSelectedCoupon(found || null);
                            }}
                            className="bg-slate-50 text-[10px] font-semibold border rounded px-2 py-0.5 text-slate-700 cursor-pointer focus:outline-none"
                          >
                            <option value="">No Coupon</option>
                            {coupons.filter(c => c.vendorId === selectedVendor?.id).map(cp => (
                              <option key={cp.id} value={cp.code}>{cp.code} ({cp.value}{cp.discountType === 'percentage' ? '%' : '$'} OFF)</option>
                            ))}
                          </select>
                        </div>
                        {couponDeduct > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Coupon Deduction ({posSelectedCoupon?.code}):</span>
                            <span>-${couponDeduct.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Extra manual discount textbox */}
                        <div className="flex items-center justify-between pb-1 border-t border-slate-50">
                          <span className="text-[10px] text-slate-450 uppercase">Extra Discount ($):</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={posExtraDiscount}
                            onChange={(e) => setPosExtraDiscount(e.target.value)}
                            className="w-16 bg-slate-50 border text-slate-800 font-bold border-slate-200 text-right px-1 py-0.5 text-[10px] focus:outline-none rounded"
                          />
                        </div>

                        <div className="flex justify-between">
                          <span>VAT/Tax (15%):</span>
                          <span>+${tax.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-slate-800 font-extrabold text-xs pt-1.5 border-t border-dashed">
                          <span>TOTAL:</span>
                          <span className="font-sans text-sm font-black text-indigo-700">${totalCost.toFixed(2)}</span>
                        </div>

                        {/* Paid By Selection (0:01) */}
                        <div className="space-y-1.5 pt-2 border-t">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Paid Type</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPosPaidBy('cash');
                                setPosPaidAmount(String(Math.ceil(totalCost)));
                              }}
                              className={`py-1.5 border text-center font-bold text-[10.5px] uppercase rounded-xl transition cursor-pointer ${posPaidBy === 'cash' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}
                            >
                              Cash Match
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPosPaidBy('card');
                                setPosPaidAmount(String(totalCost.toFixed(2)));
                              }}
                              className={`py-1.5 border text-center font-bold text-[10.5px] uppercase rounded-xl transition cursor-pointer ${posPaidBy === 'card' ? 'bg-indigo-650 text-white border-indigo-600' : 'bg-slate-100 text-slate-705 hover:bg-slate-200 border-slate-200'}`}
                            >
                              Card Paid
                            </button>
                          </div>
                        </div>

                        {/* Paid Amount Text Input (0:01) */}
                        <div className="grid grid-cols-2 gap-3 items-center pt-2">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-420 uppercase">Paid Amount ($)</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={posPaidAmount}
                              onChange={(e) => setPosPaidAmount(e.target.value)}
                              className="w-full bg-white border border-slate-205 py-1.5 px-2 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 rounded-lg text-right text-xs"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-420 uppercase text-right">Change Amount</span>
                            <span className="block font-sans font-black text-slate-800 text-right text-[15px] pt-1.5">
                              ${changeVal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Placement Dispatcher */}
                        <div className="pt-3">
                          <button
                            type="button"
                            disabled={posCart.length === 0}
                            onClick={async () => {
                              try {
                                if (posCart.length === 0) return;
                                const receiptPayload = {
                                  id: `pos-${Date.now().toString().substring(7)}`,
                                  items: posCart,
                                  subtotal,
                                  discount: itemDiscount + couponDeduct + manualDeduct,
                                  tax,
                                  total: totalCost,
                                  paidAmount: paid || totalCost,
                                  changeAmount: changeVal,
                                  paidBy: posPaidBy,
                                  cashier: representativeName || "Sarah Representative",
                                  date: new Date().toLocaleString()
                                };
                                setPosSuccessInvoice(receiptPayload);
                                setOrders(prev => [{
                                  id: receiptPayload.id,
                                  customerId: "pos-walkin-client",
                                  customerName: "Walk In Purchaser",
                                  customerEmail: "walkin@hubaal.so",
                                  items: posCart.map(ci => ({
                                    productId: ci.product.id,
                                    title: ci.product.title,
                                    price: ci.product.price,
                                    quantity: ci.quantity
                                  })),
                                  subtotal,
                                  tax,
                                  shippingCost: 0,
                                  discount: itemDiscount + couponDeduct + manualDeduct,
                                  total: totalCost,
                                  status: 'delivered',
                                  deliveryMethod: 'pickup',
                                  createdAt: new Date().toISOString()
                                } as any, ...prev]);
                                
                                setPosCart([]);
                                setPosPaidAmount('');
                                setPosExtraDiscount('0');
                                setPosSelectedCoupon(null);
                              } catch (err) {
                                console.error("Error creating POS receipt:", err);
                              }
                            }}
                            className="w-full text-center py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs active:scale-97 disabled:opacity-55 disabled:pointer-events-none cursor-pointer"
                          >
                            Place POS Order & Receipt
                          </button>
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          )}


          {/* 3. CATALOG LIST VIEW */}
          {activeTab === 'catalog_list' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div className="border-b pb-4 block sm:flex sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">My Catalog Listings</h2>
                  <p className="text-[11.5px] text-slate-400 font-sans">List of registered products published from this enterprise storefront.</p>
                </div>
                
                <button
                  onClick={() => setActiveTab('catalog_add')}
                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition shadow-xs"
                >
                  + Add New Product
                </button>
              </div>

              {/* Product Listings Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-3 text-left">Product Detail</th>
                      <th className="p-3 text-left">SKU</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-9 h-9 object-cover rounded border" alt="" />
                            <span className="font-bold text-slate-800 block line-clamp-1">{p.title}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-bold">{p.sku || "N/A"}</td>
                        <td className="p-3 text-slate-455 font-mono">{p.category}</td>
                        <td className="p-3 text-right font-sans font-black text-slate-900">${p.price}</td>
                        <td className="p-3 text-right font-bold text-slate-600">{p.stock} units</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider ${p.isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-amber-50 text-amber-705 border border-amber-150'}`}>
                            {p.isApproved ? 'LIVE' : 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-indigo-650 border rounded font-bold uppercase text-[9.5px] transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="px-2 py-1 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border rounded font-mono font-bold uppercase text-[9.5px] transition cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 italic">No inventory products published by this user storefront.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}


          {/* 4. APPROVED PRODUCT LIST VIEW */}
          {activeTab === 'catalog_approved' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Approved Active Listings</h2>
                <p className="text-[11.5px] text-slate-400 font-sans">Directory items verified and live for global marketplace checkouts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-3 text-left">Product Detail</th>
                      <th className="p-3 text-left">SKU</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-center">Status Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {products.filter(p => p.isApproved).map((p) => (
                      <tr key={p.id}>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-8 h-8 object-cover rounded border" alt="" />
                            <span className="font-bold text-slate-800">{p.title}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{p.sku || "N/A"}</td>
                        <td className="p-3 text-right font-black text-slate-900">${p.price}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">{p.stock} units</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase text-emerald-700 bg-emerald-50 border-emerald-150 border">
                            LIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                    {products.filter(p => p.isApproved).length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 italic">No approved catalog products registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* 5. DENIED PRODUCT LIST VIEW */}
          {activeTab === 'catalog_denied' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono text-amber-705">Denied / Suspended Listings</h2>
                <p className="text-[11.5px] text-slate-450 font-sans">Listed items undergoing platform review or rejected by the core office.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-3 text-left">Product Detail</th>
                      <th className="p-3 text-left">SKU</th>
                      <th className="p-3 text-right font-right">Price</th>
                      <th className="p-3 text-center">Auditing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {products.filter(p => !p.isApproved).map((p) => (
                      <tr key={p.id}>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-8 h-8 object-cover rounded border" alt="" />
                            <span className="font-bold text-slate-700">{p.title}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{p.sku || "N/A"}</td>
                        <td className="p-3 text-right font-black text-slate-700">${p.price}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-150 animate-pulse">
                            AWAITING AUDIT
                          </span>
                        </td>
                      </tr>
                    ))}
                    {products.filter(p => !p.isApproved).length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400 italic">No products currently under review or denied.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* 6. PRODUCT GALLERY VIEW */}
          {activeTab === 'catalog_gallery' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Product Gallery</h3>
                <p className="text-[11.5px] text-slate-400">Media representations of cataloged product collections.</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="relative group rounded-xl overflow-hidden border border-slate-200">
                    <img src={p.image} className="w-full aspect-square object-cover transition duration-300 group-hover:scale-110" alt="" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-2 text-white">
                      <span className="text-[10px] font-bold block truncate">{p.title}</span>
                      <span className="text-[8px] font-mono text-slate-300">${p.price}</span>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 italic">No asset images loaded.</div>
                )}
              </div>
            </div>
          )}


          {/* 7. LIMITED STOCKS AND INVENTORY (0:29) */}
          {activeTab === 'catalog_stock' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-rose-700 uppercase tracking-wider font-mono">Inventory Stock Control</h2>
                <p className="text-[11.5px] text-slate-400">List of catalog items that have critically low stocks levels (below 10 items).</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-3 text-left">Product Detail</th>
                      <th className="p-3 text-right">Current Stock</th>
                      <th className="p-3 text-center">Stock status</th>
                      <th className="p-3 text-center">Add Quick Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {products.map((p) => {
                      const qty = Number(p.stock) || 0;
                      return (
                        <tr key={p.id}>
                          <td className="p-3 font-semibold text-slate-800">{p.title}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">{qty} left</td>
                          <td className="p-3 text-center">
                            {qty < 10 ? (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-150 rounded">
                                critically low
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-150 rounded">
                                normal stock
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                placeholder="+10"
                                className="w-16 bg-slate-50 border text-slate-705 text-right px-2 py-1 rounded"
                                id={`quick-stock-add-${p.id}`}
                              />
                              <button
                                onClick={async () => {
                                  const valInput = (document.getElementById(`quick-stock-add-${p.id}`) as HTMLInputElement)?.value;
                                  const addAmount = Number(valInput || '10');
                                  
                                  const newStock = qty + addAmount;
                                  try {
                                    const res = await fetch(`/api/products/${p.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ ...p, stock: String(newStock) })
                                    });
                                    if (res.ok) {
                                      setProducts(products.map(itm => itm.id === p.id ? { ...itm, stock: String(newStock) } : itm));
                                      (document.getElementById(`quick-stock-add-${p.id}`) as HTMLInputElement).value = '';
                                      alert("Quantity replenished successfully!");
                                    }
                                  } catch (e) {
                                    console.error("Error replenishing inventory stock:", e);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 text-white rounded text-[10px] uppercase font-bold cursor-pointer"
                              >
                                replen
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* 8. BULK IMPORT MOCK (0:29) */}
          {activeTab === 'catalog_import' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">CSV Catalog Bulk Importer</h2>
                <p className="text-[11.5px] text-slate-400">Instantly append hundreds of items to your inventory portfolio.</p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <span className="text-xs font-bold text-slate-700 block">Drag & Drop product inventory spreadsheet (.csv)</span>
                <span className="text-[10px] font-mono text-slate-420 block mt-1">Accepts Excel columns: [title, sku, price, stock, category, image_url]</span>
                <div className="pt-4 flex gap-2 justify-center">
                  <button className="px-4.5 py-2 hover:bg-slate-200 bg-white border font-bold text-[10px] uppercase tracking-wide rounded-md transition cursor-pointer">
                    Download Template
                  </button>
                  <button className="px-4.5 py-2 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wide rounded-md transition cursor-pointer">
                    Upload Spreadsheet
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* 9. PRODUCT REVIEWS SUB-TAB */}
          {activeTab === 'catalog_reviews' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Product Reviews & Client Feedbacks</h3>
                <p className="text-[11.5px] text-slate-400">Direct user rating scores and reviews submitted for storefront assets.</p>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { writer: "Mohamed Rage", score: 5, date: "2026-06-11", product: "Science Fiction Novel Set", text: "Amazing premium edition box! The binding detail is phenomenal and fast Somaliland shipping." },
                  { writer: "Suhur Hersi", score: 4, date: "2026-06-08", product: "Garnier Hair Dye Mask", text: "Very consistent hair tint, does not irritate scalp. Highly recommended to beauty stores." },
                  { writer: "Khadar Ahmed", score: 5, date: "2026-06-04", product: "Kill Code Fictional Drama", text: "An absolute literary masterpiece. Outstanding narrative that keeps you hooked." }
                ].map((rating, idx) => (
                  <div key={idx} className="py-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-bold text-slate-800">{rating.writer}</span>
                      <span className="text-[10px] font-mono text-slate-400">{rating.date}</span>
                    </div>
                    <span className="block text-[10px] font-mono text-indigo-500 font-bold">{rating.product}</span>
                    <div className="flex items-center gap-1.5 py-0.5">
                      {"★".repeat(rating.score).split('').map((s, idx) => (
                        <span key={idx} className="text-amber-550 text-sm">★</span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 leading-normal font-sans italic">"{rating.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* 10. CLEARANCE SPECIAL SALES INCENTIVE */}
          {activeTab === 'promotions_clearance' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-indigo-650 uppercase tracking-wider font-mono flex items-center gap-1.5 animate-pulse">
                  <Percent className="w-4.5 h-4.5" /> Clearance Special sales campaign
                </h2>
                <p className="text-[11.5px] text-slate-400">Set direct temporary discounts across your entire storefront to accelerate stock clearing cycles.</p>
              </div>

              <div className="space-y-4 max-w-md bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                {clearanceMsg && (
                  <div className="p-3 text-xs bg-emerald-50 border border-emerald-150 text-emerald-800 rounded">
                    {clearanceMsg}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Clearance Markdown rate (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={clearanceRate}
                    onChange={(e) => setClearanceRate(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-205 roundedpx-4 py-2.5 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Activate Clearance Rate</span>
                  <input
                    type="checkbox"
                    checked={clearanceActive}
                    onChange={(e) => setClearanceActive(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setClearanceMsg(`Clearance rate of ${clearanceRate}% has been successfully synced store-wide on your approved items!`);
                    setTimeout(() => setClearanceMsg(''), 4500);
                  }}
                  className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wide rounded-lg transition-colors cursor-pointer shadow-3xs"
                >
                  Save Store clearance
                </button>
              </div>
            </div>
          )}


          {/* 11. ADVANCED TRANSACTION REPORTS (0:44) */}
          {activeTab === 'reports_transactions' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div className="border-b pb-4 block sm:flex sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Marketplace Transaction Report</h2>
                  <p className="text-[11.5px] text-slate-420">Overview metrics, customer cash vs wallet flows, and tax summaries.</p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="bg-slate-50 text-[10px] font-semibold border rounded-lg px-3 py-1.5 text-slate-650 cursor-pointer focus:outline-none"
                  >
                    <option value="year">This Calendar Year</option>
                    <option value="month">This Month</option>
                    <option value="today">Today</option>
                  </select>
                </div>
              </div>

              {/* Stats panel nested inside report */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                {[
                  { label: "Total Products", count: "20 items" },
                  { label: "Active Products", count: "19 items" },
                  { label: "Inactive Products", count: "1 item" },
                  { label: "Draft Products", count: "0 items" }
                ].map((cl, idx) => (
                  <div key={idx} className="bg-slate-50 border p-3 rounded-lg text-left">
                    <span className="text-[9px] uppercase font-mono text-slate-400 block">{cl.label}</span>
                    <span className="text-sm font-sans font-black text-slate-900 mt-1 block">{cl.count}</span>
                  </div>
                ))}
              </div>

              {/* Payment Statistics radial/circle details (0:45) */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-250">
                {[
                  { label: "Digital Payments", value: "$53,101.00", color: "text-blue-600" },
                  { label: "Cash On Delivery", value: "$12,121.00", color: "text-emerald-500" },
                  { label: "Wallet Deducted", value: "$3,101.00", color: "text-indigo-650" },
                  { label: "Refunded/Returned", value: "$1,200.00", color: "text-rose-500" }
                ].map((pay, i) => (
                  <div key={i} className="text-left pt-3 md:pt-0 md:pl-4 first:pl-0">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">{pay.label}</span>
                    <span className={`text-base font-black font-sans tracking-tight mt-1 block ${pay.color}`}>{pay.value}</span>
                  </div>
                ))}
              </div>

              {/* Printable Table Grid */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-2.5">SL</th>
                      <th className="p-2.5 text-left">Customer Name</th>
                      <th className="p-2.5 text-left">Product Title</th>
                      <th className="p-2.5 text-right">Product Amount</th>
                      <th className="p-2.5 text-center">Referral/Discount</th>
                      <th className="p-2.5 text-right">Commissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-mono text-slate-655">
                    {[
                      { sl: "01", user: "Khadar Ahmed", prod: "Kill Code Fictional Novel", amt: "$15.00", disc: "$2.00", status: "Paid" },
                      { sl: "02", user: "Suhur Hersi", prod: "Science Fiction Volume", amt: "$30.00", disc: "$0.00", status: "Paid" },
                      { sl: "03", user: "Mohamed Rage", prod: "Garnier Professional Pack", amt: "$25.00", disc: "$3.50", status: "Paid" }
                    ].map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center font-bold">{tx.sl}</td>
                        <td className="p-2.5 font-sans font-bold text-slate-800">{tx.user}</td>
                        <td className="p-2.5 font-sans line-clamp-1">{tx.prod}</td>
                        <td className="p-2.5 text-right font-bold text-slate-700">{tx.amt}</td>
                        <td className="p-2.5 text-center text-rose-600">{tx.disc}</td>
                        <td className="p-2.5 text-right font-black text-indigo-700">$2.50</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* 12. PRODUCT SALES VOLUMES REPORT (0:49) */}
          {activeTab === 'reports_products' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div className="border-b pb-4 block sm:flex sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Bestselling Volumes Graph</h2>
                  <p className="text-[11.5px] text-slate-400">Total units sold, revenue margins, and inventory performance statistics.</p>
                </div>
              </div>

              {/* Visual Performance Stats Bars */}
              <div className="space-y-4 max-w-xl">
                {products.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-405 italic">Add some products to populate sales volume ratios.</p>
                ) : (
                  products.map((p, i) => {
                    const salesWeight = Math.max(15 - i * 3, 2);
                    const pct = (salesWeight / 20) * 100;
                    return (
                      <div key={p.id} className="space-y-1.5 text-xs text-slate-655 font-sans">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-800 line-clamp-1">{p.title}</span>
                          <span className="font-mono text-slate-500 font-bold">{salesWeight} sold (${(salesWeight * p.price).toFixed(2)})</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}


          {/* 13. TIMELINE ORDERS RECRUITMENT REPORTS (0:52) */}
          {activeTab === 'reports_orders' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Store Intake Progressions</h2>
                <p className="text-[11.5px] text-slate-400">Chronological timeline orders status analytics, dispatch delays, and cancellation diagnostics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Completed Success rate", status: "94.5%", color: "text-emerald-600" },
                  { label: "Average Dispatch Turnaround", status: "1.4 Hours", color: "text-indigo-600" },
                  { label: "Cancellation / Return rate", status: "2.1%", color: "text-rose-600" }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50 border p-4 rounded-xl text-left">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">{stat.label}</span>
                    <span className={`text-xl font-sans font-black mt-2 block ${stat.color}`}>{stat.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* 14. INVOICING TAX LEDGER VAT RECORD */}
          {activeTab === 'reports_vat' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Somalia / Somaliland VAT Taxation Ledger</h2>
                <p className="text-[11.5px] text-slate-400">Mandated record log for legal accounting, calculating standard 15% VAT amounts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-3 text-left">Reference Invoice</th>
                      <th className="p-3 text-right">Net Value</th>
                      <th className="p-3 text-right">VAT Rate Applied</th>
                      <th className="p-3 text-right">Total VAT Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono text-slate-655">
                    {orders.slice(0, 5).map((o, idx) => {
                      const net = o.subtotal || 25;
                      const calculatedTax = net * 0.15;
                      return (
                        <tr key={idx}>
                          <td className="p-3">#{o.id.substring(0, 8)}</td>
                          <td className="p-3 text-right">${net.toFixed(2)}</td>
                          <td className="p-3 text-right">15% Somali Standard</td>
                          <td className="p-3 text-right font-bold text-slate-900">+${calculatedTax.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400 italic">No taxation sales transacted yet to compute VAT weights.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* 15. CUSTOMERS LIST FILE (0:54) */}
          {activeTab === 'people_customers' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div className="border-b pb-4 block sm:flex sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Customer Base Directory</h2>
                  <p className="text-[11.5px] text-slate-400">Total list of verified consumers who completed directory checkout cycles on this storefront catalogue.</p>
                </div>
                
                <button
                  onClick={() => setActiveTab('people_add')}
                  className="px-4.5 py-2 hover:bg-slate-200 bg-white border border-slate-200 font-bold text-[10.5px] uppercase tracking-wide rounded-lg transition cursor-pointer shadow-3xs"
                >
                  + Create Customer File
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                      <th className="p-3 text-left">Consumer details</th>
                      <th className="p-3 text-left">Mobile Wallet Contact</th>
                      <th className="p-3 text-right">Total invoices Ordered</th>
                      <th className="p-3 text-right">Total spendings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {mockCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{c.email}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-600">{c.phone}</td>
                        <td className="p-3 text-right font-semibold text-slate-700">{c.ordersCount} sessions</td>
                        <td className="p-3 text-right font-sans font-black text-indigo-700">${c.totalSpend.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* 16. ADD NEW CUSTOMER OUTLET FILE */}
          {activeTab === 'people_add' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Register New Customer File</h2>
                <p className="text-[11.5px] text-slate-400">Create a customer profile to link local cash register POS logs to matching SMS wallet receipts.</p>
              </div>

              <div className="space-y-4 max-w-sm bg-slate-50 border border-slate-200 p-5 rounded-xl">
                {custMsg && (
                  <div className="p-3 text-xs bg-indigo-50 border border-indigo-150 text-indigo-805 rounded animate-bounce">
                    {custMsg}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Abdirahman Yusuf"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full text-xs font-sans bg-white border border-slate-205 rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">Direct Email</label>
                  <input
                    type="email"
                    placeholder="yusuf@somalia.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-205 rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">Telesom Zaad / Edahab mobile (9 digits)</label>
                  <input
                    type="text"
                    placeholder="63XXXXXXX"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-205 rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newCustName || !newCustPhone) {
                      setCustMsg("Please compile name and mobile money contacts!");
                      return;
                    }
                    const newEntry = {
                      id: `cust-${Date.now()}`,
                      name: newCustName,
                      email: newCustEmail || "generic@client.so",
                      phone: newCustPhone,
                      ordersCount: 1,
                      totalSpend: 0
                    };
                    setMockCustomers([...mockCustomers, newEntry]);
                    setNewCustName('');
                    setNewCustEmail('');
                    setNewCustPhone('');
                    setCustMsg("Customer directory context created successfully!");
                    setTimeout(() => {
                      setCustMsg('');
                      setActiveTab('people_customers');
                    }, 1500);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wide rounded transition shadow-3xs"
                >
                  Create Customer record
                </button>
              </div>
            </div>
          )}


          {/* 17. DELIVERY COURIERS MAN LOGISTICS CONTROLS */}
          {activeTab === 'people_delivery' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 space-y-4 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Dispatched Messenger Couriers</h2>
                <p className="text-[11.5px] text-slate-400 font-sans">Available delivery personnel tracked to execute shipment dropsoffs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Mustafe Farhan", vehicle: "TukTuk (SLA-9080)", assigned: 2, status: "Active delivering" },
                  { name: "Guled Warsame", vehicle: "Honda Bike (REG-552)", assigned: 1, status: "In dispatch center" }
                ].map((del, i) => (
                  <div key={i} className="border p-4 rounded-xl flex items-center justify-between bg-slate-50">
                    <div className="text-left">
                      <span className="font-bold text-slate-800 block">{del.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">Vehicle tag: {del.vehicle}</span>
                      <span className="text-[10px] text-indigo-600 font-bold mt-1 block">Assigned packages: {del.assigned}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-mono text-[9px] uppercase font-bold rounded">
                      {del.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* 18. EMERGENCY SUPPORT SYSTEM COMPONENT */}
          {activeTab === 'people_emergency' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
              
              {/* Left Column: Register Callbacks */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-205 p-6 space-y-5 text-left shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                    Emergency Merchant Hotline Registry
                  </h3>
                  <p className="text-[11.5px] text-slate-500 mt-1">
                    Enter your contact phone lines and describe the storefront blockage. SuuqHub operators will trigger an instant voice callback to assist you in real-time.
                  </p>
                </div>

                <form onSubmit={handleSubmitEmergencyHelp} className="space-y-4">
                  {emergencyMsg && (
                    <div className={`p-3.5 rounded-lg text-xs font-mono border ${emergencySuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                      {emergencyMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Callback Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +252 63 4567890 (Zaad/eDahab associated line)"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-205 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sector / Issue Area</label>
                      <select
                        value={emergencyUrgency}
                        onChange={(e) => setEmergencyUrgency(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                      >
                        <option value="CRITICAL_POS_DOWN">POS Outage (Cashier Mode block)</option>
                        <option value="PAYMENT_FAILED">Remittance/Zaad/eDahab API Error</option>
                        <option value="ORDER_DELIVERY_ERR">Order Dispatch System Bug</option>
                        <option value="ACCOUNT_LOCKED">Catalog/Product Suspension</option>
                        <option value="OTHER_SUPPORT">General Emergency Assistance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Storefront</label>
                      <input
                        type="text"
                        disabled
                        value={selectedVendor ? selectedVendor.vendorName : 'None Selected'}
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-100 bg-slate-50 text-slate-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Detailed Emergency Message *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Specify exactly what is broken (e.g., Zaad transaction #33882 does not reconcile, or POS button is non-response...)"
                      value={emergencyDescription}
                      onChange={(e) => setEmergencyDescription(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-205 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingEmergency}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingEmergency ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Callback SOS...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 animate-bounce" /> Register Emergency Callback Request
                      </>
                    )}
                  </button>
                </form>

                {/* Local submitted list */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider mb-3 font-mono">Your Registered Hotline Requests</h4>
                  {supportTicketsList.filter(t => t.subject?.includes("EMERGENCY CALLBACK") && t.userId === selectedVendor?.id).length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed rounded-lg text-center text-[11px] text-slate-400 font-mono">
                      No active callback requests dispatched yet. Submit the form above if you experience technical blockers.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supportTicketsList
                        .filter(t => t.subject?.includes("EMERGENCY CALLBACK") && t.userId === selectedVendor?.id)
                        .map((tkt) => {
                          const statusColors: Record<string, string> = {
                            open: 'bg-rose-50 border-rose-200 text-rose-800',
                            'in-progress': 'bg-amber-50 border-amber-200 text-amber-800',
                            resolved: 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          };
                          return (
                            <div key={tkt.id} className="p-3 border rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-800 font-mono">{tkt.id}</span>
                                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColors[tkt.status] || 'bg-slate-100 text-slate-800'}`}>
                                    {tkt.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">"{tkt.message}"</p>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                <span className="text-[10px] font-mono text-slate-400 block">{new Date(tkt.createdAt).toLocaleTimeString()}</span>
                                <span className="text-[9.5px] font-bold text-rose-600">Operator Calling...</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Information Helpline */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-4 text-left">
                  <div>
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Platform Hotline Hub</h3>
                    <p className="text-[11px] text-slate-405 leading-relaxed mt-1">Our certified systems engineers are located in major hubs for instant client resolution.</p>
                  </div>

                  <div className="space-y-3.5 divide-y divide-slate-800">
                    <div className="pt-0 pb-1 text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-550 block font-mono">Hargeisa HQ Office Support</span>
                      <span className="text-sm font-black text-white font-mono mt-0.5 block tracking-wider">+252 63 4567890</span>
                    </div>
                    <div className="pt-3 text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-550 block font-mono">Mogadishu Liaison Technical Desk</span>
                      <span className="text-sm font-black text-white font-mono mt-0.5 block tracking-wider">+252 61 7891112</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed pt-3.5 italic pr-1">
                      💡 Emergency support lines remain active <b>24/7</b> for approved merchants. Rest assured our core platform ensures 99.9% uptime across Hargeisa and Mogadishu.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl text-left space-y-2.5">
                  <span className="font-bold text-amber-900 text-xs flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-amber-700 font-bold" /> Outage Protocol
                  </span>
                  <p className="text-[11px] text-amber-850 leading-relaxed font-sans">
                    In case of internet outages or external gateway fiber cut-offs, our local POS system will continue to work offline. Simply log sales locally and upload transaction history when line latency returns.
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* 19. SHIPPING METHODS LAYER */}
          {activeTab === 'settings_shipping' && (
            <div className="bg-white rounded-2xl border border-slate-205 p-6 max-w-2xl mx-auto space-y-6 text-left animate-in fade-in duration-200" id="unified-logistics-model">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                  <Truck className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">Unified Logistics Infrastructure</h2>
                  <p className="text-xs text-slate-500">Centrally Managed Superadmin Dispatch Operations</p>
                </div>
              </div>

              <div className="p-4.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold text-emerald-950 text-xs block">Centralised Delivery Standard Active</span>
                  <p className="text-[11px] text-emerald-800 leading-normal font-sans">
                    To maintain checkout transparency and eliminate merchant package delays, all courier dispatch pipelines, home deliveries, and transit charges are managed directly by the platform's central SuperAdmin courier team.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-450 block font-mono tracking-wider">How to Dispatch Customer Products</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-4 rounded-xl space-y-1.5 bg-slate-50 text-xs">
                    <span className="font-bold text-indigo-950 block">1. Accept and Package</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Accept orders under the "Order Management" queue tab, package items securely, and sticker the printed customer invoice label on the carton.
                    </p>
                  </div>

                  <div className="border border-slate-200 p-4 rounded-xl space-y-1.5 bg-slate-50 text-xs">
                    <span className="font-bold text-indigo-950 block">2. Automatic Rider Pickup</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      The marketplace dispatch service receives real-time notifications about "Packaging" orders. A contracted delivery rider will check in to accept packages.
                    </p>
                  </div>
                </div>

                <div className="border border-indigo-100 p-4 rounded-xl text-xs space-y-2 bg-indigo-50/30">
                  <span className="font-bold text-indigo-950 block flex items-center gap-1">
                    🟢 Flat Delivery Fee Structure for Customers
                  </span>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    A flat Delivery fee of <b>$2.00 USD</b> (local residential dispatch) or <b>$5.00 USD</b> (expedited out of city) is paid seamlessly by the buyer at checkout. This fee covers courier fuel, GPS tracking software, and courier rider compensation. Storefront merchants are not charged any separate subscription or service fee for delivery fulfillment.
                  </p>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  * Note: Storefront representatives do not need to configure any shipping methods or courier accounts manually. Enjoy effortless zero-overhead delivery mechanics!
                </p>
              </div>
            </div>
          )}


          {/* MAP EXISTING TABS BACK TO PRESERVED SUB-BLOCKS */}
          {((activeTab === 'catalog_list' || activeTab === 'catalog_add' || activeTab === 'products') && false) && <div> staler </div>}
          
          {/* We now let the existing products component continue below, but pre-wrapped */}
          {(activeTab === 'catalog_add' || (activeTab === 'products' && (editingProduct || products.length === 0))) && (
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Custom SKU</label>
                    <input type="text" placeholder="SKU-EB-SLIM" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Category</label>
                    <select value={category} onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      // Auto-select first subcategory of new category choice if available
                      const matched = fullCategoriesList.find(c => c.name.toLowerCase() === newCat.toLowerCase());
                      if (matched && matched.subcategories.length > 0) {
                        setSubcategory(matched.subcategories[0]);
                      } else {
                        setSubcategory('');
                      }
                    }} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-850 focus:bg-white focus:outline-none cursor-pointer">
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Subcategory</label>
                    <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-4 py-3 text-slate-850 focus:bg-white focus:outline-none cursor-pointer">
                      <option value="">General</option>
                      {(fullCategoriesList.find(c => c.name.toLowerCase() === category.toLowerCase())?.subcategories || []).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
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

      {(activeTab === 'orders' || activeTab.startsWith('orders_')) && (
        <div className="space-y-6 text-left animate-in fade-in duration-200" id="vendor-orders-section">
          {/* Header Dashboard section */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 animate-pulse" /> {selectedVendor?.vendorName} order management intake
              </h3>
              <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-2xl">
                This console is filtered securely to your storefront items. You are responsible for dispatching, packing, and transitioning fulfillment statuses across active customer cycles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => fetchInitialData(false)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-205 rounded-lg cursor-pointer shadow-3xs active:scale-95 transition disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                Sync Central Statuses
              </button>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-205 w-fit">
              {['all', 'pending', 'processing', 'shipped', 'delivered'].map((status) => {
                const count = orders.filter(o => matchStatusOption(o, status)).length;
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
          ) : orders.filter(o => matchStatusOption(o, activeStatusFilter)).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 font-mono text-xs">
              No product orders are currently in the "{activeStatusFilter.toUpperCase()}" queue stage.
            </div>
          ) : (
            <div className="space-y-5">
              {orders
                .filter(o => matchStatusOption(o, activeStatusFilter))
                .map((ord) => {
                  const vendorPortionItems = ord.items.filter(item => products.some(p => p.id === item.productId));
                  const vendorPortionSum = vendorPortionItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const getVendorOrderStatus = (x: Order) => (x.vendorStatuses && selectedVendor && x.vendorStatuses[selectedVendor.id]) || x.status;
                  const currentVendorStatus = getVendorOrderStatus(ord);
                  const isFullyDelivered = currentVendorStatus === 'delivered';

                  const lastHistory = ord.statusHistory && ord.statusHistory.length > 0
                    ? ord.statusHistory[ord.statusHistory.length - 1]
                    : null;
                  const isUpdatedByAdmin = lastHistory && (
                    lastHistory.note.toLowerCase().includes('suuqhub') ||
                    lastHistory.note.toLowerCase().includes('admin') ||
                    lastHistory.note.toLowerCase().includes('central') ||
                    lastHistory.note.toLowerCase().includes('logistics') ||
                    lastHistory.note.toLowerCase().includes('courier')
                  );

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
                              currentVendorStatus === 'delivered' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
                              currentVendorStatus === 'shipped' ? 'bg-indigo-50 border-indigo-250 text-indigo-700' :
                              'bg-amber-50 border-amber-250 text-amber-705'
                            }`}>
                              {currentVendorStatus === 'shipped' ? '🚚 Dispatched (Shipped)' : currentVendorStatus}
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
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" /> 
                              {expandedOrderId === ord.id ? "Collapse processing history" : "Inspect activity timeline"} ({ord.statusHistory?.length || 1})
                            </button>

                            {isUpdatedByAdmin && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-150 text-indigo-800 px-2 py-0.5 rounded shadow-3xs animate-pulse">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Status Managed by SuperAdmin
                              </span>
                            )}
                          </div>

                          {isUpdatedByAdmin && lastHistory && (
                            <div className="mt-2 p-3 bg-indigo-50/30 border border-indigo-100/60 rounded-lg max-w-xl text-left font-sans">
                              <p className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">SuperAdmin Execution Note:</p>
                              <p className="text-[10.5px] text-slate-700 italic font-medium mt-0.5">"{lastHistory.note}"</p>
                            </div>
                          )}

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
                              {currentVendorStatus === 'pending' ? (
                                <button
                                  disabled={transitioningOrderId !== null}
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'processing', `Store seller merchant ${selectedVendor?.vendorName} has approved checkout and packaged the item. Ready for SuuqHub courier pickup.`)}
                                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <ArrowRight className="w-4 h-4" /> Approve & Pack order (Home Delivery)
                                </button>
                              ) : currentVendorStatus === 'processing' ? (
                                <div className="flex flex-col gap-1 text-left p-3.5 bg-amber-50 border border-amber-205 rounded-lg max-w-xs sm:max-w-sm font-sans">
                                  <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
                                    📦 Packed & Awaiting SuuqHub Dispatch
                                  </span>
                                  <p className="text-[10px] text-amber-700 leading-normal">
                                    Vendor packaging done. SuuqHub operations has been notified and will handle courier dispatching shortly.
                                  </p>
                                </div>
                              ) : currentVendorStatus === 'shipped' ? (
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
                              {currentVendorStatus === 'pending' && (
                                <button
                                  disabled={transitioningOrderId !== null}
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'processing', `Store seller merchant ${selectedVendor?.vendorName} has approved checkout. Customer self-pickup package is being structured.`)}
                                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <ArrowRight className="w-4 h-4" /> Approve & Pack order (Pickup)
                                </button>
                              )}

                              {currentVendorStatus === 'processing' && (
                                <button
                                  disabled={transitioningOrderId !== null}
                                  onClick={() => handleTransitionOrderStatus(ord.id, 'shipped', `Sellers packaging done. Package is prepared and marked waiting for client self-pickup.`)}
                                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95 animate-pulse"
                                >
                                  <Truck className="w-4 h-4" /> Ready for Customer Pickup
                                </button>
                              )}

                              {currentVendorStatus === 'shipped' && (
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

      {(activeTab === 'campaigns' || activeTab === 'marketing_campaigns') && (
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

      {(activeTab === 'coupons' || activeTab === 'promotions_coupons') && (
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

      {(activeTab === 'settings' || activeTab === 'settings_shop') && selectedVendor && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6 text-left animate-in fade-in duration-200" id="vendor-portal-settings">
          <div>
            <h2 className="font-sans font-bold text-sm uppercase tracking-wider text-indigo-650 flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-2">
              <Sliders className="w-5 h-5 text-indigo-600" /> Store Branding & Settings
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define your brand's visual identity, storefront status, and billing mobile phone lines details for Somaliland's popular mobile wallets (Zaad & eDahab).
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

            {/* Store Information */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Storefront Presentation</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Store Owner / Representative</label>
                  <input
                    type="text"
                    placeholder="e.g. Salem Al-Mansoori"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">2-Letter Logo Symbol (Optional)</label>
                  <input
                    maxLength={3}
                    placeholder="e.g. BS"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1.5">Store Hero Banner Image</label>
                
                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleBannerDragOver}
                  onDrop={handleBannerDrop}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 rounded-xl p-5 text-center cursor-pointer transition-all relative group"
                  onClick={() => document.getElementById('settings-banner-file')?.click()}
                >
                  <input
                    type="file"
                    id="settings-banner-file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleShopBannerFile(e.target.files[0]);
                      }
                    }}
                  />
                  
                  {banner ? (
                    <div className="space-y-3">
                      <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-200 relative">
                        <img src={banner} alt="Store banner preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBanner('');
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-md cursor-pointer"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-mono font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Banner Image Loaded Successfully
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Drag & drop your store banner here, or <span className="text-indigo-605 hover:underline text-indigo-600">browse files</span></p>
                        <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, or WEBP. Landscape aspect ratio is recommended.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preset Banner Quick Pick Option */}
                <div className="mt-3.5 text-left space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">Or Quick Pick Preset Theme Cover:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Bicycle & Sports', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80' },
                      { name: 'Books Store', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80' },
                      { name: 'Fashion Brand', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80' },
                      { name: 'Gems & Jewelry', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80' },
                    ].map((ps) => (
                      <button
                        key={ps.name}
                        type="button"
                        onClick={() => setBanner(ps.url)}
                        className="cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded text-slate-600 font-bold border border-slate-200/60"
                      >
                        {ps.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider mb-1">Store Description</label>
                <textarea
                  rows={2}
                  placeholder="Introduce your store, product lines, and shipping standard policies to customers..."
                  value={vendorDescription}
                  onChange={(e) => setVendorDescription(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
                />
              </div>

              {/* Status Switcher - IsClosed */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100/50 rounded-lg border border-slate-200">
                <div className="text-left space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Temporarily Close Storefront</span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Clients will see a "Closed Now" badge over your storefront card and catalog pages.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isClosed}
                    onChange={(e) => setIsClosed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-250 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 border border-slate-300"></div>
                </label>
              </div>
            </div>

            {/* Mobile Wallet Accounts */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mobile Payment Wallets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-mono font-black tracking-wider text-emerald-600 uppercase flex items-center gap-1">
                    🟢 Zaad Service Tel (Optional)
                  </span>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 634400213"
                    value={zaadNumber}
                    onChange={(e) => setZaadNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-mono font-black tracking-wider text-amber-700 uppercase flex items-center gap-1">
                    🟡 eDahab Service Tel (Optional)
                  </span>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 627700213"
                    value={edahabNumber}
                    onChange={(e) => setEdahabNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-550"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {isSavingSettings ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving Store Configurations...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Store configurations
                </>
              )}
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
