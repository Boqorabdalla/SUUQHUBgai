/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc as rawSetDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

function cleanPayload(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanPayload(item));
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = cleanPayload(val);
    }
  }
  return cleaned;
}

function setDoc(docRef: any, data: any, options?: any) {
  return rawSetDoc(docRef, cleanPayload(data), options);
}
import { initialProducts, initialCoupons, initialOrders } from './initialData';

const initialVendors = [
  {
    id: "vnd-6valley",
    vendorName: "6valley CMS",
    representativeName: "Devon Lane",
    email: "6valley@suuqhub.com",
    category: "eCommerce Services",
    status: "approved",
    earnings: 3241.50,
    description: "Sovereign multi-merchant CMS system integrations, bespoke digital solutions and support.",
    taxId: "TRN-9948212",
    createdAt: "2026-05-10T11:00:00Z",
    password: "6valleyPass123",
    rating: 4.8,
    reviewsCount: 4,
    productsCount: 194,
    ordersCount: 201,
    banner: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    logo: "6V",
    isClosed: false
  },
  {
    id: "vnd-bicycle",
    vendorName: "Bicycle Shop",
    representativeName: "Cycle Specialist",
    email: "bicycle@suuqhub.com",
    category: "Sports & Fitness",
    status: "approved",
    earnings: 450.00,
    description: "All variety of fitness bicycles, mountain bikes, road gears and repair accessories.",
    taxId: "TRN-8848123",
    createdAt: "2026-05-12T09:00:00Z",
    password: "bicyclePass123",
    rating: 0.0,
    reviewsCount: 0,
    productsCount: 14,
    ordersCount: 59,
    banner: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
    logo: "BS",
    isClosed: false
  },
  {
    id: "vnd-book",
    vendorName: "Book Store",
    representativeName: "Albert Page",
    email: "bookstore@suuqhub.com",
    category: "Literature",
    status: "approved",
    earnings: 820.00,
    description: "Multi-genre academic bookshelves, children's publications and local printing hub.",
    taxId: "TRN-7742199",
    createdAt: "2026-05-14T14:30:00Z",
    password: "bookstorePass123",
    rating: 4.5,
    reviewsCount: 2,
    productsCount: 19,
    ordersCount: 74,
    banner: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    logo: "BK",
    isClosed: false
  },
  {
    id: "vnd-jewel",
    vendorName: "Golden Jewellery",
    representativeName: "Sarah Stone",
    email: "jewel@suuqhub.com",
    category: "Fashion Accessories",
    status: "approved",
    earnings: 4890.00,
    description: "Luxury sovereign metal rings, bridal bands and fine jewelry accessories.",
    taxId: "TRN-1122334",
    createdAt: "2026-05-15T10:15:00Z",
    password: "jewelPass123",
    rating: 3.0,
    reviewsCount: 1,
    productsCount: 17,
    ordersCount: 88,
    banner: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    logo: "GJ",
    isClosed: false
  },
  {
    id: "vnd-foot",
    vendorName: "FootFinds",
    representativeName: "Marcus Sole",
    email: "sneakers@suuqhub.com",
    category: "Fashion",
    status: "approved",
    earnings: 1105.00,
    description: "Trending athletic footwear, leather casual sets and exclusive sneakers.",
    taxId: "TRN-5544332",
    createdAt: "2026-05-18T16:00:00Z",
    password: "sneakersPass123",
    rating: 5.0,
    reviewsCount: 1,
    productsCount: 13,
    ordersCount: 42,
    banner: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    logo: "FF",
    isClosed: false
  },
  {
    id: "vnd-phone",
    vendorName: "Phone Store",
    representativeName: "David Tech",
    email: "phonestore@suuqhub.com",
    category: "Electronics",
    status: "approved",
    earnings: 1950.00,
    description: "Certified smartphones, tablets, high-performance battery replacements and charges.",
    taxId: "TRN-9988776",
    createdAt: "2026-5-20T08:00:00Z",
    password: "phonestorePass123",
    rating: 0.0,
    reviewsCount: 0,
    productsCount: 13,
    ordersCount: 112,
    banner: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    logo: "PS",
    isClosed: false
  },
  {
    id: "vnd-liceria",
    vendorName: "Liceria & Co.",
    representativeName: "Lia Liceria",
    email: "liceria@suuqhub.com",
    category: "Bags & Lifestyle",
    status: "approved",
    earnings: 0.00,
    description: "Chic modern handbags, leather duffel bags and luxury fashion statement products.",
    taxId: "TRN-4455667",
    createdAt: "2026-05-22T13:45:00Z",
    password: "liceriaPass123",
    rating: 0.0,
    reviewsCount: 0,
    productsCount: 28,
    ordersCount: 15,
    banner: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    logo: "LC",
    isClosed: true
  },
  {
    id: "vnd-pets",
    vendorName: "Pets Store",
    representativeName: "Bella Fur",
    email: "pets@suuqhub.com",
    category: "Pet Care",
    status: "approved",
    earnings: 180.00,
    description: "Premium pet nutrition meals, organic chew items, dynamic scratch cards and toys.",
    taxId: "TRN-7788990",
    createdAt: "2026-05-25T11:20:00Z",
    password: "petsPass123",
    rating: 0.0,
    reviewsCount: 0,
    productsCount: 13,
    ordersCount: 34,
    banner: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80",
    logo: "PT",
    isClosed: false
  },
  {
    id: "vnd-athletic",
    vendorName: "Athletic Venture",
    representativeName: "Coach Alan",
    email: "athletics@suuqhub.com",
    category: "Sports & Gym",
    status: "approved",
    earnings: 0.00,
    description: "Performance sportswear, sweat bands, heavyweight dumbells and fitness rigs.",
    taxId: "TRN-1133557",
    createdAt: "2026-05-27T15:10:00Z",
    password: "athleticsPass123",
    rating: 0.0,
    reviewsCount: 0,
    productsCount: 16,
    ordersCount: 8,
    banner: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    logo: "AV",
    isClosed: true
  },
  {
    id: "usr-vendor-03",
    vendorName: "Manaal skin care",
    representativeName: "Manaal",
    email: "Manaal@gmail.com",
    category: "Beauty",
    status: "approved",
    earnings: 550.00,
    description: "Premium organic skin care products, hydration salves and dermatological solutions.",
    taxId: "TRN-3382741",
    createdAt: "2026-06-01T12:00:00Z",
    password: "123abc123",
    rating: 4.9,
    reviewsCount: 3,
    productsCount: 11,
    ordersCount: 45,
    banner: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    logo: "MS",
    isClosed: false
  }
];

