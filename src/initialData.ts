/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Coupon, User } from './types';

export const initialProducts: Product[] = [
  {
    id: 'prod-headphones',
    title: 'Aura Pro Adaptive ANC Headphones',
    description: 'Immerse yourself in rich, high-fidelity sound. Featuring adaptive active noise cancelling, custom dynamic drivers, spatial audio tracking, and ultra-plush memory foam cups for 40 hours of continuous elite acoustics.',
    price: 299,
    rating: 4.8,
    ratingCount: 142,
    category: 'Electronics',
    subcategory: 'Audio',
    tags: ['wireless', 'anc', 'premium', 'audio'],
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'Acoustix',
    sku: 'AC-AUR-PRO',
    stock: 25,
    isActive: true,
    isApproved: true,
    isFeatured: true,
    isBestSeller: true,
    isFlashDeal: true,
    discountPrice: 249,
    variants: {
      colors: [
        { id: 'col-black', name: 'Stealth Black', priceModifier: 0, stock: 12 },
        { id: 'col-silver', name: 'Alabaster Silver', priceModifier: 15, stock: 8 },
        { id: 'col-gold', name: 'Sovereign Gold', priceModifier: 30, stock: 5 }
      ]
    },
    specifications: {
      'Driver Size': '40mm Dynamic',
      'Battery Life': 'Up to 40 Hours',
      'Bluetooth Version': '5.3 LE Audio',
      'Frequency Response': '4Hz - 40,000Hz',
      'Charging Port': 'USB-C Fast Charge'
    }
  },
  {
    id: 'prod-watch',
    title: 'Horizon GPS Smart Watch-X',
    description: 'An athletic companion designed for resilience. Engineered with dual-band multi-GPS tracking, ambient heart/pulse screening, blood-oxygen saturation feedback, offline maps compilation, and an indestructible titanium frame.',
    price: 349,
    rating: 4.7,
    ratingCount: 98,
    category: 'Electronics',
    subcategory: 'Wearables',
    tags: ['fitness', 'gps', 'smartwatch', 'waterproof'],
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'PulseTech',
    sku: 'PT-HOR-X',
    stock: 18,
    isActive: true,
    isApproved: true,
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,
    isFlashDeal: true,
    discountPrice: 299,
    variants: {
      colors: [
        { id: 'col-gray', name: 'Titanium Gray', priceModifier: 0, stock: 10 },
        { id: 'col-orange', name: 'Amber Burst', priceModifier: 0, stock: 8 }
      ],
      sizes: [
        { id: 'sz-42mm', name: '42mm Dial', priceModifier: -20, stock: 8 },
        { id: 'sz-46mm', name: '46mm Dial', priceModifier: 0, stock: 10 }
      ]
    },
    specifications: {
      'Frame Material': 'Grade 5 Aerospace Titanium',
      'Water Resistance': '100m (10 ATM)',
      'Screen Type': '1.43" AMOLED Always-On',
      'GPS Type': 'Dual-Band GNSS (L1+L5)',
      'Sensors': 'Optical heart rate, SpO2, Barometer, Compass'
    }
  },
  {
    id: 'prod-keyboard',
    title: 'Veloce Pro Gasket Mechanical Keyboard',
    description: 'Elegance and acoustic pure satisfaction. This premium hot-swappable mechanical keyboard features CNC machined aluminum casing, custom-lubed linear switches, custom foam sound dampening, and vibrant RGB programmable plates.',
    price: 159,
    rating: 4.9,
    ratingCount: 61,
    category: 'Electronics',
    subcategory: 'Accessories',
    tags: ['keyboard', 'gaming', 'office', 'custom'],
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'Veloce',
    sku: 'VL-PRO-MEC',
    stock: 14,
    isActive: true,
    isApproved: true,
    isTrending: true,
    isFlashDeal: true,
    discountPrice: 119,
    variants: {
      colors: [
        { id: 'col-white', name: 'Arctic Frost White', priceModifier: 0, stock: 8 },
        { id: 'col-navy', name: 'Midnight Navy Blue', priceModifier: 10, stock: 6 }
      ]
    },
    specifications: {
      'Form Factor': '75% Layout',
      'Mount Style': 'Double Gasket Mount',
      'Switches': 'Custom Pre-lubed Linear (45g actuate)',
      'Connectivity': 'Tri-mode (USB-C/2.4Ghz/Bluetooth 5.1)',
      'Hot-swap Support': '3-pin and 5-pin MX compatible'
    }
  },
  {
    id: 'prod-backpack',
    title: 'Nomad Roll-Top Weatherproof Backpack',
    description: 'Designed to traverse borders, wilderness, and concrete jungles. Meticulously sewn with ballistic grade Cordura nylon, structured expandable 40L capacity, security pass-through layers, and a fully padded 16" tech sleeve.',
    price: 95,
    rating: 4.6,
    ratingCount: 114,
    category: 'Fashion',
    subcategory: 'Bags',
    tags: ['waterproof', 'travel', 'fashion', 'outdoor'],
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'Nomad Gear',
    sku: 'NM-BP-EXP',
    stock: 35,
    isActive: true,
    isApproved: true,
    isBestSeller: true,
    variants: {
      colors: [
        { id: 'col-black', name: 'Stealth Black', priceModifier: 0, stock: 15 },
        { id: 'col-camel', name: 'Safari Tan', priceModifier: 0, stock: 12 },
        { id: 'col-forest', name: 'Forest Green', priceModifier: 0, stock: 8 }
      ]
    },
    specifications: {
      'Volume Capacity': '28L expandable to 40L',
      'Laptop Protection': 'Padded sleeve fits up to 16" laptop',
      'Material': '1000D Cordura Waterproof Nylon',
      'Weight': '1.2 kg',
      'Zipper System': 'YKK Aquaguard zippers'
    }
  },
  {
    id: 'prod-sweater',
    title: 'Monarch Brushed Cashmere Knit',
    description: 'The epitome of warm luxury. Extracted from sustainably-harvested Grade-A Mongolian cashmere fiber, brushed 3 times for premium lightweight insulation and knitted in a soft structured ribs layout.',
    price: 135,
    rating: 4.7,
    ratingCount: 55,
    category: 'Fashion',
    subcategory: 'Apparel',
    tags: ['comfort', 'premium', 'winter', 'wool'],
    image: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'Monarch',
    sku: 'MN-CSH-SWR',
    stock: 22,
    isActive: true,
    isApproved: true,
    isNewArrival: true,
    variants: {
      colors: [
        { id: 'col-cream', name: 'Cream Alabaster', priceModifier: 0, stock: 8 },
        { id: 'col-charcoal', name: 'Slate Charcoal', priceModifier: 0, stock: 14 }
      ],
      sizes: [
        { id: 'sz-s', name: 'Small', priceModifier: 0, stock: 5 },
        { id: 'sz-m', name: 'Medium', priceModifier: 0, stock: 8 },
        { id: 'sz-l', name: 'Large', priceModifier: 0, stock: 9 }
      ]
    },
    specifications: {
      'Material': '100% Mongolian Cashmere Wool',
      'Weave Density': '12-Gauge Flat Knit',
      'Fibers Core': 'Grade A (15.5mc thickness)',
      'Care Guide': 'Dry clean only or cold hand wash'
    }
  },
  {
    id: 'prod-shoes',
    title: 'Stratus Breathable Running Shoes',
    description: 'Walk on air, sprint on clouds. Equipped with responsive Stratus-Pulse foam midfoot sole, highly porous woven knit canvas for maximal cooling, and high-friction rubber ridges designed mock-carbon traction board.',
    price: 110,
    rating: 4.5,
    ratingCount: 76,
    category: 'Fashion',
    subcategory: 'Footwear',
    tags: ['shoes', 'sports', 'running', 'comfort'],
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'CloudSprint',
    sku: 'CS-STR-RUN',
    stock: 30,
    isActive: true,
    isApproved: true,
    isTrending: true,
    isBestSeller: true,
    variants: {
      sizes: [
        { id: 'sz-us8', name: 'US 8', priceModifier: 0, stock: 10 },
        { id: 'sz-us9', name: 'US 9', priceModifier: 0, stock: 10 },
        { id: 'sz-us10', name: 'US 10', priceModifier: 0, stock: 10 }
      ]
    },
    specifications: {
      'Sole Tech': 'Stratus-Pulse Responsive Polymer',
      'Heel-to-Toe Drop': '8mm',
      'Weight': '240g (Single Size US 9)',
      'Canvas Knit': 'Recycled Poly-Knit Weave',
      'Arch Support': 'Neutral/Medium guidance'
    }
  },
  {
    id: 'prod-bottle',
    title: 'ThermaFlask Vacuum Copper Bottle',
    description: 'Keep your hydration crisp. Double-walled vacuum chamber, copper lined subcaps for superior warmth retention, food-grade 18/8 stainless rustless steel, and durable powder sand anti-scratch finish.',
    price: 36,
    rating: 4.8,
    ratingCount: 189,
    category: 'Living',
    subcategory: 'Hydration',
    tags: ['kitchen', 'insulated', 'water', 'reusable'],
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'Therma',
    sku: 'TH-FLK-COP',
    stock: 40,
    isActive: true,
    isApproved: true,
    isFeatured: true,
    variants: {
      colors: [
        { id: 'col-copper', name: 'Raw Copper Rose', priceModifier: 4, stock: 15 },
        { id: 'col-obsidian', name: 'Obsidian Matte Black', priceModifier: 0, stock: 25 }
      ]
    },
    specifications: {
      'Capacity Volume': '750ml (25 oz)',
      'Warmth Guard': 'Keeps cold up to 24 hours, hot up to 12 hours',
      'Steel Rating': '18/8 (304) Pro-Grade Stainless Steel',
      'BPA Level': '100% BPA and Phthalate Free'
    }
  },
  {
    id: 'prod-chair',
    title: 'Elysium Premium Ergonomic Mesh Chair',
    description: 'Align your thoughts by aligning your spine. A masterpiece of workspace safety. Self-regulating lumbar tracking backrest, high-density breathability weave, fully responsive 4D soft-grip arm rests, and heavy duty smooth roll nodes.',
    price: 380,
    rating: 4.8,
    ratingCount: 42,
    category: 'Living',
    subcategory: 'Office Furniture',
    tags: ['chair', 'chair-mesh', 'ergonomic', 'furniture'],
    image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'Elysium Space',
    sku: 'ES-ELY-MEC',
    stock: 12,
    isActive: true,
    isApproved: true,
    isTrending: true,
    isFlashDeal: true,
    discountPrice: 289,
    variants: {
      colors: [
        { id: 'col-charcoal', name: 'Midnight Charcoal', priceModifier: 0, stock: 8 },
        { id: 'col-white', name: 'Arctic Silver-White', priceModifier: 20, stock: 4 }
      ]
    },
    specifications: {
      'Weight Capacity': 'Up to 150 kg (330 lbs)',
      'Lumbar Support': 'Dual-pivot Adaptive Dynamic System',
      'Gas Lift Class': 'TUV Certified Class 4 Hydraulic',
      'Armrest Adjustments': '4D Pivotable height, rotation, slide, outward',
      'Casters Material': 'Simulated noise-reducing poly-urethane'
    }
  },
  {
    id: 'prod-diffuser',
    title: 'Aura Bamboo Ultrasonic Oil Diffuser',
    description: 'Transform your room atmosphere with gentle aromatic vibrations. Naturally harvested FSC bamboo wood shell, whisper quiet ultrasonic core mist oscillator, warm LED status node, and auto water shut-off sensor.',
    price: 55,
    rating: 4.6,
    ratingCount: 79,
    category: 'Beauty',
    subcategory: 'Wellness',
    tags: ['essential', 'home', 'wellness', 'bamboo'],
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
    ],
    brand: 'Aura Wellness',
    sku: 'AW-BAM-DIF',
    stock: 18,
    isActive: true,
    isApproved: true,
    variants: {
      colors: [
        { id: 'col-light', name: 'Natural Light Bamboo', priceModifier: 0, stock: 10 },
        { id: 'col-dark', name: 'Espresso Dark Walnut', priceModifier: 5, stock: 8 }
      ]
    },
    specifications: {
      'Water Capacity': '300 ml',
      'Oscillator Rate': '2.4MHz Ultrasonic Wave generator',
      'Working Duration': 'Up to 8 hours (Interval Mode)',
      'Area Coverage': '35 m² space',
      'Acoustic Pitch': '<24 dB ultra-quiet'
    }
  }
];

export const initialCoupons: Coupon[] = [
  { code: 'SUUQ10', discountType: 'percentage', value: 10, minSpend: 50, expiryDate: '2026-12-31', isActive: true },
  { code: 'SUPERGIFT', discountType: 'fixed', value: 25, minSpend: 150, expiryDate: '2026-12-31', isActive: true },
  { code: 'WELCOME5', discountType: 'percentage', value: 5, minSpend: 20, expiryDate: '2026-12-31', isActive: true }
];

export const initialUser: User = {
  id: 'usr-customer-01',
  name: 'Salem Al-Mansoori',
  email: 'salem@mideast.com',
  role: 'superadmin', // SuperAdmin allows switching roles in our dynamic preview UI!
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  language: 'en',
  currency: 'USD',
  addresses: [
    {
      id: 'addr-01',
      fullName: 'Salem Al-Mansoori',
      addressLine1: 'Villa 14, Al Bateen Area',
      addressLine2: 'Near Al Bateen Palace',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      zipCode: '00000',
      country: 'United Arab Emirates',
      phone: '+971 50 123 4567',
      isDefault: true
    }
  ],
  wishlist: ['prod-headphones', 'prod-keyboard']
};
