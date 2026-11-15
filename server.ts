import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from './src/data/bakeryData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON requests
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ========================================================
// SUPABASE SERVER-SIDE CLIENT (SERVICE ROLE)
// ========================================================
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const supabaseServer =
  supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('https://')
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// ========================================================
// ADMIN SESSION & SECURITY CONFIGURATION
// ========================================================
const SESSION_COOKIE_NAME = 'oven_oak_admin_sid';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_SECRET =
  (process.env.ADMIN_SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex');

interface AdminSessionRecord {
  id: string;
  createdAt: number;
  expiresAt: number;
}

const adminSessions = new Map<string, AdminSessionRecord>();

// Simple brute-force protection for login attempts per IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 12;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

// In-memory idempotency cache for duplicate order submission prevention
const processedIdempotencyKeys = new Map<
  string,
  { orderNumber: string; orderId: string; total: number; createdAt: number }
>();

// Periodically clean expired sessions and old idempotency entries
setInterval(() => {
  const now = Date.now();
  for (const [sid, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) adminSessions.delete(sid);
  }
  for (const [key, entry] of processedIdempotencyKeys.entries()) {
    if (now - entry.createdAt > 60 * 60 * 1000) processedIdempotencyKeys.delete(key);
  }
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (attempt.resetAt <= now) loginAttempts.delete(ip);
  }
}, 5 * 60 * 1000).unref();

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    cookies[key] = val;
  }
  return cookies;
};

const signSessionId = (sid: string): string => {
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(sid).digest('hex');
  return `${sid}.${sig}`;
};

const verifySignedSessionToken = (token?: string): AdminSessionRecord | null => {
  if (!token) return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;
  const sid = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!sid || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(sid).digest('hex');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const record = adminSessions.get(sid);
  if (!record) return null;
  if (record.expiresAt <= Date.now()) {
    adminSessions.delete(sid);
    return null;
  }
  return record;
};

const timingSafePasswordMatch = (provided: string, expected: string): boolean => {
  const providedHash = crypto.createHash('sha256').update(provided).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
};

const setSessionCookie = (req: Request, res: Response, token: string) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
};

const clearSessionCookie = (req: Request, res: Response) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
  });
};

const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifySignedSessionToken(cookies[SESSION_COOKIE_NAME]);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Valid admin session required.' });
  }
  next();
};

const ALLOWED_ORDER_STATUSES = new Set([
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Completed',
  'Cancelled',
]);

const CATEGORY_SLUG_TO_NAME: Record<string, string> = {
  'small-pizza': 'Small Pizza',
  cakes: 'Cakes',
  brownies: 'Brownies',
  buns: 'Buns',
  'fresh-bread': 'Fresh Bread',
  'blue-band': 'Blue Band',
  chips: 'Chips',
  'cold-drinks': 'Cold Drinks',
};

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const isSupabaseUnavailableError = (err: unknown): boolean => {
  if (!err) return false;
  const msg = String((err as any)?.message || err).toLowerCase();
  const code = String((err as any)?.code || '').toUpperCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('eai_again') ||
    msg.includes('network') ||
    msg.includes('socket') ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    code === 'PGRST205' ||
    code === '42P01'
  );
};

// Server-side fallback catalog initialized from INITIAL_PRODUCTS for accurate price/stock checks when DB is offline
const fallbackProductCatalog = new Map(
  INITIAL_PRODUCTS.map(p => [
    p.id,
    {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stockQuantity: p.stockQuantity ?? 50,
      isAvailable: p.isAvailable !== false,
    },
  ])
);

