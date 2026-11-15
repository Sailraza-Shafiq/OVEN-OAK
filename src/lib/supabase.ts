import { createClient } from '@supabase/supabase-js';
import {
  Product,
  ProductCategory,
  CustomerOrder,
  OrderStatus,
  CATEGORIES_LIST,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
} from '../data/bakeryData';

// Client-safe environment variables (ANON KEY ONLY — never service_role)
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('https://') &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('YOUR_')
  );
};

// Public read-only Supabase client (optional fallback)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export interface SupabaseCategoryRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at?: string;
}

export interface SupabaseProductRow {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price: number | string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  weight: string | null;
  flavor: string | null;
  ingredients: string[] | null;
  allergens: string[] | null;
  is_best_seller: boolean | null;
  is_featured: boolean | null;
  created_at?: string;
  updated_at?: string;
  categories?: SupabaseCategoryRow;
}

const mapCategoryNameToSlug = (name: string): ProductCategory => {
  const catName = name.toLowerCase();
  if (catName.includes('pizza')) return 'small-pizza';
  if (catName.includes('cake')) return 'cakes';
  if (catName.includes('brownie')) return 'brownies';
  if (catName.includes('bun')) return 'buns';
  if (catName.includes('bread')) return 'fresh-bread';
  if (catName.includes('blue band')) return 'blue-band';
  if (catName.includes('chip')) return 'chips';
  if (catName.includes('drink') || catName.includes('soda')) return 'cold-drinks';
  return 'small-pizza';
};

export const mapSupabaseProductToFrontend = (row: SupabaseProductRow): Product => {
  const catName = row.categories?.name || 'Bakery Item';
  const catSlug = mapCategoryNameToSlug(catName);
  const stockQty = typeof row.stock_quantity === 'number' ? row.stock_quantity : 50;
  const available = row.is_available !== false;

  return {
    id: row.id,
    name: row.name,
    category: catSlug,
    categoryLabel: catName,
    price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
    shortDesc: row.description || '',
    fullDesc: row.description || '',
    image: row.image_url || '/src/assets/images/small_pizza_tikka_1793384934555.jpg',
    weight: row.weight || 'Standard Serving',
    flavor: row.flavor || 'Bakery Fresh',
    ingredients: row.ingredients || [],
    allergens: row.allergens || [],
    isBestSeller: Boolean(row.is_best_seller),
    isFeatured: Boolean(row.is_featured),
    stockQuantity: stockQty,
    isAvailable: available,
    stockStatus: !available || stockQty === 0 ? 'Sold Out' : stockQty <= 10 ? 'Low Stock' : 'In Stock',
  };
};

// ========================================================
// PUBLIC STOREFRONT DATA FETCHERS
// ========================================================

export const fetchCategoriesFromDb = async () => {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const json = await res.json();
      if (json.source === 'supabase' && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((c: SupabaseCategoryRow) => ({
          id: mapCategoryNameToSlug(c.name),
          title: c.name,
          desc: c.description || '',
          count: 'Fresh Batch',
          image: c.image_url || '/src/assets/images/small_pizza_tikka_1793384934555.jpg',
        }));
      }
    }
  } catch (err) {
    console.warn('Error fetching categories from API:', err);
  }
  return CATEGORIES_LIST;
};

export const fetchProductsFromDb = async (): Promise<{ products: Product[]; source: 'supabase' | 'local' }> => {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const json = await res.json();
      if (json.source === 'supabase' && Array.isArray(json.data) && json.data.length > 0) {
        return {
          products: json.data.map(mapSupabaseProductToFrontend),
          source: 'supabase',
        };
      }
    }
  } catch (err) {
    console.warn('Error fetching products from API:', err);
  }
  return { products: INITIAL_PRODUCTS, source: 'local' };
};

// ========================================================
// CUSTOMER ORDER PLACEMENT (NO AUTH REQUIRED)
// ========================================================

export interface PlaceOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pickupWindow: string;
  paymentMethod: string;
  notes?: string;
  idempotencyKey: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
}

