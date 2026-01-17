import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import {
  supabase, 
  getProducts, 
  getPriceHistory, 
  getProfile, 
  getConfig, 
  getBenefits,
  getSavedCarts, 
  saveCart,
  updateCart,
  deleteCart
} from './services/supabase';
import { Product, PriceHistory, Profile, TabType, ProductStats, Benefit } from './types';
import Header from './components/Header';
import ProductList from './components/ProductList';
import BottomNav from './components/BottomNav';
import ProductDetail from './components/ProductDetail';
import AuthModal from './components/AuthModal';
import CartSummary from './components/CartSummary';
import Footer from './components/Footer';
import { AboutView, TermsView, ContactView } from './components/InfoViews';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [trendFilter, setTrendFilter] = useState<'up' | 'down' | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<number, number>>({});
  const [purchasedItems, setPurchasedItems] = useState<Set<number>>(new Set());
  const [savedCarts, setSavedCarts] = useState<any[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [showPwaPill, setShowPwaPill] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('product/')) {
        const id = parseInt(hash.split('/')[1]);
        if (!isNaN(id)) setSelectedProductId(id);
      } else if (['about', 'terms', 'contact', 'home', 'carnes', 'verdu', 'varios', 'favs'].includes(hash)) {
        setCurrentTab(hash as TabType);
        setSelectedProductId(null);
      } else if (!hash) {
        window.location.hash = 'home';
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isStandalone && isMobile) {
        setTimeout(() => setShowPwaPill(true), 2000);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPwaPill(false);
    }
  };

  const navigateTo = (tab: TabType) => {
    window.location.hash = tab;
    setCurrentTab(tab);
  };

  const loadData = useCallback(async (sessionUser: User | null) => {
  try {
    setLoading(true);
    const [prodData, histData, configData] = await Promise.all([
      getProducts(),
      getPriceHistory(7),
      getConfig()
    ]);
    setProducts(prodData || []);
    setHistory(histData || []);
    setConfig(configData || {});

    if (sessionUser) {
      let prof = await getProfile(sessionUser.id);

      if (prof && prof.subscription === 'pro' && prof.subscription_end) {
        if (new Date(prof.subscription_end) < new Date()) {
          await supabase.from('perfiles').update({ subscription: 'free' }).eq('id', sessionUser.id);
          prof = { ...prof, subscription: 'free' };
        }
      }

      setProfile(prof);
      
      // CAMBIO: Usamos getSavedCarts que es la que existe
      const carts = await getSavedCarts(sessionUser.id);
      setSavedCarts(carts || []);
      
      // Si tenés un carrito activo guardado en el perfil o en el primer elemento:
      if (carts && carts.length > 0 && !activeListId) {
        setFavorites(carts[0].items || {});
        setActiveListId(carts[0].id);
      }
    }
    
    // const day = new Date().getDay();
    // const benefitData = await getBenefits(day);
    // setBenefits(benefitData || []);
  } catch (err: any) {
    console.error("Error loading app data:", err);
  } finally {
    setLoading(false);
  }
}, []); 

  useEffect(() => {
    // 1. Obtener la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      loadData(sessionUser);
    });

    // 2. Escuchar cambios en la autenticación (Corrección de nombres de variables)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      
      if (event === 'SIGNED_IN') {
        loadData(sessionUser);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setFavorites({});
        setSavedCarts([]);
        setPurchasedItems(new Set());
        setActiveListId(null); // Resetea la carpeta activa al cerrar sesión
      }
    });

    // 3. Limpiar la suscripción al desmontar
    return () => authListener.subscription.unsubscribe();
  }, [loadData]);

  useEffect(() => {
    if (user && activeListId) {
      const timer = setTimeout(() => {
        updateCart(activeListId, { items: favorites }).catch(console.error);
      }, 500); // Debounce to avoid too many writes
      return () => clearTimeout(timer);
    }
  }, [favorites, user, activeListId]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const getStats = (p: number[], h: number): ProductStats => {
    const v = p.filter(x => x > 0);
    if (v.length === 0) return { min: 0, spread: '0.0', trendClass: '', icon: '-', isUp: false, isDown: false };
    const min = Math.min(...v);
    let diff = 0, tc = 'text-neutral-500', icon = '-', isUp = false, isDown = false;
    if (h > 0) {
      diff = ((min - h) / h) * 100;
      if (diff > 0.1) { tc = 'text-red-600'; icon = '▲'; isUp = true; }
      else if (diff < -0.1) { tc = 'text-green-600'; icon = '▼'; isDown = true; }
    }
    return { min, spread: Math.abs(diff).toFixed(1), trendClass: tc, icon, isUp, isDown };
  };

  const isPro = useMemo(() => {
    if (!profile || profile.subscription !== 'pro') return false;
    return profile.subscription_end ? new Date(profile.subscription_end) > new Date() : false;
  }, [profile]);

  const filteredProducts = useMemo(() => {
    let result = products.map(p => {
      const prices = [p.p_coto, p.p_carrefour, p.p_dia, p.p_jumbo, p.p_masonline];
      const h7 = history.find(h => h.nombre_producto === p.nombre);
      return { ...p, stats: getStats(prices, h7?.precio_minimo || 0), prices };
    });
    if (currentTab === 'carnes') result = result.filter(p => p.categoria?.toLowerCase().includes('carne'));
    else if (currentTab === 'verdu') result = result.filter(p => p.categoria?.toLowerCase().includes('verdu') || p.categoria?.toLowerCase().includes('fruta'));
    else if (currentTab === 'varios') result = result.filter(p => !p.categoria?.toLowerCase().includes('carne') && !p.categoria?.toLowerCase().includes('verdu'));
    else if (currentTab === 'favs') result = result.filter(p => favorites[p.id]);

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = result.filter(p => p.nombre.toLowerCase().includes(t) || (p.ticker && p.ticker.toLowerCase().includes(t)));
    }
    if (trendFilter && currentTab !== 'favs') {
      result = result.filter(p => trendFilter === 'up' ? p.stats.isUp : p.stats.isDown);
    }
    return result;
  }, [products, history, currentTab, searchTerm, trendFilter, favorites]);

  const toggleFavorite = (id: number) => {
    if (!user) {
      setAuthMessage('Debes iniciar sesión para guardar favoritos.');
      setIsAuthOpen(true);
      return;
    }

    const favoritesCount = Object.keys(favorites).length;
    if (!isPro && favoritesCount >= 5 && !favorites[id]) {
      alert('¡Límite alcanzado! Sé PRO para tener favoritos ilimitados.');
      return;
    }
    
    const next = { ...favorites };
    if (next[id]) delete next[id];
    else next[id] = 1;
    setFavorites(next);
  };

  const handleFavoriteChangeInCart = (id: number, delta: number) => {
    const currentQty = favorites[id] || 0;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      const next = { ...favorites };
      delete next[id];
      setFavorites(next);
    } else {
      setFavorites({ ...favorites, [id]: newQty });
    }
  };

  const togglePurchased = (id: number) => {
    const next = new Set(purchasedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPurchasedItems(next);
  };

  const handleSaveCurrentCart = async (name: string) => {
    if (!user || !isPro) return;
  
    const limit = 2; // Límite de 2 listas para usuarios PRO
    if (savedCarts.length >= limit) {
      alert("Límite alcanzado. Solo puedes guardar hasta 2 listas.");
      return;
    }

    try {
      const newCart = await saveCart(user.id, name, favorites);
      if (newCart) {
        setSavedCarts(prev => [newCart, ...prev]);
        setActiveListId(newCart.id);
      }
    } catch (err) {
      console.error("Error al guardar la lista:", err);
      alert("No se pudo guardar la lista");
    }
  };

  const handleDeleteSavedCart = (id: string) => {
    deleteCart(id).then(() => {
      const next = savedCarts.filter(cart => cart.id !== id);
      setSavedCarts(next);
      if (activeListId === id) {
        if (next.length > 0) {
          handleLoadSavedCart(next[0]);
        } else {
          setActiveListId(null);
          setFavorites({});
        }
      }
    }).catch(console.error);
  };

  const handleLoadSavedCart = (cart: any) => {
    setLoading(true);
    setFavorites(cart.items || {});
    setActiveListId(cart.id);
    setPurchasedItems(new Set());
    navigateTo('favs');
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFavorites({});
    setSavedCarts([]);
    setPurchasedItems(new Set());
    setActiveListId(null);
    setIsAuthOpen(false);
    navigateTo('home');
  };

  if (loading && products.length === 0) return <div className="min-h-screen flex items-center justify-center dark:bg-black dark:text-white font-mono text-[11px] uppercase tracking-[0.2em]">Cargando...</div>;

  return (
    <div className="max-w-screen-md mx-auto min-h-screen bg-white dark:bg-black shadow-2xl transition-colors font-sans pb-24">
      {showPwaPill && (
        <div 
          onClick={handleInstallClick} 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl cursor-pointer animate-in slide-in-from-bottom-10 duration-500"
        >
          <i className="fa-solid fa-download"></i>
          <span className="text-sm font-bold uppercase tracking-wider">Instalá la app</span>
        </div>
      )}
      <Header 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
        toggleTheme={toggleTheme} theme={theme}
        onUserClick={() => setIsAuthOpen(true)} user={user}
        profile={profile}
        trendFilter={trendFilter} setTrendFilter={setTrendFilter} 
        showHero={currentTab === 'home' && !searchTerm && !trendFilter}
        onNavigate={navigateTo} currentTab={currentTab}
      />
      <main>
        {['home', 'carnes', 'verdu', 'varios', 'favs'].includes(currentTab) ? (
          <>
            {currentTab === 'favs' && filteredProducts.length > 0 && (
              <CartSummary 
                items={filteredProducts} 
                favorites={favorites} 
                benefits={benefits} 
                userMemberships={profile?.membresias} 
                onSaveCart={handleSaveCurrentCart}
                canSave={!!user && isPro && savedCarts.length < 2}
                savedCarts={savedCarts}
                onLoadCart={handleLoadSavedCart}
                onDeleteCart={handleDeleteSavedCart}
                activeListId={activeListId}
              />
            )}
            <ProductList 
              products={filteredProducts as any} 
              onProductClick={id => window.location.hash = `product/${id}`}
              onFavoriteToggle={toggleFavorite} 
              isFavorite={id => !!favorites[id]}
              isCartView={currentTab === 'favs'} 
              quantities={favorites}
              onUpdateQuantity={handleFavoriteChangeInCart}
              searchTerm={searchTerm}
              purchasedItems={purchasedItems}
              onTogglePurchased={togglePurchased}
            />
          </>
        ) : (
          <div className="animate-in fade-in duration-500">
            {currentTab === 'about' && <AboutView onClose={() => navigateTo('home')} content={config.acerca_de} />}
            {currentTab === 'terms' && <TermsView onClose={() => navigateTo('home')} content={config.terminos} />}
            {currentTab === 'contact' && <ContactView onClose={() => navigateTo('home')} content={config.contacto} email={profile?.email} />}
          </div>
        )}
      </main>

      <BottomNav currentTab={currentTab} setCurrentTab={navigateTo} cartCount={Object.keys(favorites).length} />
      
      {selectedProductId && (
        <ProductDetail 
          productId={selectedProductId} 
          onClose={() => navigateTo(currentTab)} 
          onFavoriteToggle={toggleFavorite} 
          isFavorite={!!favorites[selectedProductId]} 
          products={products} 
          theme={theme} 
        />
      )}

      {isAuthOpen && (
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
          user={user} 
          profile={profile} 
          onSignOut={handleSignOut} 
          onProfileUpdate={() => loadData(user)}
          action={authAction}
          message={authMessage}
          currentActiveCartSize={Object.keys(favorites).length}
          savedCarts={savedCarts}
          onSaveCart={handleSaveCurrentCart}
          onDeleteCart={handleDeleteSavedCart}
          onLoadCart={handleLoadSavedCart}
        />
      )}
      <Footer />
    </div>
  );
};

export default App;