const calculateAndCommitLocalOrder = (
  uuidItems: Array<{ product_id: string; quantity: number }>,
  orderNumber: string,
  cleanIdemKey: string
): { error?: { status: number; message: string }; total?: number; orderId?: string } => {
  let subtotal = 0;
  const toDeduct: Array<{ id: string; nextStock: number }> = [];

  for (const item of uuidItems) {
    const prod = fallbackProductCatalog.get(item.product_id);
    if (!prod) {
      return {
        error: { status: 404, message: `Product "${item.product_id}" not found.` },
      };
    }
    if (!prod.isAvailable) {
      return {
        error: { status: 400, message: `"${prod.name}" is currently unavailable.` },
      };
    }
    if (prod.stockQuantity < item.quantity) {
      return {
        error: {
          status: 400,
          message: `Insufficient stock for "${prod.name}". Only ${prod.stockQuantity} left.`,
        },
      };
    }
    subtotal += prod.price * item.quantity;
    toDeduct.push({ id: prod.id, nextStock: Math.max(0, prod.stockQuantity - item.quantity) });
  }

  for (const d of toDeduct) {
    const existing = fallbackProductCatalog.get(d.id);
    if (existing) existing.stockQuantity = d.nextStock;
  }

  const localOrderId = 'ord-' + Date.now();
  if (cleanIdemKey) {
    processedIdempotencyKeys.set(cleanIdemKey, {
      orderNumber,
      orderId: localOrderId,
      total: subtotal,
      createdAt: Date.now(),
    });
  }

  return { total: subtotal, orderId: localOrderId };
};

// ========================================================
// ADMIN AUTHENTICATION ROUTES
// ========================================================

app.get('/api/admin/session', (req: Request, res: Response) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifySignedSessionToken(cookies[SESSION_COOKIE_NAME]);
  res.json({
    authenticated: Boolean(session),
    expiresAt: session ? session.expiresAt : null,
    passwordConfigured: Boolean((process.env.ADMIN_PASSWORD || '').trim()),
  });
});

app.post('/api/admin/login', (req: Request, res: Response) => {
  const clientIp = req.ip || 'unknown';
  const now = Date.now();
  const attempt = loginAttempts.get(clientIp);
  if (attempt && attempt.resetAt > now && attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Please wait a few minutes and try again.',
    });
  }

  const configuredPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!configuredPassword) {
    return res.status(503).json({
      error:
        'ADMIN_PASSWORD is not configured on the server. Set the ADMIN_PASSWORD environment variable to enable admin login.',
    });
  }

  const providedPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!providedPassword) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (!timingSafePasswordMatch(providedPassword, configuredPassword)) {
    const nextCount = attempt && attempt.resetAt > now ? attempt.count + 1 : 1;
    loginAttempts.set(clientIp, { count: nextCount, resetAt: now + LOGIN_WINDOW_MS });
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  // Valid password: reset attempts and create expiring server-side session
  loginAttempts.delete(clientIp);
  const sid = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + SESSION_TTL_MS;
  adminSessions.set(sid, { id: sid, createdAt: now, expiresAt });

  const signedToken = signSessionId(sid);
  setSessionCookie(req, res, signedToken);

  res.json({ authenticated: true, expiresAt });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (token) {
    const sid = token.split('.')[0];
    if (sid) adminSessions.delete(sid);
  }
  clearSessionCookie(req, res);
  res.json({ authenticated: false });
});

// ========================================================
// PUBLIC HEALTH & STOREFRONT API ROUTES
// ========================================================