const initialHeroCampaigns = [
  {
    id: "camp-01",
    vendorId: "usr-vendor-02",
    vendorName: "Global Trader Store",
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=80",
    title: "SuuqHub Smart Wearables",
    subtitle: "Up to 30% Off on Premium Smart Accessories. Verified Multi-Vendor Deals.",
    pricingTier: "Frontpage Premium Hero",
    durationDays: 14,
    feeUSD: 250,
    status: "approved",
    createdAt: "2026-05-20T10:00:00Z",
    approvedAt: "2026-05-20T12:00:00Z"
  },
  {
    id: "camp-02",
    vendorId: "usr-vendor-02",
    vendorName: "Global Trader Store",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    title: "Aura Acoustix Premium Headsets",
    subtitle: "Immerse into crisp high-fidelity acoustics. Limited discount offers available.",
    pricingTier: "Frontpage Premium Hero",
    durationDays: 30,
    feeUSD: 500,
    status: "approved",
    createdAt: "2026-05-25T11:00:00Z",
    approvedAt: "2026-05-25T14:00:00Z"
  }
];

const fallbackCache: Record<string, any[]> = {};

export function clearFallbackCache(collectionName?: string) {
  if (collectionName) {
    delete fallbackCache[collectionName];
  } else {
    for (const key of Object.keys(fallbackCache)) {
      delete fallbackCache[key];
    }
  }
}

async function getCollectionDocs(collectionName: string, defaultData?: any[]) {
  try {
    if (collectionName !== 'orders' && fallbackCache[collectionName] && fallbackCache[collectionName].length > 0) {
      return fallbackCache[collectionName];
    }
    const colRef = collection(db, collectionName);
    
    let snap;
    if (collectionName === 'orders') {
      let isPrivileged = false;
      let customerId = 'non_existent_signed_out_user_id';

      // 1. Verify sandbox local user override first
      try {
        const localUserStr = typeof window !== 'undefined' ? localStorage.getItem('apex_local_user') : null;
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          if (localUser) {
            customerId = localUser.id || customerId;
            const r = localUser.role;
            if (r === 'admin' || r === 'superadmin' || r === 'vendor' || r === 'delivery_manager') {
              isPrivileged = true;
            }
          }
        }
      } catch (localErr) {
        console.warn("Failed to analyze local storage credentials inside fallback handler:", localErr);
      }

      // 2. Validate Firebase dynamic Auth state
      const currentUser = auth.currentUser;
      if (currentUser) {
        customerId = currentUser.uid;
        const emailLower = currentUser.email?.toLowerCase();
        
        // High-trust sandbox presets bypass to avoid firestore document replication delays
        if (emailLower === 'boqorapps@gmail.com' || emailLower === 'manaal@gmail.com' || emailLower === 'sarah@globaltrader.com' || emailLower === 'delivery@suuqhub.com') {
          isPrivileged = true;
        } else {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const uRole = userSnap.data()?.role;
              if (uRole === 'admin' || uRole === 'superadmin' || uRole === 'vendor' || uRole === 'delivery_manager') {
                isPrivileged = true;
              }
            }
          } catch (err) {
            console.warn("Could not query user doc in apiFallback mapping:", err);
          }
        }
      }

      if (isPrivileged) {
        snap = await getDocs(colRef);
      } else if (currentUser || customerId !== 'non_existent_signed_out_user_id') {
        const q = query(colRef, where('customerId', '==', customerId));
        snap = await getDocs(q);
      } else {
        const q = query(colRef, where('customerId', '==', 'non_existent_signed_out_user_id'));
        snap = await getDocs(q);
      }
    } else {
      snap = await getDocs(colRef);
    }

    if (snap.empty && defaultData) {
      console.log(`Seeding empty Firestore collection "${collectionName}" with dynamic assets...`);
      for (const item of defaultData) {
        const seededItem = { ...item };
        if (collectionName === 'products' && !seededItem.vendorId) {
          const isBeauty = seededItem.category === 'Beauty';
          seededItem.vendorId = isBeauty ? 'usr-vendor-03' : 'usr-vendor-02';
          seededItem.vendorName = isBeauty ? 'Manaal skin care' : 'Global Trader Store';
        }
        const id = seededItem.id || seededItem.code || seededItem.code?.toUpperCase();
        await setDoc(doc(db, collectionName, id), seededItem);
      }
      
      let newSnap;
      if (collectionName === 'orders') {
        let isPrivilegedAfter = false;
        let customerIdAfter = 'non_existent_signed_out_user_id';

        try {
          const localUserStr = typeof window !== 'undefined' ? localStorage.getItem('apex_local_user') : null;
          if (localUserStr) {
            const localUser = JSON.parse(localUserStr);
            if (localUser) {
              customerIdAfter = localUser.id || customerIdAfter;
              const r = localUser.role;
              if (r === 'admin' || r === 'superadmin' || r === 'vendor' || r === 'delivery_manager') {
                isPrivilegedAfter = true;
              }
            }
          }
        } catch (localErr) {
          console.warn("Failed to analyze local storage credentials inside post-seed handler:", localErr);
        }

        const currentUser = auth.currentUser;
        if (currentUser) {
          customerIdAfter = currentUser.uid;
          const emailLower = currentUser.email?.toLowerCase();
          if (emailLower === 'boqorapps@gmail.com' || emailLower === 'manaal@gmail.com' || emailLower === 'sarah@globaltrader.com' || emailLower === 'delivery@suuqhub.com') {
            isPrivilegedAfter = true;
          } else {
            try {
              const userRef = doc(db, 'users', currentUser.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const uRole = userSnap.data()?.role;
                if (uRole === 'admin' || uRole === 'superadmin' || uRole === 'vendor' || uRole === 'delivery_manager') {
                  isPrivilegedAfter = true;
                }
              }
            } catch (err) {
              console.warn("Could not query user doc post-seed:", err);
            }
          }
        }

        if (isPrivilegedAfter) {
          newSnap = await getDocs(colRef);
        } else {
          const q = query(colRef, where('customerId', '==', customerIdAfter));
          newSnap = await getDocs(q);
        }
      } else {
        newSnap = await getDocs(colRef);
      }
      let docs = newSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (collectionName === 'products') {
        docs = docs.map((p: any) => {
          if (!p.vendorId) {
            const isBeauty = p.category === 'Beauty';
            return {
              ...p,
              vendorId: isBeauty ? 'usr-vendor-03' : 'usr-vendor-02',
              vendorName: isBeauty ? 'Manaal skin care' : 'Global Trader Store'
            };
          }
          return p;
        });
      }
      if (collectionName !== 'orders') {
        fallbackCache[collectionName] = docs;
      }
      return docs;
    }

    let docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    if (collectionName === 'products') {
      docs = docs.map((p: any) => {
        if (!p.vendorId) {
          const isBeauty = p.category === 'Beauty';
          return {
            ...p,
            vendorId: isBeauty ? 'usr-vendor-03' : 'usr-vendor-02',
            vendorName: isBeauty ? 'Manaal skin care' : 'Global Trader Store'
          };
        }
        return p;
      });
    }
    if (collectionName !== 'orders') {
      fallbackCache[collectionName] = docs;
    }
    return docs;
  } catch (err) {
    console.error(`Error reading/seeding Firestore collection "${collectionName}":`, err);
    return defaultData || [];
  }
}

