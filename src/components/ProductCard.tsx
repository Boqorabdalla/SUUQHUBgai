/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, Eye, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, translations } from '../utils';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  currency: 'USD' | 'EUR' | 'AED';
  lang: 'en' | 'ar' | 'es';
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product, color?: string, size?: string, qty?: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  lang,
  onViewDetails,
  onAddToCart,
  isWishlisted,
  onToggleWishlist
}) => {
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const t = translations[lang];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdding(true);
    // Select default color variant if available
    const defaultColor = product.variants?.colors?.[0]?.name;
    const defaultSize = product.variants?.sizes?.[0]?.name;
    
    setTimeout(() => {
      onAddToCart(product, defaultColor, defaultSize);
      setAdding(false);
    }, 400);
  };

  // Safe checks for badge listings
  const showNewBadge = product.isNewArrival || product.id === 'prod-watch';
  const showBestSellerBadge = product.isBestSeller || product.id === 'prod-headphones';
  const showSaleBadge = product.isFlashDeal || (product.discountPrice && product.discountPrice < product.price);
  const isOutOfStock = product.stock <= 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-white rounded-xl border border-slate-200 hover:border-indigo-400 overflow-hidden shadow-sm hover:shadow-md transition-all duration-250 flex flex-col h-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        id={`prod-card-${product.id}`}
      >
      {/* Badges layer */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {showSaleBadge && (
          <span className="bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
            FLASH SALE
          </span>
        )}
        {showBestSellerBadge && (
          <span className="bg-indigo-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
            Best Seller
          </span>
        )}
        {showNewBadge && (
          <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-100 shadow-sm">
            New
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-slate-100 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200">
            {t.outOfStock}
          </span>
        )}
      </div>

      {/* Wishlist Icon */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
        className="absolute top-3 right-3 z-10 bg-white/90 p-2 rounded text-slate-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm border border-slate-100"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Primary Image Container */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative pt-[100%] overflow-hidden bg-slate-50 cursor-pointer border-b border-slate-100"
      >
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Hover overlay with action icons */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
            className="p-3 rounded bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 transition cursor-pointer shadow-md"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="p-4 flex flex-col flex-grow text-left">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-1">
          {product.brand}
        </span>
        <h3 
          onClick={() => onViewDetails(product)}
          className="font-display font-semibold text-sm line-clamp-2 text-slate-800 group-hover:text-indigo-600 transition cursor-pointer mb-2 h-10 leading-tight"
        >
          {product.title}
        </h3>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center text-indigo-600">
            <Star className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
            <span className="text-xs font-semibold ml-1 text-slate-700">{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            ({product.ratingCount} {t.reviewsCount})
          </span>
        </div>

        {/* Price & Add to Cart row */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-col text-left">
            {product.discountPrice && product.discountPrice < product.price ? (
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-display font-extrabold text-rose-600">
                    {formatPrice(product.discountPrice, currency)}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    {formatPrice(product.price, currency)}
                  </span>
                </div>
                <span className="text-[10px] text-rose-500 font-mono font-bold tracking-wider">
                  SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                </span>
              </div>
            ) : (
              <span className="text-lg font-display font-extrabold text-slate-900">
                {formatPrice(product.price, currency)}
              </span>
            )}
            {product.stock <= 5 && !isOutOfStock && (
              <span className="text-[10px] text-amber-600 font-mono font-semibold mt-0.5">
                {t.lowStock} ({product.stock})
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={adding || isOutOfStock}
            className={`cursor-pointer px-3 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : adding
                ? 'bg-indigo-700 text-white scale-95'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-sm active:scale-95'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{adding ? '...' : t.addToCart}</span>
          </button>
        </div>
      </div>
    </motion.div>
  </>
  );
};

export default ProductCard;