app.get('/api/supabase-status', async (req: Request, res: Response) => {
  const isConfigured = Boolean(supabaseServer);
  let dbConnected = false;
  let categoriesCount = 0;
  let productsCount = 0;
  let storageReady = false;
  let message = 'Supabase credentials not configured';

  if (supabaseServer) {
    try {
      const { count: catCount, error: catErr } = await supabaseServer
        .from('categories')
        .select('*', { count: 'exact', head: true });

      const { count: prodCount, error: prodErr } = await supabaseServer
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (!catErr && !prodErr) {
        dbConnected = true;
        categoriesCount = catCount || 0;
        productsCount = prodCount || 0;
        message = 'Connected to Supabase successfully';
      } else {
        message = `Tables not initialized yet. Please execute schema.sql in Supabase SQL editor. Error: ${catErr?.message || prodErr?.message}`;
      }

      const { data: buckets } = await supabaseServer.storage.listBuckets();
      storageReady = Boolean(buckets?.some(b => b.name === 'product-images'));
    } catch (e: any) {
      message = `Connection attempt error: ${e?.message}`;
    }
  }

  res.json({
    status: isConfigured && dbConnected ? 'healthy' : 'pending_configuration',
    isConfigured,
    dbConnected,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 16)}...` : null,
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminPasswordConfigured: Boolean((process.env.ADMIN_PASSWORD || '').trim()),
    categoriesCount,
    productsCount,
    storageReady,
    message,
  });
});

app.get('/api/categories', async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(200).json({ source: 'local', data: [] });
  }

  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(200).json({ source: 'local', data: [] });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ source: 'supabase', data });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(200).json({ source: 'local', data: [] });
    }
    res.status(500).json({ error: err.message });
  }
});

// Public endpoint returns ONLY enabled/available products
app.get('/api/products', async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(200).json({ source: 'local', data: [] });
  }

  try {
    const { category } = req.query;

    let query = supabaseServer
      .from('products')
      .select('*, categories ( id, name, description, image_url )')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category_id', category as string);
    }

    const { data, error } = await query;

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(200).json({ source: 'local', data: [] });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ source: 'supabase', data });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(200).json({ source: 'local', data: [] });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/orders — Public customer checkout without authentication.
 * Server validates customer fields, checks availability & stock in DB,
 * calculates totals strictly from DB prices, prevents duplicates, and updates stock atomically.
 */
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_address,
      pickup_window,
      payment_method,
      customer_notes,
      idempotency_key,
      items,
    } = req.body || {};

    const cleanName = typeof customer_name === 'string' ? customer_name.trim() : '';
    const cleanPhone = typeof customer_phone === 'string' ? customer_phone.trim() : '';
    const cleanAddress = typeof customer_address === 'string' ? customer_address.trim() : '';
    const cleanIdemKey = typeof idempotency_key === 'string' ? idempotency_key.trim() : '';

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Please enter a valid customer name.' });
    }
    if (cleanPhone.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid mobile phone number.' });
    }
    if (cleanAddress.length < 5) {
      return res.status(400).json({ error: 'Please enter a complete delivery address.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your order must include at least one item.' });
    }

    for (const it of items) {
      const qty = Number(it?.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 500) {
        return res.status(400).json({ error: 'Each item must have a valid positive quantity.' });
      }
    }

    // Check in-memory idempotency cache first
    if (cleanIdemKey && processedIdempotencyKeys.has(cleanIdemKey)) {
      const cached = processedIdempotencyKeys.get(cleanIdemKey)!;
      return res.status(200).json({
        success: true,
        duplicate: true,
        orderNumber: cached.orderNumber,
        orderId: cached.orderId,
        total: cached.total,
      });
    }

    const orderNumber = 'OAK-' + crypto.randomInt(100000, 999999);

    const uuidItems = items.map((it: any) => ({
      product_id: String(it.product_id || it.productId || ''),
      quantity: Number(it.quantity),
    }));

    // Local fallback when Supabase credentials aren't configured yet
    if (!supabaseServer) {
      const localRes = calculateAndCommitLocalOrder(uuidItems, orderNumber, cleanIdemKey);
      if (localRes.error) {
        return res.status(localRes.error.status).json({ error: localRes.error.message });
      }
      return res.status(201).json({
        success: true,
        source: 'local',
        orderNumber,
        orderId: localRes.orderId,
        total: localRes.total,
      });
    }

    // Verify all product IDs are UUIDs before calling Supabase DB; if not, check whether DB is actually reachable
    const hasAllUuids = uuidItems.every(it => isUuid(it.product_id));
    if (!hasAllUuids) {
      const { error: pingErr } = await supabaseServer.from('products').select('id').limit(1);
      if (pingErr && isSupabaseUnavailableError(pingErr)) {
        const localRes = calculateAndCommitLocalOrder(uuidItems, orderNumber, cleanIdemKey);
        if (localRes.error) {
          return res.status(localRes.error.status).json({ error: localRes.error.message });
        }
        return res.status(201).json({
          success: true,
          source: 'local',
          orderNumber,
          orderId: localRes.orderId,
          total: localRes.total,
        });
      }
      return res.status(400).json({
        error:
          'Some cart items reference offline demo IDs while connected to Supabase. Please refresh the menu and re-add items.',
      });
    }

    // 1. Try atomic transactional PostgreSQL RPC first
    const { data: rpcData, error: rpcError } = await supabaseServer.rpc(
      'create_order_with_stock_check',
      {
        p_order_number: orderNumber,
        p_customer_name: cleanName,
        p_customer_phone: cleanPhone,
        p_customer_address: cleanAddress,
        p_customer_notes: typeof customer_notes === 'string' ? customer_notes.trim() : '',
        p_payment_method:
          typeof payment_method === 'string' && payment_method.trim()
            ? payment_method.trim()
            : 'Pay at Bakery Counter',
        p_pickup_window:
          typeof pickup_window === 'string' && pickup_window.trim()
            ? pickup_window.trim()
            : 'Standard Window',
        p_idempotency_key: cleanIdemKey || null,
        p_items: uuidItems,
      }
    );

    if (!rpcError && rpcData) {
      const resultObj = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
      if (cleanIdemKey) {
        processedIdempotencyKeys.set(cleanIdemKey, {
          orderNumber: resultObj.order_number,
          orderId: resultObj.order_id,
          total: Number(resultObj.total_amount),
          createdAt: Date.now(),
        });
      }
      return res.status(resultObj.duplicate ? 200 : 201).json({
        success: true,
        source: 'supabase',
        orderNumber: resultObj.order_number,
        orderId: resultObj.order_id,
        total: Number(resultObj.total_amount),
        duplicate: Boolean(resultObj.duplicate),
      });
    }

    // If RPC returned a business validation error (e.g. out of stock / unavailable), report 400
    const rpcErrMsg = rpcError?.message || '';
    const isMissingRpc =
      rpcError?.code === '42883' ||
      rpcError?.code === 'PGRST202' ||
      rpcErrMsg.includes('Could not find the function');

    if (rpcError && !isMissingRpc) {
      if (isSupabaseUnavailableError(rpcError)) {
        const localRes = calculateAndCommitLocalOrder(uuidItems, orderNumber, cleanIdemKey);
        if (localRes.error) {
          return res.status(localRes.error.status).json({ error: localRes.error.message });
        }
        return res.status(201).json({
          success: true,
          source: 'local',
          orderNumber,
          orderId: localRes.orderId,
          total: localRes.total,
        });
      }
      return res.status(400).json({ error: rpcErrMsg });
    }

    // 2. Fallback server-side order flow if Phase 2 RPC has not been executed in SQL editor yet
    const productIds = [...new Set(uuidItems.map(i => i.product_id))];
    const { data: dbProducts, error: fetchErr } = await supabaseServer
      .from('products')
      .select('id, name, price, stock_quantity, is_available')
      .in('id', productIds);

    if (fetchErr || !dbProducts) {
      if (isSupabaseUnavailableError(fetchErr)) {
        const localRes = calculateAndCommitLocalOrder(uuidItems, orderNumber, cleanIdemKey);
        if (localRes.error) {
          return res.status(localRes.error.status).json({ error: localRes.error.message });
        }
        return res.status(201).json({
          success: true,
          source: 'local',
          orderNumber,
          orderId: localRes.orderId,
          total: localRes.total,
        });
      }
      return res.status(500).json({ error: fetchErr?.message || 'Failed to verify products.' });
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    let subtotal = 0;
    const verifiedItems: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
      current_stock: number;
    }> = [];

    for (const item of uuidItems) {
      const dbProd = productMap.get(item.product_id);
      if (!dbProd) {
        return res.status(404).json({ error: `Product not found.` });
      }
      if (!dbProd.is_available) {
        return res.status(400).json({ error: `"${dbProd.name}" is currently unavailable.` });
      }
      if (dbProd.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProd.name}". Only ${dbProd.stock_quantity} left.`,
        });
      }

      const unitPrice = Number(dbProd.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      verifiedItems.push({
        product_id: dbProd.id,
        product_name: dbProd.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        current_stock: dbProd.stock_quantity,
      });
    }

    const { data: order, error: orderErr } = await supabaseServer
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: cleanName,
        customer_phone: cleanPhone,
        customer_address: cleanAddress,
        subtotal,
        total_amount: subtotal,
        order_status: 'Pending',
        customer_notes: typeof customer_notes === 'string' ? customer_notes.trim() : '',
        payment_method:
          typeof payment_method === 'string' && payment_method.trim()
            ? payment_method.trim()
            : 'Pay at Bakery Counter',
        pickup_window:
          typeof pickup_window === 'string' && pickup_window.trim()
            ? pickup_window.trim()
            : 'Standard Window',
      })
      .select()
      .single();

    if (orderErr || !order) {
      return res.status(500).json({ error: orderErr?.message || 'Failed to create order.' });
    }

    const { error: itemsErr } = await supabaseServer.from('order_items').insert(
      verifiedItems.map(vi => ({
        order_id: order.id,
        product_id: vi.product_id,
        product_name: vi.product_name,
        quantity: vi.quantity,
        unit_price: vi.unit_price,
        line_total: vi.line_total,
      }))
    );

    if (itemsErr) {
      return res.status(500).json({ error: itemsErr.message });
    }

    for (const vi of verifiedItems) {
      await supabaseServer
        .from('products')
        .update({ stock_quantity: Math.max(0, vi.current_stock - vi.quantity) })
        .eq('id', vi.product_id);
    }

    if (cleanIdemKey) {
      processedIdempotencyKeys.set(cleanIdemKey, {
        orderNumber: order.order_number,
        orderId: order.id,
        total: subtotal,
        createdAt: Date.now(),
      });
    }

    return res.status(201).json({
      success: true,
      source: 'supabase',
      orderNumber: order.order_number,
      orderId: order.id,
      total: subtotal,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error creating order.' });
  }
});

