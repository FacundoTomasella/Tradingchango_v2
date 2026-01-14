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
  searchTerm?: string;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  onProductClick, 
  onFavoriteToggle, 
  isFavorite,
  isCartView,
  quantities,
  onUpdateQuantity,
  searchTerm
}) => {
  const format = (n: number) => new Intl.NumberFormat('es-AR').format(n);

  const getPromoBadges = (oferta: any) => {
    if (!oferta) return null;
    let ofertas: string[] = [];
    try {
      const obj = typeof oferta === 'string' ? JSON.parse(oferta) : oferta;
      Object.values(obj).forEach((v: any) => {
        const label = v.etiqueta || (typeof v === 'string' ? v : null);
        if (label && !ofertas.includes(label)) ofertas.push(label);
      });
    } catch (e) {
      if (typeof oferta === 'string') ofertas = [oferta];
    }
    return ofertas.length > 0 ? ofertas : null;
  };

  if (products.length === 0 && searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-[2rem] flex items-center justify-center text-neutral-500 mb-6 text-3xl">
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        <h3 className="text-lg font-black text-black dark:text-white mb-2 uppercase tracking-tighter">No se encontraron productos</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-500 font-medium leading-relaxed">Probá buscando con otras palabras o navegando por categorías.</p>
      </div>
    );
  }

  if (products.length === 0 && isCartView) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-10 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-neutral-50 dark:bg-neutral-900/50 rounded-[2.5rem] flex items-center justify-center text-neutral-500 mb-8 text-4xl">
          <i className="fa-solid fa-cart-shopping"></i>
        </div>
        <h3 className="text-xl font-black text-black dark:text-white mb-4 uppercase tracking-tighter">Tu chango está vacío</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-500 font-medium leading-relaxed max-w-[280px]">
          Agregá productos para comparar el total en los distintos supermercados y maximizar tu ahorro.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {products.map((p) => {
        const fav = isFavorite(p.id);
        const qty = quantities ? (quantities[p.id] || 1) : 1;
        const badges = getPromoBadges(p.oferta_gondola);

        return (
          <div 
            key={p.id} 
            onClick={() => onProductClick(p.id)}
            className="flex items-center justify-between px-[20px] py-[18px] bg-white dark:bg-black hover:bg-neutral-50 dark:hover:bg-neutral-900/30 cursor-pointer transition-colors"
          >
            <div className="flex-1 flex items-center justify-between pr-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="font-[800] text-black dark:text-white text-[16px] md:text-[17px] tracking-tight uppercase font-mono block">
                    {p.ticker || p.nombre.substring(0, 5).toUpperCase()}
                  </span>
                  {badges && badges.map((b, idx) => (
                    <span key={idx} className="bg-green-500 text-white text-[9px] font-[800] px-1.5 py-0.5 rounded-sm uppercase leading-none font-sans">
                      {b}
                    </span>
                  ))}
                </div>
                <span className="text-[13px] md:text-[14px] font-medium text-neutral-600 dark:text-neutral-400 line-clamp-1 font-sans">
                  {p.nombre}
                </span>
              </div>

              <div className="text-right flex flex-col items-end min-w-[100px]">
                <span className="font-mono font-[700] text-black dark:text-white text-[17px] md:text-[18px]">
                  ${format(p.stats.min)}
                </span>
                <span className={`font-mono text-[12px] font-[700] mt-0.5 ${p.stats.trendClass}`}>
                  {p.stats.icon} {p.stats.spread}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isCartView && onUpdateQuantity && (
                <div 
                  className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-900 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => onUpdateQuantity(p.id, -1)} className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white px-2 font-black text-base">-</button>
                  <span className="font-mono text-sm font-black min-w-[20px] text-center text-black dark:text-white">{qty}</span>
                  <button onClick={() => onUpdateQuantity(p.id, 1)} className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white px-2 font-black text-base">+</button>
                </div>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteToggle(p.id);
                }}
                className={`transition-all flex items-center justify-center active:scale-90 p-2 ${fav ? 'text-star-gold' : 'text-neutral-400'}`}
              >
                <i className="fa-solid fa-cart-shopping text-[20px]"></i>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;