const originalFetch = window.fetch;
let useDirectFirestore = false;

// Auto-activate Direct Firestore if we are running in production on Hostinger / non-sandbox domains
const hostname = window.location.hostname;
if (hostname && !hostname.includes('.run.app') && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
  useDirectFirestore = true;
  console.log("Direct serverless client-side Firestore integration initialized for host:", hostname);
}

const customFetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
  
  if (!urlString.includes('/api/')) {
    return originalFetch(input, init);
  }

  const url = new URL(urlString, window.location.origin);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  if (!useDirectFirestore) {
    try {
      const res = await originalFetch(input, init);
      const contentType = res.headers.get('content-type') || '';
      if (res.status === 404 || contentType.includes('text/html')) {
        console.warn(`Host API served unhandled HTML / offline redirect (${res.status}). Switching to secure direct client-side Firestore fallback...`);
        useDirectFirestore = true;
      } else {
        return res;
      }
    } catch (e) {
      console.warn("Backend server connection failed. Switching to direct client-side Firestore fallback...", e);
      useDirectFirestore = true;
    }
  }

  // Handle direct client-side Firebase operations
  try {
    const method = init?.method?.toUpperCase() || 'GET';
    const bodyObj = init?.body ? JSON.parse(init.body as string) : null;

    const jsonResponse = (data: any, status = 200) => {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      return new Response(blob, {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    // 1. CONFIGURATION
    if (pathname === '/api/delivery-config') {
      if (method === 'GET') {
        const docRef = doc(db, 'config', 'delivery');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return jsonResponse({
            deliveryFee: 15,
            enableCard: true,
            enableCod: true,
            enableZaad: true,
            enableEdahab: true,
            ...snap.data()
          });
        } else {
          return jsonResponse({
            deliveryFee: 15,
            enableCard: true,
            enableCod: true,
            enableZaad: true,
            enableEdahab: true
          });
        }
      } else if (method === 'POST') {
        const docRef = doc(db, 'config', 'delivery');
        const snap = await getDoc(docRef);
        const existing = snap.exists() ? snap.data() : {
          deliveryFee: 15,
          enableCard: true,
          enableCod: true,
          enableZaad: true,
          enableEdahab: true
        };
        const payload = {
          deliveryFee: Number(bodyObj.fee !== undefined ? bodyObj.fee : (bodyObj.deliveryFee !== undefined ? bodyObj.deliveryFee : existing.deliveryFee)),
          enableCard: bodyObj.enableCard !== undefined ? bodyObj.enableCard === true : (existing.enableCard !== false),
          enableCod: bodyObj.enableCod !== undefined ? bodyObj.enableCod === true : (existing.enableCod !== false),
          enableZaad: bodyObj.enableZaad !== undefined ? bodyObj.enableZaad === true : (existing.enableZaad !== false),
          enableEdahab: bodyObj.enableEdahab !== undefined ? bodyObj.enableEdahab === true : (existing.enableEdahab !== false)
        };
        await setDoc(docRef, payload);
        return jsonResponse({ success: true, ...payload });
      }
    }

    // 1.5. CATEGORIES
    if (pathname.startsWith('/api/categories')) {
      const id = pathname.replace('/api/categories', '').replace('/', '');
      const defaultCategories = [
        { id: "electronics", name: "Electronics", subcategories: ["Audio", "Wearables", "Accessories"] },
        { id: "fashion", name: "Fashion", subcategories: ["Bags", "Apparel", "Footwear"] },
        { id: "living", name: "Living", subcategories: ["Hydration", "Office Furniture"] },
        { id: "beauty", name: "Beauty", subcategories: ["Wellness"] }
      ];

      if (id) {
        const docRef = doc(db, 'categories', id);
        if (method === 'DELETE') {
          await deleteDoc(docRef);
          clearFallbackCache('categories');
          return jsonResponse({ success: true, message: "Category deleted" });
        } else if (method === 'PUT') {
          const snap = await getDoc(docRef);
          const existing = snap.exists() ? snap.data() : { name: '', subcategories: [] };
          const merged = {
            ...existing,
            ...bodyObj,
            id
          };
          await setDoc(docRef, merged);
          clearFallbackCache('categories');
          return jsonResponse(merged);
        }
      } else {
        if (method === 'GET') {
          const list = await getCollectionDocs('categories', defaultCategories);
          return jsonResponse(list);
        } else if (method === 'POST') {
          const name = bodyObj.name || '';
          const idValue = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || `cat-${Date.now()}`;
          const newCat = {
            id: idValue,
            name: name.trim(),
            subcategories: Array.isArray(bodyObj.subcategories) ? bodyObj.subcategories : []
          };
          await setDoc(doc(db, 'categories', idValue), newCat);
          clearFallbackCache('categories');
          return jsonResponse(newCat, 201);
        }
      }
    }

const getVendorForProduct = (product: any) => {
  const cat = (product.category || '').toLowerCase();
  const sub = (product.subcategory || '').toLowerCase();
  
  if (cat.includes('beauty') || cat.includes('skin') || sub.includes('skin')) {
    return { id: 'usr-vendor-03', name: 'Manaal skin care' };
  } else if (cat.includes('sport') || cat.includes('gym')) {
    if (sub.includes('gear') || sub.includes('cycle') || sub.includes('bike') || product.id?.includes('bike') || product.id?.includes('edelbrock') || product.id?.includes('trailer') || product.id?.includes('wheel') || product.id?.includes('ledlights')) {
      return { id: 'vnd-bicycle', name: 'Bicycle Shop' };
    }
    return { id: 'vnd-athletic', name: 'Athletic Venture' };
  } else if (cat.includes('liter') || cat.includes('book') || sub.includes('fiction')) {
    return { id: 'vnd-book', name: 'Book Store' };
  } else if (cat.includes('jewel') || sub.includes('ring') || product.id?.includes('ring')) {
    return { id: 'vnd-jewel', name: 'Golden Jewellery' };
  } else if (sub.includes('footwear') || sub.includes('shoe') || product.id?.includes('shoes')) {
    return { id: 'vnd-foot', name: 'FootFinds' };
  } else if (cat.includes('pet')) {
    return { id: 'vnd-pets', name: 'Pets Store' };
  } else if (sub.includes('audio') || sub.includes('wearable') || product.id?.includes('headphones') || product.id?.includes('watch')) {
    return { id: 'vnd-phone', name: 'Phone Store' };
  } else if (cat.includes('fashion') || cat.includes('bag') || product.id?.includes('backpack') || product.id?.includes('sweater')) {
    return { id: 'vnd-liceria', name: 'Liceria & Co.' };
  }
  return { id: 'vnd-6valley', name: '6valley CMS' };
};

    // 2. PRODUCTS
    if (pathname.startsWith('/api/products')) {
      const id = pathname.replace('/api/products', '').replace('/', '');
      if (id) {
        const docRef = doc(db, 'products', id);
        if (method === 'GET') {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const productData = { ...snap.data(), id: snap.id } as any;
            if (!productData.vendorId) {
              const info = getVendorForProduct(productData);
              productData.vendorId = info.id;
              productData.vendorName = info.name;
            }
            return jsonResponse(productData);
          } else {
            return jsonResponse({ error: "Product not found" }, 404);
          }
        } else if (method === 'PUT') {
          const snap = await getDoc(docRef);
          const existing = snap.data() || {};
          const merged = {
            ...existing,
            ...bodyObj,
            price: bodyObj.price !== undefined ? Number(bodyObj.price) : existing.price,
            stock: bodyObj.stock !== undefined ? Number(bodyObj.stock) : existing.stock
          };
          await setDoc(docRef, merged);
          clearFallbackCache('products');
          return jsonResponse(merged);
        } else if (method === 'DELETE') {
          await deleteDoc(docRef);
          clearFallbackCache('products');
          return jsonResponse({ success: true, message: "Product deleted" });
        }
      } else {
        if (method === 'GET') {
          const rawProducts = await getCollectionDocs('products', initialProducts);
          let filtered = rawProducts.map((p: any) => {
            const mapped = { ...p };
            if (!mapped.vendorId) {
              const info = getVendorForProduct(mapped);
              mapped.vendorId = info.id;
              mapped.vendorName = info.name;
            }
            return mapped;
          });

          const category = searchParams.get('category');
          const search = searchParams.get('search');
          const approval = searchParams.get('approval');
          const filterStatus = searchParams.get('filterStatus');

          if (category && category !== 'All') {
            filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
          }
          if (search) {
            const queryVal = search.toLowerCase();
            filtered = filtered.filter(p => 
              p.title?.toLowerCase().includes(queryVal) || 
              p.description?.toLowerCase().includes(queryVal) ||
              p.brand?.toLowerCase().includes(queryVal)
            );
          }
          if (approval === 'approved') {
            filtered = filtered.filter(p => p.isApproved);
          } else if (approval === 'pending') {
            filtered = filtered.filter(p => !p.isApproved);
          }
          if (filterStatus === 'active') {
            filtered = filtered.filter(p => p.isActive);
          }
          return jsonResponse(filtered);
        } else if (method === 'POST') {
          const pId = bodyObj.id || `prod-${Date.now()}`;
          const newProduct = {
            id: pId,
            ...bodyObj,
            price: Number(bodyObj.price),
            stock: bodyObj.stock !== undefined ? Number(bodyObj.stock) : 10,
            rating: bodyObj.rating || 5.0,
            ratingCount: bodyObj.ratingCount || 0,
            isActive: true,
            isApproved: bodyObj.isApproved !== undefined ? !!bodyObj.isApproved : true,
            isNewArrival: true,
            tags: bodyObj.tags || [],
            variants: bodyObj.variants || {},
            specifications: bodyObj.specifications || {}
          };
          await setDoc(doc(db, 'products', pId), newProduct);
          clearFallbackCache('products');
          return jsonResponse(newProduct, 201);
        }
      }
    }

    // 3. COUPONS
    if (pathname.startsWith('/api/coupons')) {
      if (pathname === '/api/coupons/validate') {
        const { code, spend } = bodyObj;
        const rawCoupons = await getCollectionDocs('coupons', initialCoupons);
        const coupon = rawCoupons.find((c: any) => c.code?.toUpperCase() === String(code).toUpperCase() && c.isActive);
        
        if (!coupon) {
          return jsonResponse({ valid: false, error: "Invalid coupon or expired code" }, 400);
        }
        if (spend < coupon.minSpend) {
          return jsonResponse({ valid: false, error: `Minimum spend of $${coupon.minSpend} required.` }, 400);
        }
        return jsonResponse({ valid: true, coupon });
      } else {
        const couponId = pathname.replace('/api/coupons', '').replace('/', '');
        if (couponId && method === 'DELETE') {
          await deleteDoc(doc(db, 'coupons', couponId.toUpperCase()));
          return jsonResponse({ success: true });
        }

        if (method === 'GET') {
          const list = await getCollectionDocs('coupons', initialCoupons);
          return jsonResponse(list);
        } else if (method === 'POST') {
          const codeUpper = bodyObj.code.toUpperCase();
          const newCoupon = {
            code: codeUpper,
            discountType: bodyObj.discountType,
            value: Number(bodyObj.value),
            minSpend: Number(bodyObj.minSpend || 0),
            expiryDate: bodyObj.expiryDate || "2026-12-31",
            isActive: true,
            vendorId: bodyObj.vendorId || null,
            vendorName: bodyObj.vendorName || null
          };
          await setDoc(doc(db, 'coupons', codeUpper), newCoupon);
          return jsonResponse(newCoupon, 201);
        }
      }
    }

    // 4. ORDERS
    if (pathname.startsWith('/api/orders')) {
      const routePath = pathname.replace('/api/orders', '');
      if (routePath.includes('/remittance')) {
        const orderId = routePath.replace('/remittance', '').replace('/', '');
        const docRef = doc(db, 'orders', orderId);
        try {
          const snap = await getDoc(docRef);
          if (!snap.exists()) return jsonResponse({ error: "Order not found" }, 404);
          const merged = { ...snap.data(), ...bodyObj };
          await setDoc(docRef, merged);
          return jsonResponse(merged);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
          return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 400);
        }
      } else if (routePath.includes('/status')) {
        const orderId = routePath.replace('/status', '').replace('/', '');
        const docRef = doc(db, 'orders', orderId);
        try {
          const snap = await getDoc(docRef);
          if (!snap.exists()) return jsonResponse({ error: "Order not found" }, 404);
          
          const existingOrder = snap.data();
          const status = bodyObj.status;
          const note = bodyObj.note;
          const vendorId = bodyObj.vendorId;
          
          const history = existingOrder.statusHistory || [];
          history.push({
            status: status,
            timestamp: new Date().toISOString(),
            note: note || `Status updated to ${status}`
          });
          
          const vendorStatuses = existingOrder.vendorStatuses || {};
          let mainStatus = status;
          
          if (vendorId) {
            vendorStatuses[vendorId] = status;
            
            // Recompute main status
            const vendorIds = Object.keys(vendorStatuses);
            if (vendorIds.length > 0) {
              const statuses = vendorIds.map(vid => vendorStatuses[vid]);
              if (statuses.every(s => s === 'delivered')) {
                mainStatus = 'delivered';
              } else if (statuses.every(s => s === 'shipped' || s === 'delivered')) {
                mainStatus = 'shipped';
              } else if (statuses.every(s => s === 'processing' || s === 'shipped' || s === 'delivered')) {
                mainStatus = 'processing';
              } else {
                mainStatus = 'pending';
              }
            }
          } else {
            // Admin override
            for (const vid of Object.keys(vendorStatuses)) {
              vendorStatuses[vid] = status;
            }
          }
          
          const merged = {
            ...existingOrder,
            status: mainStatus,
            statusHistory: history,
            vendorStatuses
          };
          await setDoc(docRef, merged);
          return jsonResponse(merged);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
          return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 400);
        }
      } else {
        if (method === 'GET') {
          const list = await getCollectionDocs('orders', initialOrders);
          return jsonResponse(list);
        } else if (method === 'POST') {
          const orderId = bodyObj.id || `ord-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-6)}`;
          
          const items = bodyObj.items || [];
          const vendorStatuses: Record<string, string> = {};
          for (const item of items) {
            const pId = item.productId || item.id;
            const pRef = doc(db, 'products', pId);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              const newStock = Math.max(0, (pData.stock || 0) - (item.quantity || 1));
              await setDoc(pRef, { ...pData, stock: newStock });
              
              if (pData.vendorId) {
                vendorStatuses[pData.vendorId] = "pending";
              }
            }
          }

          const newOrder = {
            id: orderId,
            customerId: bodyObj.customerId || "usr-customer-01",
            customerName: bodyObj.customerName || "Guest User",
            customerEmail: bodyObj.customerEmail || "guest@example.com",
            items: bodyObj.items || [],
            subtotal: Number(bodyObj.subtotal),
            tax: Number(bodyObj.tax),
            shippingCost: Number(bodyObj.shippingCost),
            discount: Number(bodyObj.discount || 0),
            total: Number(bodyObj.total),
            couponCode: bodyObj.couponCode || null,
            paymentMethod: bodyObj.paymentMethod || "Credit Card",
            paymentStatus: "paid",
            shippingAddress: bodyObj.shippingAddress,
            status: "pending",
            statusHistory: [
              { status: "pending", timestamp: new Date().toISOString(), note: "Order placed. Paid securely." }
            ],
            vendorStatuses,
            createdAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            deliveryMethod: bodyObj.deliveryMethod || 'delivery',
            mobilePayment: bodyObj.mobilePayment || null,
            deliveryFeeRemittanceStatus: (bodyObj.deliveryMethod === 'delivery' || !bodyObj.deliveryMethod) ? 'owed' : null
          };

          await setDoc(doc(db, 'orders', orderId), newOrder);
          clearFallbackCache('products');
          return jsonResponse(newOrder, 201);
        }
      }
    }

    // 5. VENDORS
    if (pathname.startsWith('/api/vendors')) {
      const routePath = pathname.replace('/api/vendors', '');
      
      if (routePath.includes('/status')) {
        const vendorId = routePath.replace('/status', '').replace('/', '');
        const docRef = doc(db, 'vendors', vendorId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return jsonResponse({ error: "Vendor account not found" }, 404);
        
        const merged = { ...snap.data(), status: bodyObj.status };
        await setDoc(docRef, merged);
        return jsonResponse(merged);
      } else if (routePath.includes('/credentials')) {
        const vendorId = routePath.replace('/credentials', '').replace('/', '');
        const docRef = doc(db, 'vendors', vendorId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return jsonResponse({ error: "Vendor account not found" }, 404);
        
        const existing = snap.data();
        const merged = {
          ...existing,
          email: bodyObj.email !== undefined ? bodyObj.email : existing.email,
          password: bodyObj.password !== undefined ? bodyObj.password : existing.password,
          representativeName: bodyObj.representativeName !== undefined ? bodyObj.representativeName : existing.representativeName,
          zaadNumber: bodyObj.zaadNumber !== undefined ? bodyObj.zaadNumber : existing.zaadNumber,
          edahabNumber: bodyObj.edahabNumber !== undefined ? bodyObj.edahabNumber : existing.edahabNumber,
          banner: bodyObj.banner !== undefined ? bodyObj.banner : existing.banner,
          logo: bodyObj.logo !== undefined ? bodyObj.logo : existing.logo,
          isClosed: bodyObj.isClosed !== undefined ? bodyObj.isClosed : existing.isClosed,
          description: bodyObj.description !== undefined ? bodyObj.description : existing.description
        };
        await setDoc(docRef, merged);
        return jsonResponse(merged);
      } else {
        if (method === 'GET') {
          const list = await getCollectionDocs('vendors', initialVendors);
          return jsonResponse(list);
        } else if (method === 'POST') {
          const email = bodyObj.email;
          const list = await getCollectionDocs('vendors', initialVendors);
          const exists = list.find((v: any) => v.email?.toLowerCase() === email?.toLowerCase());
          if (exists) {
            return jsonResponse({ error: "A merchant with this email account is already registered." }, 400);
          }

          const vId = bodyObj.id || `usr-vendor-${Math.floor(100 + Math.random() * 900)}`;
          const newVendor = {
            id: vId,
            vendorName: bodyObj.vendorName,
            representativeName: bodyObj.representativeName,
            email,
            category: bodyObj.category || "General",
            status: bodyObj.status || "approved",
            earnings: 0.00,
            description: bodyObj.description || "No description supplied.",
            taxId: bodyObj.taxId || "N/A",
            createdAt: new Date().toISOString(),
            password: bodyObj.password || undefined
          };
          await setDoc(doc(db, 'vendors', vId), newVendor);
          return jsonResponse(newVendor, 201);
        }
      }
    }

    // 6. SUPPORT TICKETS
    if (pathname.startsWith('/api/tickets')) {
      const routePath = pathname.replace('/api/tickets', '');
      
      if (routePath.includes('/messages')) {
        const ticketId = routePath.replace('/messages', '').replace('/', '');
        const docRef = doc(db, 'support-tickets', ticketId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return jsonResponse({ error: "Ticket not found" }, 404);

        const existing = snap.data();
        const messages = existing.messages || [];
        messages.push({
          sender: bodyObj.sender || "user",
          text: bodyObj.text,
          timestamp: new Date().toISOString()
        });
        const updated = {
          ...existing,
          messages,
          status: bodyObj.sender === "support" ? "in-progress" : existing.status
        };
        await setDoc(docRef, updated);
        return jsonResponse(updated);
      } else {
        if (method === 'GET') {
          const list = await getCollectionDocs('support-tickets', []);
          return jsonResponse(list);
        } else if (method === 'POST') {
          const tId = `tkt-${Math.floor(100 + Math.random() * 900)}`;
          const newTicket = {
            id: tId,
            userId: bodyObj.userId || "usr-customer-01",
            userName: bodyObj.userName || "Salem Al-Mansoori",
            subject: bodyObj.subject,
            message: bodyObj.message,
            status: "open",
            messages: [{ sender: "user", text: bodyObj.message, timestamp: new Date().toISOString() }],
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'support-tickets', tId), newTicket);
          return jsonResponse(newTicket, 201);
        }
      }
    }

    // 7. HERO CAMPAIGNS
    if (pathname.startsWith('/api/hero-campaigns')) {
      const routePath = pathname.replace('/api/hero-campaigns', '');
      
      if (routePath.includes('/status')) {
        const campId = routePath.replace('/status', '').replace('/', '');
        const docRef = doc(db, 'hero-campaigns', campId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return jsonResponse({ error: "Hero Campaign not found" }, 404);

        const current = snap.data();
        const updated = {
          ...current,
          status: bodyObj.status,
          rejectionReason: bodyObj.rejectionReason !== undefined ? bodyObj.rejectionReason : current.rejectionReason,
          approvedAt: bodyObj.status === "approved" ? new Date().toISOString() : current.approvedAt
        };
        await setDoc(docRef, updated);
        return jsonResponse(updated);
      } else {
        if (method === 'GET') {
          const list = await getCollectionDocs('hero-campaigns', initialHeroCampaigns);
          return jsonResponse(list);
        } else if (method === 'POST') {
          const campId = `camp-${Math.floor(100 + Math.random() * 900)}`;
          const newCampaign = {
            id: campId,
            vendorId: bodyObj.vendorId || "usr-vendor-02",
            vendorName: bodyObj.vendorName || "Global Trader Store",
            image: bodyObj.image,
            title: bodyObj.title,
            subtitle: bodyObj.subtitle || "",
            pricingTier: bodyObj.pricingTier || "Frontpage Premium Hero",
            durationDays: bodyObj.durationDays || 7,
            feeUSD: bodyObj.feeUSD || 150,
            status: "pending",
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'hero-campaigns', campId), newCampaign);
          return jsonResponse(newCampaign, 201);
        }
      }
    }

    // 8. REPORTS
    if (pathname === '/api/reports/sales') {
      const orderList = await getCollectionDocs('orders', initialOrders);
      const report: any[] = [];
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      let startValue = 4200;

      for (let i = 0; i < 7; i++) {
        const daySeed = (i + 1) * 311;
        const computedSales = startValue + (daySeed % 700) - (daySeed % 300);
        const computedOrders = Math.floor(computedSales / 140);
        report.push({
          date: days[i],
          sales: computedSales,
          orders: computedOrders,
          revenue: computedSales - (computedSales * 0.15)
        });
        startValue = computedSales;
      }

      const currentTotal = orderList.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      const currentCount = orderList.length;
      report[6] = {
        date: "Sun (Today)",
        sales: currentTotal + 1580,
        orders: currentCount + 12,
        revenue: (currentTotal + 1580) * 0.82
      };

      return jsonResponse(report);
    }

    // 9. CHAT ENDPOINT (GEMINI Fallback Support with real REST Client)
    if (pathname === '/api/gemini/chat') {
      const { message, chatHistory } = bodyObj || {};
      
      // Look for a user's API key to trigger real Gemini endpoints directly from the browser
      let clientApiKey = '';
      try {
        // First try the Vite environment variable
        clientApiKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY || '';
      } catch (e) {}

      try {
        // Also query the custom config document in Firestore
        const docRef = doc(db, 'config', 'delivery');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.geminiApiKey) {
            clientApiKey = data.geminiApiKey;
          }
        }
      } catch (errKey) {
        console.warn("Could not retrieve client-side geminiApiKey from Config collection:", errKey);
      }

      if (clientApiKey && clientApiKey !== "MY_GEMINI_API_KEY" && clientApiKey.trim() !== '') {
        console.log("Client-side fallback detected active Gemini credentials. Starting live request...");
        try {
          const dbProducts = await getCollectionDocs('products', initialProducts);
          const dbCoupons = await getCollectionDocs('coupons', initialCoupons);

          const productCatalogBrief = dbProducts.map(p => 
            `- ID: "${p.id}", Name: "${p.title}", Price: $${p.price}, Rating: ${p.rating}/5, Stock: ${p.stock}, Brand: "${p.brand}", Category: "${p.category}", Desc: "${p.description.substring(0, 140)}..."`
          ).join("\n");

          const activeCouponsBrief = dbCoupons.map(c => 
            `- Code: "${c.code}", Discount: ${c.value} (${c.discountType}), Min Spend: $${c.minSpend}`
          ).join("\n");

          const systemPrompt = `You are a helpful, professional, and sophisticated AI Sales Assistant & Shopping Expert at SuuqHub (Smart Market Place) Store.
Your mission is to welcome users, understand their shopping goals, and advise them based on the true real-time inventory below.

AVAILABLE INVENTORY (Direct Recommendations available):
${productCatalogBrief}

ACTIVE PROMO COUPONS:
${activeCouponsBrief}

CRITICAL COGNITIVE GUIDELINE:
- Never recommend products that do not exist above.
- If a user asks for something we do not carry, explain politely and suggest our closest alternative.
- Keep your tone elegant, concise, and helpful. Use bold text for product names.
- At the end of your response, ALWAYS output a structured JSON array on its own line prefixed with ###REC_IDS### containing the IDs of products that match their current search, or empty array if none. For example: "###REC_IDS###[\\\"prod-headphones\\\", \\\"prod-watch\\\"]"
`;

          const contents: any[] = [];
          if (chatHistory && Array.isArray(chatHistory)) {
            chatHistory.forEach(item => {
              contents.push({
                role: item.sender === "user" ? "user" : "model",
                parts: [{ text: item.text }]
              });
            });
          }
          contents.push({
            role: "user",
            parts: [{ text: message }]
          });

          let responseText = "";
          let success = false;

          // Try gemini-3.5-flash first, fallback to lite if congested
          for (const model of ["gemini-3.5-flash", "gemini-3.1-flash-lite"]) {
            try {
              const res = await originalFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${clientApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents,
                  systemInstruction: {
                    parts: [{ text: systemPrompt }]
                  },
                  generationConfig: {
                    temperature: 0.7
                  }
                })
              });
              if (res.ok) {
                const resData = await res.json();
                responseText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (responseText) {
                  success = true;
                  break;
                }
              } else {
                console.warn(`Browser fallback direct query to ${model} failed: style status code ${res.status}`);
              }
            } catch (errQuery) {
              console.warn(`Browser fallback query error for model ${model}:`, errQuery);
            }
          }

          if (success) {
            let generatedRecommendations: string[] = [];
            if (responseText.includes("###REC_IDS###")) {
              try {
                const parts = responseText.split("###REC_IDS###");
                const jsonStr = parts[parts.length - 1].trim();
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                  generatedRecommendations = parsed;
                }
              } catch (err) {
                console.warn("Failed to parse recommended product IDs on client-side browser execution:", err);
              }
            }
            const reply = responseText.split("###REC_IDS###")[0].trim();
            return jsonResponse({ reply, generatedRecommendations });
          }
        } catch (errLiveCall) {
          console.error("Direct browser-based Gemini API REST call failed, initiating keyboard fallback:", errLiveCall);
        }
      }

      // 100% Client-side static keyword matching fallback (triggered if no API key is set or Google servers are unreachable)
      let reply = "Hello! I am your Apex AI Personal Assistant. What can I help you find?";
      const normalized = message?.toLowerCase() || '';
      
      const rawProducts = await getCollectionDocs('products', initialProducts);
      const matchedHeadphone = rawProducts.find(p => p.id === 'prod-headphones');
      const headphonePrice = matchedHeadphone ? `$${matchedHeadphone.price}` : '$299';
      const matchedWatch = rawProducts.find(p => p.id === 'prod-watch');
      const watchPrice = matchedWatch ? `$${matchedWatch.price}` : '$349';

      if (normalized.includes("headphone") || normalized.includes("audio") || normalized.includes("music")) {
        reply = `I highly recommend the **Aura Pro Adaptive ANC Headphones** (${headphonePrice}). They feature industry-leading Adaptive Noise Cancelling and 40-hour high-fidelity battery. They are available in Black, Silver, or Gold finishes!`;
      } else if (normalized.includes("watch") || normalized.includes("sport") || normalized.includes("gps")) {
        reply = `Our premier choice is the **Horizon GPS Smart Watch-X** (${watchPrice}). It features Grade 5 titanium, blood-oxygen sensors, always-on AMOLED, and dual GNSS tracking channels!`;
      } else if (normalized.includes("backpack") || normalized.includes("bag") || normalized.includes("travel")) {
        reply = "The **Nomad Roll-Top Weatherproof Backpack** ($95) is a customer bestseller! It extends beautifully from 28L to 40L, sewn in genuine 1000D Cordura nylon.";
      } else if (normalized.includes("sale") || normalized.includes("coupon") || normalized.includes("discount")) {
        reply = "You can apply coupon **SUUQ10** to get 10% off any order above $50, or **SUPERGIFT** for an instant $25 discount on orders over $150!";
      } else if (normalized.includes("chair") || normalized.includes("furniture") || normalized.includes("work")) {
        reply = "For ultimate spinal care at your desk, try our **Elysium Premium Ergonomic Mesh Chair** ($380). Includes premium self-regulating lumbar tracking and a breathable Arctic Mesh seat.";
      } else {
        reply = "I would be happy to help you shop our exclusive multi-vendor collections! Let me know if you are looking for top-tier wearable electronics, durable travel fashion, ergonomic living furniture, or organic skin care.";
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      return jsonResponse({ reply, generatedRecommendations: ["prod-headphones", "prod-watch"] });
    }

    // Default 404 block
    return jsonResponse({ error: "Route mock not found" }, 404);

  } catch (err: any) {
    console.error("Direct client-side backend operations failure:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed client-only operation" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Safely register our customFetch handler globally on the window context
try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Direct definition of window.fetch failed, trying prototype registration...", e);
  try {
    Object.defineProperty(Window.prototype, 'fetch', {
      value: customFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (protoErr) {
    console.error("Failed to inject global apiFallback fetch handler:", protoErr);
  }
}