// ========================================================
// PROTECTED ADMIN API ROUTES (requireAdminAuth)
// ========================================================

/**
 * GET /api/admin/products — All products including disabled items & exact stock
 */
app.get('/api/admin/products', requireAdminAuth, async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(200).json({ source: 'local', data: [] });
  }

  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*, categories ( id, name, description, image_url )')
      .order('created_at', { ascending: false });

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(200).json({ source: 'local', data: [] });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ source: 'supabase', data });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(200).json({ source: 'local', data: [] });
    }
    res.status(500).json({ error: err.message });
  }
});

const resolveCategoryId = async (categoryInput?: string): Promise<string | null> => {
  if (!supabaseServer || !categoryInput) return null;
  if (isUuid(categoryInput)) return categoryInput;

  const targetName = CATEGORY_SLUG_TO_NAME[categoryInput] || categoryInput;
  const { data } = await supabaseServer
    .from('categories')
    .select('id, name')
    .ilike('name', `%${targetName}%`)
    .limit(1);

  return data && data.length > 0 ? data[0].id : null;
};

/**
 * POST /api/admin/products — Create product
 */
app.post('/api/admin/products', requireAdminAuth, async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(201).json({ success: true, source: 'local' });
  }

  try {
    const {
      name,
      description,
      category_id,
      category,
      price,
      image_url,
      stock_quantity = 50,
      is_available = true,
      weight,
      flavor,
      ingredients,
      allergens,
      is_best_seller = false,
      is_featured = false,
    } = req.body || {};

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const numPrice = Number(price);
    const numStock = Number(stock_quantity);

    if (!cleanName || !Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Valid product name and non-negative price are required.' });
    }
    if (!Number.isInteger(numStock) || numStock < 0) {
      return res.status(400).json({ error: 'Stock quantity must be a non-negative integer.' });
    }

    const resolvedCatId = await resolveCategoryId(category_id || category);

    const { data, error } = await supabaseServer
      .from('products')
      .insert({
        name: cleanName,
        description: typeof description === 'string' ? description.trim() : '',
        category_id: resolvedCatId,
        price: numPrice,
        image_url: typeof image_url === 'string' ? image_url.trim() : '',
        stock_quantity: numStock,
        is_available: Boolean(is_available),
        weight: typeof weight === 'string' ? weight.trim() : 'Standard Serving',
        flavor: typeof flavor === 'string' ? flavor.trim() : 'Bakery Fresh',
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        allergens: Array.isArray(allergens) ? allergens : [],
        is_best_seller: Boolean(is_best_seller),
        is_featured: Boolean(is_featured),
      })
      .select('*, categories (*)')
      .single();

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(201).json({ success: true, source: 'local' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ success: true, product: data });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(201).json({ success: true, source: 'local' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/products/:id — Update product
 */
app.put('/api/admin/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(200).json({ success: true, source: 'local' });
  }

  try {
    const id = String(req.params.id || '');
    if (!isUuid(id)) {
      return res.status(200).json({ success: true, source: 'local' });
    }

    const body = req.body || {};
    const updates: Record<string, any> = {};

    if (body.name !== undefined) {
      const cleanName = String(body.name).trim();
      if (!cleanName) return res.status(400).json({ error: 'Product name cannot be empty.' });
      updates.name = cleanName;
    }
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.price !== undefined) {
      const numPrice = Number(body.price);
      if (!Number.isFinite(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'Price must be a valid non-negative number.' });
      }
      updates.price = numPrice;
    }
    if (body.stock_quantity !== undefined) {
      const numStock = Number(body.stock_quantity);
      if (!Number.isInteger(numStock) || numStock < 0) {
        return res.status(400).json({ error: 'Stock quantity must be a non-negative integer.' });
      }
      updates.stock_quantity = numStock;
    }
    if (body.is_available !== undefined) updates.is_available = Boolean(body.is_available);
    if (body.image_url !== undefined) updates.image_url = String(body.image_url).trim();
    if (body.weight !== undefined) updates.weight = String(body.weight).trim();
    if (body.flavor !== undefined) updates.flavor = String(body.flavor).trim();
    if (body.ingredients !== undefined && Array.isArray(body.ingredients)) {
      updates.ingredients = body.ingredients;
    }
    if (body.allergens !== undefined && Array.isArray(body.allergens)) {
      updates.allergens = body.allergens;
    }
    if (body.category_id !== undefined || body.category !== undefined) {
      const resolvedCatId = await resolveCategoryId(body.category_id || body.category);
      if (resolvedCatId) updates.category_id = resolvedCatId;
    }

    const { data, error } = await supabaseServer
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, categories (*)')
      .single();

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(200).json({ success: true, source: 'local' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, product: data });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(200).json({ success: true, source: 'local' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/products/:id — Delete product
 */
app.delete('/api/admin/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(200).json({ success: true, source: 'local' });
  }

  try {
    const id = String(req.params.id || '');
    if (!isUuid(id)) {
      return res.status(200).json({ success: true, source: 'local' });
    }

    const { error } = await supabaseServer.from('products').delete().eq('id', id);

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(200).json({ success: true, source: 'local' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(200).json({ success: true, source: 'local' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/upload-image — Upload product image securely via service role
 */
app.post('/api/admin/upload-image', requireAdminAuth, async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: 'Supabase storage is not configured on the server.' });
  }

  try {
    const { fileName, mimeType, base64Data } = req.body || {};
    if (!fileName || !base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ error: 'Missing image file payload.' });
    }

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
    const cleanMime = typeof mimeType === 'string' ? mimeType.toLowerCase() : 'image/jpeg';
    if (!allowedTypes.has(cleanMime)) {
      return res.status(400).json({ error: 'Only JPEG, PNG, WEBP, and GIF images are allowed.' });
    }

    const stripped = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(stripped, 'base64');
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size must be 10MB or smaller.' });
    }

    const safeName = `${Date.now()}_${String(fileName).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabaseServer.storage
      .from('product-images')
      .upload(safeName, buffer, {
        contentType: cleanMime,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data: publicUrlData } = supabaseServer.storage
      .from('product-images')
      .getPublicUrl(safeName);

    res.json({ success: true, url: publicUrlData.publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/orders — Protected orders list + dashboard statistics
 */
app.get('/api/admin/orders', requireAdminAuth, async (req: Request, res: Response) => {
  if (!supabaseServer) {
    return res.status(200).json({ source: 'local', data: [], stats: null });
  }

  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select('*, order_items (*)')
      .order('created_at', { ascending: false });

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(200).json({ source: 'local', data: [], stats: null });
      }
      return res.status(500).json({ error: error.message });
    }

    const ordersList = data || [];
    const totalSales = ordersList
      .filter(o => o.order_status !== 'Cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    res.json({
      source: 'supabase',
      data: ordersList,
      stats: {
        totalOrders: ordersList.length,
        pendingOrders: ordersList.filter(o =>
          ['Pending', 'Confirmed', 'Preparing'].includes(o.order_status)
        ).length,
        totalSales,
      },
    });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(200).json({ source: 'local', data: [], stats: null });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/status — Protected order status update
 */
app.patch('/api/admin/orders/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const order_status = String(req.body?.order_status || '').trim();

    if (!ALLOWED_ORDER_STATUSES.has(order_status)) {
      return res.status(400).json({ error: 'Invalid order status value.' });
    }

    if (!supabaseServer || !isUuid(id)) {
      return res.status(200).json({ success: true, source: 'local' });
    }

    const { data, error } = await supabaseServer
      .from('orders')
      .update({ order_status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return res.status(200).json({ success: true, source: 'local' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, order: data });
  } catch (err: any) {
    if (isSupabaseUnavailableError(err)) {
      return res.status(200).json({ success: true, source: 'local' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Protect legacy mutation paths as well so no unauthenticated access is possible
app.post('/api/products', requireAdminAuth, (req, res) =>
  res.status(403).json({ error: 'Use /api/admin/products' })
);
app.put('/api/products/:id', requireAdminAuth, (req, res) =>
  res.status(403).json({ error: 'Use /api/admin/products/:id' })
);
app.delete('/api/products/:id', requireAdminAuth, (req, res) =>
  res.status(403).json({ error: 'Use /api/admin/products/:id' })
);
app.get('/api/orders', requireAdminAuth, (req, res) =>
  res.status(403).json({ error: 'Use /api/admin/orders' })
);
app.patch('/api/orders/:id/status', requireAdminAuth, (req, res) =>
  res.status(403).json({ error: 'Use /api/admin/orders/:id/status' })
);

// ========================================================
// VITE DEV SERVER MIDDLEWARE & STATIC ASSET SERVING
// ========================================================
const startServer = async () => {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OVEN & OAK] Server running on http://0.0.0.0:${PORT} (Production: ${isProd})`);
    if (supabaseServer) {
      console.log(`[OVEN & OAK] Supabase client initialized with endpoint: ${supabaseUrl}`);
    } else {
      console.log(`[OVEN & OAK] Supabase credentials not found. Operating with local fallback data.`);
    }
  });
};

startServer().catch(err => {
  console.error('[OVEN & OAK] Server failed to start:', err);
});
