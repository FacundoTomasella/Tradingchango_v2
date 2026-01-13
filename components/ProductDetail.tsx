import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getProductHistory } from '../services/supabase';
import { Product, PriceHistory } from '../types';

interface ProductDetailProps {
  productId: number;
  onClose: () => void;
  onFavoriteToggle: (id: number) => void;
  isFavorite: boolean;
  products: Product[];
  theme: 'light' | 'dark';
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onClose, onFavoriteToggle, isFavorite, products, theme }) => {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [days, setDays] = useState(90); // Default to 3M
  const [loading, setLoading] = useState(true);

  const product = products.find(p => p.id === productId);

  useEffect(() => {
    if (product) {
      setLoading(true);
      getProductHistory(product.nombre, 365).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [product]);

  const STORES = [
    { name: "COTO", key: 'p_coto', url: 'url_coto', color: "#f23645" },
    { name: "CARREFOUR", key: 'p_carrefour', url: 'url_carrefour', color: "#2962ff" },
    { name: "DIA", key: 'p_dia', url: 'url_dia', color: "#f23645" },
    { name: "JUMBO", key: 'p_jumbo', url: 'url_jumbo', color: "#00c853" },
    { name: "MAS ONLINE", key: 'p_masonline', url: 'url_masonline', color: "#00c853" }
  ] as const;

  const chartData = useMemo(() => {
    const filtered = history.filter(h => {
        const hDate = new Date(h.fecha);
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - days);
        return hDate >= limitDate;
    });
    return filtered.map(h => ({
      date: new Date(h.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      price: h.precio_minimo,
      store: h.supermercado
    }));
  }, [history, days]);

  const minPrice = useMemo(() => {
    if (!product) return 0;
    const prices = [product.p_coto, product.p_carrefour, product.p_dia, product.p_jumbo, product.p_masonline].filter(p => p > 0);
    return Math.min(...prices);
  }, [product]);

  const bestStoreName = useMemo(() => {
    if (!product) return "";
    const storeMap = { p_coto: "COTO", p_carrefour: "CARREFOUR", p_dia: "DIA", p_jumbo: "JUMBO", p_masonline: "MAS ONLINE" };
    for (const [key, name] of Object.entries(storeMap)) {
      if ((product as any)[key] === minPrice) return name;
    }
    return "MERCADO";
  }, [product, minPrice]);

  const avgPrice = useMemo(() => {
    if (!product) return 0;
    const prices = [product.p_coto, product.p_carrefour, product.p_dia, product.p_jumbo, product.p_masonline].filter(p => p > 0);
    return prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  }, [product]);

  const variation = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0].price;
    const end = chartData[chartData.length - 1].price;
    const diff = ((end - start) / start) * 100;
    return diff.toFixed(1);
  }, [chartData]);

  const trendColor = useMemo(() => {
    if (!variation) return "#00c853";
    return parseFloat(variation) > 0 ? "#f23645" : "#00c853";
  }, [variation]);

  if (!product) return null;
  const format = (n: number) => new Intl.NumberFormat('es-AR').format(n);

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/60 md:backdrop-blur-sm">
      <div 
        className="w-full md:max-w-xl h-full md:h-auto md:max-h-[95vh] bg-white dark:bg-black md:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Navbar Detalle */}
        <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-[#121212]">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-black dark:text-white"><i className="fa-solid fa-arrow-left text-xl"></i></button>
            <span className="font-bold text-base tracking-tight text-black dark:text-white uppercase font-mono">{product.ticker}</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => onFavoriteToggle(product.id)} className={`text-xl ${isFavorite ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}><i className="fa-solid fa-cart-shopping"></i></button>
            <button className="text-xl text-black dark:text-white" onClick={() => navigator.share({ title: 'TradingChango', text: `Precio de ${product.nombre}`, url: window.location.href })}><i className="fa-solid fa-arrow-up-from-bracket"></i></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Header Producto */}
          <div className="flex gap-5 items-start mb-6">
            <div className="w-28 h-28 bg-white rounded-2xl border border-slate-100 dark:border-[#2a2a2a] flex-shrink-0 flex items-center justify-center p-2 overflow-hidden shadow-sm">
              <img 
                src={product.imagen_url || 'https://via.placeholder.com/150?text=No+Image'} 
                alt={product.nombre} 
                className="w-full h-full object-contain"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image')}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-black dark:text-white leading-tight tracking-tighter mb-1">{product.nombre}</h1>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                MEJOR PRECIO HOY EN {bestStoreName}
              </div>
              <div className="text-4xl font-mono font-bold tracking-tighter text-black dark:text-white">
                $ {format(minPrice)}
              </div>
            </div>
          </div>

          {/* Precio Promedio Cápsula */}
          <div className="mb-8">
            <div className="bg-[#f1f3f6] dark:bg-[#1e222d] border border-slate-100 dark:border-[#2a2e39] rounded-lg px-4 py-2 inline-flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#b2b5be] uppercase tracking-widest">Precio promedio:</span>
              <span className="font-mono font-bold text-black dark:text-white text-[13px]">$ {format(avgPrice)}</span>
            </div>
          </div>

          {/* Selectores de Rango */}
          <div className="flex gap-1.5 mb-8 justify-between md:justify-start">
            {[7, 15, 30, 90, 180, 365].map(d => (
              <button 
                key={d} 
                onClick={() => setDays(d)} 
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${days === d ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-[#1e222d] text-slate-400 dark:text-[#b2b5be] border-slate-200 dark:border-[#363a45]'}`}
              >
                {d === 7 ? '7D' : d === 15 ? '15D' : d === 30 ? '1M' : d === 90 ? '3M' : d === 180 ? '6M' : '1Y'}
              </button>
            ))}
          </div>

          {/* Gráfico */}
          <div className="mb-10">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white mb-1">GRÁFICO DE TENDENCIAS</h3>
            <div className={`text-[13px] font-bold mb-5 ${variation && parseFloat(variation) > 0 ? 'text-[#f23645]' : 'text-[#00c853]'}`}>
              {variation ? `${parseFloat(variation) > 0 ? '+' : ''}${variation}% últimos días` : '- 0.0%'}
            </div>
            
            <div className="h-72 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center font-mono text-[10px] text-slate-400 animate-pulse">ANALIZANDO MERCADO...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={trendColor} stopOpacity={0.1}/><stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'transparent' : '#f1f5f9'} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} minTickGap={40} />
                    <YAxis orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} tickFormatter={v => `$${format(v)}`} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{backgroundColor: theme === 'dark' ? '#000' : '#fff', borderRadius: '8px', border: '1px solid #333', padding: '10px'}}
                      labelStyle={{fontSize: '9px', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', color: '#94a3b8'}}
                      itemStyle={{fontSize: '13px', fontWeight: '800', fontFamily: 'Roboto Mono', color: theme === 'dark' ? '#fff' : '#000'}}
                      formatter={v => [`$${format(v as number)}`]}
                    />
                    <Area type="monotone" dataKey="price" stroke={trendColor} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Comparación */}
          <section className="mb-20">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white mb-6">COMPARACION DE MERCADO</h3>
            <div className="space-y-4">
              {STORES.map((s) => {
                const price = (product as any)[s.key];
                if (!price || price === 0) return null;
                const isBest = price === minPrice;
                const of = product.oferta_gondola ? (typeof product.oferta_gondola === 'string' ? JSON.parse(product.oferta_gondola)[s.name.toLowerCase()] : product.oferta_gondola[s.name.toLowerCase()]) : null;

                return (
                  <div key={s.name} className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-[#2a2a2a] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}}></div>
                      <span className="text-sm font-bold text-black dark:text-white uppercase tracking-tight">{s.name}</span>
                      {of && (
                        <span className="bg-[#00a650] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
                          {of}
                        </span>
                      )}
                    </div>
                    <div className={`font-mono text-base font-bold ${isBest ? 'text-[#00c853]' : 'text-black dark:text-white'}`}>
                      ${format(price)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;