export const submitOrderToServer = async (
  payload: PlaceOrderPayload
): Promise<{
  success: boolean;
  source?: 'supabase' | 'local';
  orderNumber?: string;
  orderId?: string;
  total?: number;
  error?: string;
}> => {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_address: payload.customerAddress,
        pickup_window: payload.pickupWindow,
        payment_method: payload.paymentMethod,
        customer_notes: payload.notes || '',
        idempotency_key: payload.idempotencyKey,
        items: payload.items.map(it => ({
          product_id: it.productId,
          quantity: it.quantity,
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Could not place order.' };
    }

    return {
      success: true,
      source: data.source || 'supabase',
      orderNumber: data.orderNumber,
      orderId: data.orderId,
      total: data.total,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error while placing order.' };
  }
};

// ========================================================
// PROTECTED ADMIN API HELPERS (SERVER-SIDE SESSION COOKIE)
// ========================================================

export const checkAdminSessionApi = async (): Promise<{
  authenticated: boolean;
  passwordConfigured: boolean;
}> => {
  try {
    const res = await fetch('/api/admin/session', { credentials: 'include' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }
  return { authenticated: false, passwordConfigured: false };
};

export const loginAdminApi = async (
  password: string
): Promise<{ authenticated: boolean; error?: string }> => {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { authenticated: false, error: data.error || 'Invalid password.' };
    }
    return { authenticated: true };
  } catch (err: any) {
    return { authenticated: false, error: err?.message || 'Network error.' };
  }
};

export const logoutAdminApi = async (): Promise<void> => {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
};

export const fetchAdminProductsApi = async (): Promise<{
  products: Product[];
  source: 'supabase' | 'local';
  unauthorized?: boolean;
}> => {
  try {
    const res = await fetch('/api/admin/products', { credentials: 'include' });
    if (res.status === 401) {
      return { products: [], source: 'local', unauthorized: true };
    }
    if (res.ok) {
      const json = await res.json();
      if (json.source === 'supabase' && Array.isArray(json.data) && json.data.length > 0) {
        return {
          products: json.data.map(mapSupabaseProductToFrontend),
          source: 'supabase',
        };
      }
    }
  } catch (err) {
    console.warn('Error fetching admin products:', err);
  }
  return { products: INITIAL_PRODUCTS, source: 'local' };
};

export const createAdminProductApi = async (
  product: Product
): Promise<{ success: boolean; product?: Product; error?: string }> => {
  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: product.name,
        description: product.fullDesc || product.shortDesc,
        category: product.categoryLabel || product.category,
        price: product.price,
        image_url: product.image,
        stock_quantity:
          typeof product.stockQuantity === 'number'
            ? product.stockQuantity
            : product.stockStatus === 'Sold Out'
            ? 0
            : 50,
        is_available: product.isAvailable !== false && product.stockStatus !== 'Sold Out',
        weight: product.weight,
        flavor: product.flavor,
        ingredients: product.ingredients,
        allergens: product.allergens,
        is_best_seller: Boolean(product.isBestSeller),
        is_featured: Boolean(product.isFeatured),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create product.' };
    }
    return {
      success: true,
      product: data.product ? mapSupabaseProductToFrontend(data.product) : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const updateAdminProductApi = async (
  id: string,
  updates: Partial<Product>
): Promise<{ success: boolean; product?: Product; error?: string }> => {
  try {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.fullDesc !== undefined) payload.description = updates.fullDesc;
    else if (updates.shortDesc !== undefined) payload.description = updates.shortDesc;
    if (updates.image !== undefined) payload.image_url = updates.image;
    if (updates.weight !== undefined) payload.weight = updates.weight;
    if (updates.flavor !== undefined) payload.flavor = updates.flavor;
    if (updates.category !== undefined) payload.category = updates.categoryLabel || updates.category;
    if (updates.stockQuantity !== undefined) payload.stock_quantity = updates.stockQuantity;
    if (updates.isAvailable !== undefined) payload.is_available = updates.isAvailable;
    if (updates.stockStatus !== undefined && updates.isAvailable === undefined) {
      if (updates.stockStatus === 'Sold Out' && updates.stockQuantity === undefined) {
        payload.stock_quantity = 0;
      }
    }

    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update product.' };
    }
    return {
      success: true,
      product: data.product ? mapSupabaseProductToFrontend(data.product) : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const deleteAdminProductApi = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to delete product.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const uploadProductImageToStorage = async (
  file: File,
  fileName: string
): Promise<{ url: string | null; error?: string }> => {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fileName,
        mimeType: file.type || 'image/jpeg',
        base64Data,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.url) {
      return { url: null, error: data.error || 'Failed to upload image' };
    }
    return { url: data.url };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Upload error' };
  }
};

export const fetchAdminOrdersApi = async (): Promise<{
  orders: CustomerOrder[];
  source: 'supabase' | 'local';
  unauthorized?: boolean;
}> => {
  try {
    const res = await fetch('/api/admin/orders', { credentials: 'include' });
    if (res.status === 401) {
      return { orders: [], source: 'local', unauthorized: true };
    }
    if (res.ok) {
      const json = await res.json();
      if (json.source === 'supabase' && Array.isArray(json.data)) {
        const mapped: CustomerOrder[] = json.data.map((o: any) => ({
          id: o.id,
          ticketNumber: o.order_number,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerAddress: o.customer_address,
          customerEmail: o.customer_address,
          pickupWindow: o.pickup_window || 'Standard Window',
          paymentMethod: o.payment_method || 'Pay at Bakery Counter',
          notes: o.customer_notes || '',
          items: (o.order_items || []).map((item: any) => ({
            productId: item.product_id || '',
            name: item.product_name,
            price: Number(item.unit_price),
            quantity: item.quantity,
            image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg',
          })),
          subtotal: Number(o.subtotal),
          total: Number(o.total_amount),
          createdAt: new Date(o.created_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: o.order_status as OrderStatus,
        }));
        return { orders: mapped, source: 'supabase' };
      }
    }
  } catch (err) {
    console.warn('Error fetching admin orders:', err);
  }
  return { orders: INITIAL_ORDERS, source: 'local' };
};

export const updateAdminOrderStatusApi = async (
  id: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ order_status: status }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update status.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const checkBackendStatus = async (): Promise<{
  isConfigured: boolean;
  dbConnected: boolean;
  adminPasswordConfigured?: boolean;
  message: string;
  categoriesCount?: number;
  productsCount?: number;
}> => {
  try {
    const res = await fetch('/api/supabase-status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }

  return {
    isConfigured: isSupabaseConfigured(),
    dbConnected: false,
    message: isSupabaseConfigured() ? 'Connecting to Supabase...' : 'Operating with local bakery storage.',
  };
};
