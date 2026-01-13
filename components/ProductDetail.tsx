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
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const product = products.find(p => p.id === productId);

  useEffect(() => {
    if (product) {
      setLoading(true);
      getProductHistory(product.nombre, days).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [product, days]);

  const STORES = [
    { name: "COTO", key: 'p_coto', url: 'url_coto', color: "#ef4444" },
    { name: "CARREFOUR", key: 'p_carrefour', url: 'url_carrefour', color: "#3b82f6" },
    { name: "DIA", key: 'p_dia', url: 'url_dia', color: "#ef4444" },
    { name: "JUMBO", key: 'p_jumbo', url: 'url_jumbo', color: "#22c55e" },
    { name: "MAS ONLINE", key: 'p_masonline', url: 'url_masonline', color: "#22c55e" }
  ] as const;

  const chartData = useMemo(() => {
    return history.map(h => ({
      date: new Date(h.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      price: h.precio_minimo,
      store: h.supermercado
    }));
  }, [history]);

  const trendColor = useMemo(() => {
    if (chartData.length < 2) return "#10b981";
    const start = chartData[0].price;
    const end = chartData[chartData.length - 1].price;
    return end > start ? "#ef4444" : "#10b981";
  }, [chartData]);

  const variationPercent = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0].price;
    const end = chartData[chartData.length - 1].price;
    const diff = ((end - start) / start) * 100;
    return diff.toFixed(1);
  }, [chartData]);

  const minPrice = useMemo(() => {
    if (!product) return 0;
    const prices = [product.p_coto, product.p_carrefour, product.p_dia, product.p_jumbo, product.p_masonline].filter(p => p > 0);
    return Math.min(...prices);
  }, [product]);

  const avgPrice = useMemo(() => {
    if (!product) return 0;
    const prices = [product.p_coto, product.p_carrefour, product.p_dia, product.p_jumbo, product.p_masonline].filter(p => p > 0);
    return prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  }, [product]);

  if (!product) return null;
  const format = (n: number) => new Intl.NumberFormat('es-AR').format(n);

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/60 md:backdrop-blur-sm transition-all duration-300">
      <div 
        className="w-full md:max-w-2xl h-full md:h-auto md:max-h-[90vh] bg-white dark:bg-black md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 -ml-2 text-black dark:text-white"><i className="fa-solid fa-arrow-left text-xl"></i></button>
            <span className="font-mono font-black text-[10px] uppercase tracking-widest text-slate-400">{product.ticker}</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => onFavoriteToggle(product.id)} className={`text-xl ${isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'}`}><i className="fa-solid fa-cart-shopping"></i></button>
            <button className="text-xl text-black dark:text-white" onClick={() => navigator.share({ title: 'TradingChango', text: `Precio de ${product.nombre}`, url: window.location.href })}><i className="fa-solid fa-share-nodes"></i></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tighter leading-tight">{product.nombre}</h1>
            <div className="flex flex-col gap-1">
              <div className="text-5xl font-mono font-black tracking-tighter text-black dark:text-white">${format(minPrice)}</div>
              <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5 w-fit">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Promedio:</span>
                <span className="font-mono font-bold text-sm text-black dark:text-white">${format(avgPrice)}</span>
              </div>
            </div>
          </div>

          <section className="mb-10 bg-white dark:bg-black rounded-3xl border border-slate-100 dark:border-slate-900 p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Gráfico de Tendencias</h3>
                {variationPercent && <span className={`text-[10px] font-black uppercase ${parseFloat(variationPercent) > 0 ? 'text-red-500' : 'text-green-500'}`}>{parseFloat(variationPercent) > 0 ? '▲' : '▼'} {variationPercent}% en este periodo</span>}
              </div>
              <div className="flex gap-1">
                {[7, 30, 180, 365].map(d => (
                  <button key={d} onClick={() => setDays(d)} className={`px-3 py-2 text-[9px] font-black rounded-lg uppercase tracking-widest ${days === d ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                    {d === 7 ? '7D' : d === 30 ? '1M' : d === 180 ? '6M' : '1A'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64 md:h-80 w-full">
              {loading ? <div className="h-full flex items-center justify-center text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">Analizando...</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={trendColor} stopOpacity={0.15}/><stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'transparent' : '#f1f5f9'} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} minTickGap={30} />
                    <YAxis orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} tickFormatter={v => `$${format(v)}`} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{backgroundColor: theme === 'dark' ? '#000' : '#fff', borderRadius: '12px', border: '1px solid #333', padding: '12px'}}
                      labelStyle={{fontWeight: '900', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase'}}
                      itemStyle={{fontSize: '14px', fontWeight: '900', fontFamily: 'Roboto Mono', color: theme === 'dark' ? '#fff' : '#000'}}
                      formatter={v => [`$${format(v as number)}`, `Min en el periodo`]}
                    />
                    <Area type="monotone" dataKey="price" stroke={trendColor} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="pb-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-900 pb-2">Comparativa de Mercado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STORES.map((s) => {
                const price = (product as any)[s.key];
                const isBest = price === minPrice && price > 0;
                return (
                  <div key={s.name} className="flex flex-col p-5 bg-white dark:bg-black border border-slate-100 dark:border-slate-900 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}}></div>
                        <span className="text-xs font-black text-black dark:text-white uppercase tracking-widest">{s.name}</span>
                      </div>
                      <div className={`font-mono text-sm font-black px-3 py-1 rounded-lg ${isBest ? 'bg-green-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-black dark:text-white'}`}>
                        {price > 0 ? `$${format(price)}` : 'Agotado'}
                      </div>
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