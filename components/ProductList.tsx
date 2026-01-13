import React from 'react';
import { Product } from '../types';

interface ProductWithStats extends Product {
  stats: {
    min: number;
    spread: string;
    trendClass: string;
    icon: string;
    isUp: boolean;
    isDown: boolean;
  };
}

interface ProductListProps {
  products: ProductWithStats[];
  onProductClick: (id: number) => void;
  onFavoriteToggle: (id: number) => void;
  isFavorite: (id: number) => boolean;
  isCartView?: boolean;
  quantities?: Record<number, number>;
  onUpdateQuantity?: (id: number, delta: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  onProductClick, 
  onFavoriteToggle, 
  isFavorite,
  isCartView,
  quantities,
  onUpdateQuantity
}) => {
  const format = (n: number) => new Intl.NumberFormat('es-AR').format(n);

  const getPromoLabel = (oferta: any) => {
    if (!oferta) return null;
    // Si es un string directo (legacy)
    if (typeof oferta === 'string') return oferta;
    // Si es un JSON de ofertas por super
    const values = Object.values(oferta).filter(v => typeof v === 'string' && v.length > 0);
    return values.length > 0 ? values[0] as string : null;
  };

  return (
    <div className="divide-y divide-slate-100 dark:divide-[#121212]">
      {products.map((p) => {
        const fav = isFavorite(p.id);
        const qty = quantities ? (quantities[p.id] || 1) : 1;
        const promoLabel = getPromoLabel(p.oferta_gondola);

        return (
          <div 
            key={p.id} 
            onClick={() => onProductClick(p.id)}
            className="flex items-center justify-between p-4 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-[#080808] cursor-pointer transition-colors"
          >
            <div className="flex-1 flex items-center justify-between pr-4">
              {/* Left Side: Ticker and Name */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-black dark:text-white text-[15px] tracking-tight uppercase font-mono">
                    {p.ticker || p.nombre.substring(0, 5).toUpperCase()}
                  </span>
                  {promoLabel && (
                    <span className="bg-[#00a650] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
                      {promoLabel}
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1">
                  {p.nombre}
                </span>
              </div>

              {/* Right Side: Price and Variation */}
              <div className="text-right flex flex-col items-end min-w-[100px]">
                <span className="font-mono font-bold text-black dark:text-white text-base">
                  ${format(p.stats.min)}
                </span>
                <span className={`font-mono text-[11px] font-bold mt-0.5 ${p.stats.trendClass}`}>
                  {p.stats.icon} {p.stats.spread}%
                </span>
              </div>
            </div>

            {/* Actions: Quantity or Cart Icon */}
            <div className="flex items-center gap-3">
              {isCartView && onUpdateQuantity && (
                <div 
                  className="flex items-center gap-3 bg-slate-50 dark:bg-[#121212] px-2 py-1 rounded-lg border border-slate-200 dark:border-[#2a2a2a]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => onUpdateQuantity(p.id, -1)} className="text-slate-400 hover:text-black dark:hover:text-white font-bold px-1">-</button>
                  <span className="font-mono text-sm font-bold min-w-[15px] text-center text-black dark:text-white">{qty}</span>
                  <button onClick={() => onUpdateQuantity(p.id, 1)} className="text-slate-400 hover:text-black dark:hover:text-white font-bold px-1">+</button>
                </div>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteToggle(p.id);
                }}
                className={`text-xl transition-transform active:scale-90 ${fav ? 'text-black dark:text-white' : 'text-slate-300 dark:text-slate-800'}`}
              >
                <i className="fa-solid fa-cart-shopping"></i>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;