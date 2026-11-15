import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  CustomerOrder,
  OrderStatus,
  CategoryInfo,
  CATEGORIES_LIST,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
} from '../data/bakeryData';
import {
  fetchProductsFromDb,
  fetchCategoriesFromDb,
  submitOrderToServer,
  checkAdminSessionApi,
  loginAdminApi,
  logoutAdminApi,
  fetchAdminProductsApi,
  createAdminProductApi,
  updateAdminProductApi,
  deleteAdminProductApi,
  fetchAdminOrdersApi,
  updateAdminOrderStatusApi,
  checkBackendStatus,
  isSupabaseConfigured,
  PlaceOrderPayload,
} from '../lib/supabase';

export interface CartItem {
  product: Product;
  quantity: number;
  sliced?: boolean;
}

interface CartContextType {
  products: Product[];
  adminProducts: Product[];
  categories: CategoryInfo[];
  addProduct: (newProduct: Product) => Promise<boolean>;
  updateProduct: (id: string, updatedData: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  resetDefaultProducts: () => void;

  orders: CustomerOrder[];
  addCustomerOrder: (
    order: Omit<PlaceOrderPayload, 'items'> & {
      items: Array<{
        productId: string;
        name: string;
        price: number;
        quantity: number;
        image: string;
      }>;
    }
  ) => Promise<{ success: boolean; orderNumber?: string; total?: number; error?: string }>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;

  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, sliced?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Supabase backend connection status
  isSupabaseOnline: boolean;
  backendStatusMessage: string;
  refreshData: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  isLoadingData: boolean;

  // Admin routing & auth (server-side session only)
  isAdminView: boolean;
  setIsAdminView: (isAdmin: boolean) => void;
  isAdminAuthenticated: boolean;
  isCheckingSession: boolean;
  adminPasswordConfigured: boolean;
  loginAdmin: (password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryInfo[]>(CATEGORIES_LIST);

  // Public storefront products (enabled items only when connected to Supabase)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('oven_oak_products_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  // Full product list for admin (includes disabled/out-of-stock products)
  const [adminProducts, setAdminProducts] = useState<Product[]>(products);

  // Orders are ONLY loaded into state when admin is authenticated
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  // Shopping cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('oven_oak_cart_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(isSupabaseConfigured());
  const [backendStatusMessage, setBackendStatusMessage] = useState<string>('Initializing backend connection...');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const checkIsAdminPath = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path.endsWith('/admin') ||
      path.includes('/admin/') ||
      hash === '#admin' ||
      hash.startsWith('#/admin')
    );
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(() => checkIsAdminPath());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [adminPasswordConfigured, setAdminPasswordConfigured] = useState<boolean>(true);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Fetch public categories and public available products
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const status = await checkBackendStatus();
      setIsSupabaseOnline(status.dbConnected || status.isConfigured);
      setBackendStatusMessage(status.message);
      if (typeof status.adminPasswordConfigured === 'boolean') {
        setAdminPasswordConfigured(status.adminPasswordConfigured);
      }

      const fetchedCats = await fetchCategoriesFromDb();
      if (fetchedCats && fetchedCats.length > 0) {
        setCategories(fetchedCats);
      }

      const { products: fetchedProds, source } = await fetchProductsFromDb();
      if (source === 'supabase') {
        setProducts(fetchedProds);
      } else if (fetchedProds && fetchedProds.length > 0) {
        setProducts(fetchedProds);
      }
    } catch (err) {
      console.warn('Backend sync failed, continuing with local bakery data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch protected admin products & private customer orders
  const refreshAdminData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [prodRes, ordersRes] = await Promise.all([
        fetchAdminProductsApi(),
        fetchAdminOrdersApi(),
      ]);

      if (prodRes.unauthorized || ordersRes.unauthorized) {
        setIsAdminAuthenticated(false);
        setOrders([]);
        return;
      }

      if (prodRes.source === 'supabase') {
        setAdminProducts(prodRes.products);
        setProducts(prodRes.products.filter(p => p.isAvailable !== false));
      } else {
        setAdminProducts(products);
      }

      if (ordersRes.source === 'supabase') {
        setOrders(ordersRes.orders);
      } else {
        // Local fallback orders when Supabase is not yet configured
        try {
          const savedOrders = localStorage.getItem('oven_oak_orders_v2');
          setOrders(savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS);
        } catch {
          setOrders(INITIAL_ORDERS);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [products]);

  // Verify server-side session & load public data on mount
  useEffect(() => {
    const init = async () => {
      setIsCheckingSession(true);
      const session = await checkAdminSessionApi();
      setIsAdminAuthenticated(session.authenticated);
      setAdminPasswordConfigured(session.passwordConfigured);
      setIsCheckingSession(false);

      await refreshData();
      if (session.authenticated) {
        await refreshAdminData();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever returning to storefront from admin, refresh public storefront menu immediately
  useEffect(() => {
    if (!isAdminView) {
      refreshData();
    } else if (isAdminAuthenticated) {
      refreshAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminView, isAdminAuthenticated]);

  // Listen to popstate and hashchange for /admin navigation
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminView(checkIsAdminPath());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('oven_oak_cart_v2', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  // ========================================================
  // ADMIN PRODUCT CRUD (PROTECTED SERVER CALLS)
  // ========================================================
  const addProduct = async (newProduct: Product): Promise<boolean> => {
    const res = await createAdminProductApi(newProduct);
    if (!res.success) {
      showToast(res.error || 'Failed to add product');
      return false;
    }

    const savedProd = res.product || newProduct;
    setAdminProducts(prev => [savedProd, ...prev]);
    if (savedProd.isAvailable !== false) {
      setProducts(prev => [savedProd, ...prev]);
    }
    showToast(`Added "${savedProd.name}" to bakery menu`);
    return true;
  };

  const updateProduct = async (id: string, updatedData: Partial<Product>): Promise<boolean> => {
    const res = await updateAdminProductApi(id, updatedData);
    if (!res.success) {
      showToast(res.error || 'Failed to update product');
      return false;
    }

    const applyUpdate = (item: Product): Product => {
      if (item.id !== id) return item;
      if (res.product) return res.product;
      const merged = { ...item, ...updatedData };
      const qty =
        merged.stockQuantity !== undefined ? merged.stockQuantity : item.stockQuantity ?? 50;
      const avail = merged.isAvailable !== undefined ? merged.isAvailable : item.isAvailable ?? true;
      return {
        ...merged,
        stockQuantity: qty,
        isAvailable: avail,
        stockStatus: !avail || qty === 0 ? 'Sold Out' : qty <= 10 ? 'Low Stock' : 'In Stock',
      };
    };

    setAdminProducts(prev => prev.map(applyUpdate));
    setProducts(prev => {
      const updated = prev.map(applyUpdate).filter(p => p.isAvailable !== false);
      // If product was previously disabled and just re-enabled, ensure it appears on storefront
      if (res.product && res.product.isAvailable !== false && !updated.some(p => p.id === id)) {
        return [res.product, ...updated];
      }
      return updated;
    });

    setCart(prev =>
      prev.map(item =>
        item.product.id === id ? { ...item, product: applyUpdate(item.product) } : item
      )
    );

    showToast('Product updated successfully');
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const res = await deleteAdminProductApi(id);
    if (!res.success) {
      showToast(res.error || 'Failed to delete product');
      return false;
    }

    setAdminProducts(prev => prev.filter(item => item.id !== id));
    setProducts(prev => prev.filter(item => item.id !== id));
    setCart(prev => prev.filter(item => item.product.id !== id));
    showToast('Product removed from bakery menu');
    return true;
  };

  const resetDefaultProducts = () => {
    setProducts(INITIAL_PRODUCTS);
    setAdminProducts(INITIAL_PRODUCTS);
    localStorage.setItem('oven_oak_products_v2', JSON.stringify(INITIAL_PRODUCTS));
    showToast('Reset local bakery collection to default items');
  };

  // ========================================================
  // CUSTOMER ORDER SUBMISSION (NO AUTH REQUIRED)
  // ========================================================
  const addCustomerOrder = async (
    orderData: Omit<PlaceOrderPayload, 'items'> & {
      items: Array<{
        productId: string;
        name: string;
        price: number;
        quantity: number;
        image: string;
      }>;
    }
  ): Promise<{ success: boolean; orderNumber?: string; total?: number; error?: string }> => {
    const res = await submitOrderToServer(orderData);
    if (!res.success) {
      return { success: false, error: res.error || 'Unable to submit order.' };
    }

    const finalOrderNum = res.orderNumber || 'OAK-' + Math.floor(100000 + Math.random() * 900000);
    const computedTotal =
      typeof res.total === 'number' && res.total > 0
        ? res.total
        : orderData.items.reduce((s, it) => s + it.price * it.quantity, 0);

    // If running in local fallback mode (no Supabase), persist local copy for admin preview
    if (res.source === 'local') {
      const localOrder: CustomerOrder = {
        id: res.orderId || 'ord-' + Date.now(),
        ticketNumber: finalOrderNum,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        customerEmail: orderData.customerAddress,
        pickupWindow: orderData.pickupWindow,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        items: orderData.items,
        subtotal: computedTotal,
        total: computedTotal,
        createdAt:
          'Just now (' +
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
          ')',
        status: 'Pending',
      };
      try {
        const saved = localStorage.getItem('oven_oak_orders_v2');
        const list = saved ? JSON.parse(saved) : INITIAL_ORDERS;
        localStorage.setItem('oven_oak_orders_v2', JSON.stringify([localOrder, ...list]));
      } catch {
        // ignore
      }
    }

    // Refresh public products so deducted stock updates immediately
    await refreshData();

    return {
      success: true,
      orderNumber: finalOrderNum,
      total: computedTotal,
    };
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
    const res = await updateAdminOrderStatusApi(orderId, newStatus);
    if (!res.success) {
      showToast(res.error || 'Failed to update order status');
      return false;
    }

    setOrders(prev => {
      const next = prev.map(ord => (ord.id === orderId ? { ...ord, status: newStatus } : ord));
      try {
        localStorage.setItem('oven_oak_orders_v2', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    showToast(`Order status updated to "${newStatus}"`);
    return true;
  };

  // ========================================================
  // SHOPPING CART OPERATIONS
  // ========================================================
  const addToCart = (product: Product, quantity = 1, sliced = false) => {
    if (product.isAvailable === false || product.stockStatus === 'Sold Out' || product.stockQuantity === 0) {
      showToast(`"${product.name}" is currently sold out`);
      return;
    }

    const maxStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 999;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(maxStock, existing.quantity + quantity);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: nextQty, sliced: sliced || item.sliced }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(maxStock, quantity), sliced }];
    });
    showToast(`Added ${quantity}x ${product.name} (Rs. ${product.price}) to bag`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id !== productId) return item;
        const maxStock = typeof item.product.stockQuantity === 'number' ? item.product.stockQuantity : 999;
        return { ...item, quantity: Math.min(maxStock, quantity) };
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // ========================================================
  // ADMIN AUTHENTICATION (SERVER-SIDE SESSION)
  // ========================================================
  const loginAdmin = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!password) {
      return { success: false, error: 'Please enter the admin password.' };
    }
    const res = await loginAdminApi(password);
    if (!res.authenticated) {
      return { success: false, error: res.error || 'Incorrect admin password.' };
    }

    setIsAdminAuthenticated(true);
    showToast('Admin access granted');
    await refreshAdminData();
    return { success: true };
  };

  const logoutAdmin = async () => {
    await logoutAdminApi();
    setIsAdminAuthenticated(false);
    setOrders([]);
    setIsAdminView(false);
    if (window.location.pathname.includes('/admin')) {
      window.history.pushState({}, '', '/');
    }
    if (window.location.hash.includes('admin')) {
      window.location.hash = '';
    }
    showToast('Logged out of Admin Portal');
  };

  return (
    <CartContext.Provider
      value={{
        products,
        adminProducts,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        resetDefaultProducts,

        orders,
        addCustomerOrder,
        updateOrderStatus,

        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,

        isCartOpen,
        setIsCartOpen,
        selectedProduct,
        setSelectedProduct,
        isCheckoutOpen,
        setIsCheckoutOpen,

        toastMessage,
        showToast,

        isSupabaseOnline,
        backendStatusMessage,
        refreshData,
        refreshAdminData,
        isLoadingData,

        isAdminView,
        setIsAdminView,
        isAdminAuthenticated,
        isCheckingSession,
        adminPasswordConfigured,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
