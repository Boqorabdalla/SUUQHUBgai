/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dynamic currency ratios
export const currencyExchange = {
  USD: 1,
  EUR: 0.92,
  AED: 3.67
};

export function formatPrice(usdAmount: number, currency: 'USD' | 'EUR' | 'AED' = 'USD'): string {
  const ratio = currencyExchange[currency] || 1;
  const computed = usdAmount * ratio;

  if (currency === 'AED') {
    return `${computed.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} AED`;
  } else if (currency === 'EUR') {
    return `€${computed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${computed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const translations = {
  en: {
    catalog: 'Catalog',
    shoppingCart: 'Shopping Cart',
    cartEmpty: 'Your shopping cart is currently empty. Explore our premium specifications and add items.',
    applyCoupon: 'Apply',
    couponPlaceholder: 'COUPON CODE',
    subtotal: 'Subtotal base',
    discount: 'Coupon savings',
    shipping: 'Courier shipping cost',
    tax: 'Vat sales tax',
    estimatedTotal: 'Total Payable',
    checkout: 'Proceed to Checkout',
    backToCatalog: 'Back to products',
    orderHistory: 'Order History',
    supportHelpdesk: 'Support Helpdesk',
    profileSettings: 'Addresses & settings',
    reviewsCount: 'evaluations',
    outOfStock: 'OUT OF STOCK',
    lowStock: 'LOW STOCK',
    addToCart: 'Quick Add',
    sortBy: 'Sort by pricing',
    priceLowHigh: 'Price: Low to High',
    priceHighLow: 'Price: High to Low',
    customerRating: 'Verified rating',
    exploreAcoustics: 'Sleek. Performance. Multi-Vendor Smart Hub Marketplace.',
    storeName: 'SUUQHUB',
    searchPlaceholder: 'Search products, electronics...',
    vendorPortal: 'Vendor Portal',
    adminConsole: 'Admin Center',
    customerDashboard: 'My Account'
  },
  ar: {
    catalog: 'القائمة',
    shoppingCart: 'عربة التسوق',
    cartEmpty: 'عربة التسوق فارغة حالياً. ابدأ بإضافة بعض السلع المميزة.',
    applyCoupon: 'تطبيق',
    couponPlaceholder: 'كود الخصم',
    subtotal: 'المجموع الفرعي',
    discount: 'توفير الكوبون',
    shipping: 'تكلفة شحن البريد',
    tax: 'ضريبة القيمة المضافة',
    estimatedTotal: 'الإجمالي المقدر',
    checkout: 'تابع الدفع الآمن',
    backToCatalog: 'الرجوع للمنتجات',
    orderHistory: 'سجل الطلبات',
    supportHelpdesk: 'مركز الدعم الفني',
    profileSettings: 'Profile settings',
    reviewsCount: 'تفييمات',
    outOfStock: 'نفذت الكمية',
    lowStock: 'كمية محدودة',
    addToCart: 'إضافة سريعة',
    sortBy: 'ترتيب حسب السعر',
    priceLowHigh: 'السعر: من الأقل للأعلى',
    priceHighLow: 'السعر: من الأعلى للأقل',
    customerRating: 'التقييمات المعتمدة',
    exploreAcoustics: 'سوق ذكي متطور لخدمة بائعين متعددين.',
    storeName: 'SUUQHUB',
    searchPlaceholder: 'ابحث عن السلع والإلكترونيات...',
    vendorPortal: 'بوابة البائع',
    adminConsole: 'لوحة المدير',
    customerDashboard: 'حسابي'
  },
  es: {
    catalog: 'Catálogo',
    shoppingCart: 'Cesta de Compra',
    cartEmpty: 'Su carrito está vacío. Añada productos de alta gama.',
    applyCoupon: 'Prueba',
    couponPlaceholder: 'CÓDIGO',
    subtotal: 'Total parcial',
    discount: 'Cupón descuento',
    shipping: 'Costo envío',
    tax: 'Iva tasa',
    estimatedTotal: 'Total pagadero',
    checkout: 'Pasar al pago',
    backToCatalog: 'Volver a productos',
    orderHistory: 'Historial pedidos',
    supportHelpdesk: 'Atención cliente',
    profileSettings: 'Profile settings',
    reviewsCount: 'comentarios',
    outOfStock: 'AGOTADO',
    lowStock: 'STOCK LIMITADO',
    addToCart: 'Añadir',
    sortBy: 'Ordenar por',
    priceLowHigh: 'Precio: Menor a Mayor',
    priceHighLow: 'Precio: Mayor a Menor',
    customerRating: 'Valoración media',
    exploreAcoustics: 'Plataforma avanzada de mercado de múltiples proveedores.',
    storeName: 'SUUQHUB',
    searchPlaceholder: 'Buscar productos...',
    vendorPortal: 'Panel Proveedor',
    adminConsole: 'Consola Admin',
    customerDashboard: 'Mi Cuenta'
  }
};
