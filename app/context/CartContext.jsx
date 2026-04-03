"use client";
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getAuthHeaders } from '@/app/lib/supabase';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isAuthReady } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const lastHydratedUserIdRef = useRef(null);
  const serverSyncInFlightRef = useRef(false);

  const validateCode = async (code) => {
    if (!code) {
      setIsDiscounted(false);
      return;
    }
    setIsValidatingPromo(true);
    try {
      const res = await fetch(`/api/promo/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      setIsDiscounted(!!data.valid);
    } catch (err) {
      console.error("Promo validation error", err);
      setIsDiscounted(false);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const updatePromoCode = (code) => {
    const upperCode = code?.toUpperCase() || '';
    setPromoCode(upperCode);
    validateCode(upperCode);
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('fortnite_cart');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }
      const storedCode = localStorage.getItem('fortnite_promo');
      if (storedCode) {
        setPromoCode(storedCode);
        validateCode(storedCode);
      }
    } catch (e) {
      console.error("Erreur de chargement du panier / promo", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage when cart changes (only for guests)
  useEffect(() => {
    if (isLoaded) {
      if (!user?.id) {
        localStorage.setItem('fortnite_cart', JSON.stringify(cartItems));
      } else {
        localStorage.removeItem('fortnite_cart');
      }
      
      if (promoCode) {
        localStorage.setItem('fortnite_promo', promoCode);
      } else {
        localStorage.removeItem('fortnite_promo');
      }
    }
  }, [cartItems, isLoaded, user?.id, promoCode]);

  const mergeByProductId = (serverItems, localItems) => {
    const map = new Map();
    for (const item of serverItems || []) {
      const key = String(item.productId ?? item.id);
      map.set(key, { ...item, id: key, productId: key });
    }
    for (const item of localItems || []) {
      const key = String(item.productId ?? item.id);
      const existing = map.get(key);
      if (existing) {
        map.set(key, { ...existing, quantity: (existing.quantity ?? 0) + (item.quantity ?? 0) });
      } else {
        map.set(key, { ...item, id: key, productId: key });
      }
    }
    return Array.from(map.values());
  };

  const fetchServerCart = async () => {
    const headers = await getAuthHeaders();
    if (!headers?.Authorization) return null;

    const res = await fetch('/api/cart', {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.items)) return null;
    return data;
  };

  const replaceServerCart = async (items) => {
    const headers = await getAuthHeaders();
    if (!headers?.Authorization) return null;

    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      cache: 'no-store',
      body: JSON.stringify({ action: 'replace', items }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data;
  };

  // Hydrate user cart once auth is ready
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user?.id) return;
    if (!isLoaded) return;

    const userId = user.id;
    if (lastHydratedUserIdRef.current === userId) return;
    lastHydratedUserIdRef.current = userId;

    const hydrate = async () => {
      try {
        serverSyncInFlightRef.current = true;
        const server = await fetchServerCart();
        const local = cartItems || [];

        const merged = mergeByProductId(server?.items || [], local);
        await replaceServerCart(merged);
        setCartItems(merged);
        try {
          localStorage.removeItem('fortnite_cart');
        } catch {}
      } catch (e) {
        console.error('[Cart] hydrate error', e);
      } finally {
        serverSyncInFlightRef.current = false;
      }
    };

    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, user?.id, isLoaded]);

  const callServerAction = async (action, payload) => {
    const headers = await getAuthHeaders();
    if (!headers?.Authorization) return null;

    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      cache: 'no-store',
      body: JSON.stringify({ action, ...payload }),
    });

    if (!res.ok) return null;
    return res.json();
  };

  const addToCart = (product) => {
    const productId = String(product.id);

    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.productId ?? item.id) === productId);
      if (existing) {
        return prev.map((item) =>
          String(item.productId ?? item.id) === productId
            ? { ...item, quantity: (item.quantity ?? 0) + 1 }
            : item
        );
      }
      return [...prev, { ...product, id: productId, productId, quantity: 1 }];
    });

    if (serverSyncInFlightRef.current) return;
    if (isAuthReady && user?.id) {
      void (async () => {
        try {
          await callServerAction('add', {
            productId,
            delta: 1,
            product: {
              id: productId,
              name: product.name,
              price: product.price,
              vbucks: product.vbucks,
              image: product.image,
              type: product.type,
            },
          });
          const server = await fetchServerCart();
          if (server?.items) setCartItems(server.items);
        } catch (e) {
          console.error('[Cart] add server sync failed', e);
        }
      })();
    }
  };

  const removeFromCart = (id) => {
    const productId = String(id);
    setCartItems((prev) =>
      prev.filter((item) => String(item.productId ?? item.id) !== productId)
    );

    if (isAuthReady && user?.id) {
      void (async () => {
        try {
          await callServerAction('remove', { productId });
          const server = await fetchServerCart();
          if (server?.items) setCartItems(server.items);
        } catch (e) {
          console.error('[Cart] remove server sync failed', e);
        }
      })();
    }
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    const productId = String(id);
    setCartItems((prev) =>
      prev.map((item) =>
        String(item.productId ?? item.id) === productId ? { ...item, quantity: newQuantity } : item
      )
    );

    if (isAuthReady && user?.id) {
      void (async () => {
        try {
          await callServerAction('update', { productId, quantity: newQuantity });
          const server = await fetchServerCart();
          if (server?.items) setCartItems(server.items);
        } catch (e) {
          console.error('[Cart] update server sync failed', e);
        }
      })();
    }
  };

  const clearCart = () => {
    setCartItems([]);

    if (isAuthReady && user?.id) {
      void (async () => {
        try {
          await callServerAction('clear', {});
          const server = await fetchServerCart();
          if (server?.items) setCartItems(server.items);
        } catch (e) {
          console.error('[Cart] clear server sync failed', e);
        }
      })();
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      isLoaded,
      promoCode,
      setPromoCode: updatePromoCode,
      isDiscounted,
      isValidatingPromo
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  const { isDiscounted, promoCode, cartItems } = context;
  
  const cartTotal = cartItems.reduce((sum, item) => {
    const usedPrice = isDiscounted ? (item.price || 0) : (item.full_price || (item.price * 1.5) || 0);
    return sum + (usedPrice * (item.quantity || 1));
  }, 0);

  const cartSaving = isDiscounted ? cartItems.reduce((sum, item) => {
    const full = (item.full_price || (item.price * 1.5) || 0);
    const reduced = (item.price || 0);
    return sum + ((full - reduced) * (item.quantity || 1));
  }, 0) : 0;

  return { 
    ...context, 
    cartTotal, 
    cartSaving, 
    isDiscounted 
  };
}
