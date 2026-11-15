-- ========================================================
-- OVEN & OAK — SUPABASE BACKEND SCHEMA & MIGRATIONS
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- 1. CATEGORIES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------
-- 2. PRODUCTS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 50 CHECK (stock_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    weight TEXT DEFAULT 'Standard Serving',
    flavor TEXT DEFAULT 'Bakery Fresh',
    ingredients TEXT[] DEFAULT ARRAY[]::TEXT[],
    allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_best_seller BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------
-- 3. ORDERS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    order_status TEXT NOT NULL DEFAULT 'Pending' CHECK (order_status IN (
        'Pending', 'Confirmed', 'Preparing', 'Ready', 'Ready for Pickup',
        'Out for Delivery', 'Delivered', 'Completed', 'Cancelled'
    )),
    customer_notes TEXT,
    payment_method TEXT DEFAULT 'Pay at Bakery Counter',
    pickup_window TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Safe migrations for existing Phase 1 deployments
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (
    order_status IN (
        'Pending', 'Confirmed', 'Preparing', 'Ready', 'Ready for Pickup',
        'Out for Delivery', 'Delivered', 'Completed', 'Cancelled'
    )
);

-- --------------------------------------------------------
-- 4. ORDER ITEMS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

-- --------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- --------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------
-- ATOMIC TRANSACTIONAL ORDER CREATION & STOCK DEDUCTION
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_with_stock_check(
    p_order_number TEXT,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_address TEXT,
    p_customer_notes TEXT,
    p_payment_method TEXT,
    p_pickup_window TEXT,
    p_idempotency_key TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_order RECORD;
    v_order_id UUID;
    v_item JSONB;
    v_product RECORD;
    v_product_id UUID;
    v_qty INTEGER;
    v_line_total NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2) := 0;
BEGIN
    -- 1. Prevent duplicate order submission using idempotency key
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
        SELECT id, order_number, subtotal, total_amount
        INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = p_idempotency_key
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'order_id', v_existing_order.id,
                'order_number', v_existing_order.order_number,
                'subtotal', v_existing_order.subtotal,
                'total_amount', v_existing_order.total_amount,
                'duplicate', true
            );
        END IF;
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item';
    END IF;

    -- 2. Validate availability, lock rows FOR UPDATE, and calculate subtotal from DB prices
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;

        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid item quantity';
        END IF;

        SELECT id, name, price, stock_quantity, is_available
        INTO v_product
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        IF NOT v_product.is_available THEN
            RAISE EXCEPTION 'Product "%" is currently unavailable', v_product.name;
        END IF;

        IF v_product.stock_quantity < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for "%" (available: %)', v_product.name, v_product.stock_quantity;
        END IF;

        v_subtotal := v_subtotal + (v_product.price * v_qty);
    END LOOP;

    -- 3. Insert order header
    INSERT INTO public.orders (
        order_number,
        customer_name,
        customer_phone,
        customer_address,
        subtotal,
        total_amount,
        order_status,
        customer_notes,
        payment_method,
        pickup_window,
        idempotency_key
    ) VALUES (
        p_order_number,
        trim(p_customer_name),
        trim(p_customer_phone),
        trim(p_customer_address),
        v_subtotal,
        v_subtotal,
        'Pending',
        COALESCE(p_customer_notes, ''),
        COALESCE(p_payment_method, 'Pay at Bakery Counter'),
        COALESCE(p_pickup_window, 'Standard Window'),
        NULLIF(trim(COALESCE(p_idempotency_key, '')), '')
    )
    RETURNING id INTO v_order_id;

    -- 4. Insert order items and deduct stock atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;

        SELECT id, name, price
        INTO v_product
        FROM public.products
        WHERE id = v_product_id;

        v_line_total := v_product.price * v_qty;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            line_total
        ) VALUES (
            v_order_id,
            v_product.id,
            v_product.name,
            v_qty,
            v_product.price,
            v_line_total
        );

        UPDATE public.products
        SET stock_quantity = stock_quantity - v_qty
        WHERE id = v_product.id;
    END LOOP;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', p_order_number,
        'subtotal', v_subtotal,
        'total_amount', v_subtotal,
        'duplicate', false
    );
END;
$$;

-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES (PHASE 2 HARDENED)
-- --------------------------------------------------------
-- Note: SUPABASE_SERVICE_ROLE_KEY used strictly on server.ts automatically bypasses RLS.
-- Public anon key can ONLY read categories and active products. All writes & order reads
-- are strictly locked down to the server.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories: Public read-only
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON public.categories;
CREATE POLICY "Public can view categories" 
    ON public.categories FOR SELECT 
    USING (true);

-- Products: Public read-only for enabled/available products (no customer writes)
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Service role can manage products" ON public.products;
CREATE POLICY "Public can view products" 
    ON public.products FOR SELECT 
    USING (is_available = true);

-- Orders: Strictly private (customers cannot read other customers' orders or write fake totals)
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;

-- Order Items: Strictly private
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;

-- --------------------------------------------------------
-- 5. STORAGE BUCKET CONFIGURATION (product-images)
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies: Public read-only; uploads/deletes strictly through authenticated admin server endpoint
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete product images" ON storage.objects;

CREATE POLICY "Public can read product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

-- --------------------------------------------------------
-- 6. SEED DATA: 8 BAKERY CATEGORIES
-- --------------------------------------------------------
INSERT INTO public.categories (id, name, description, image_url)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'Small Pizza', 'Freshly baked individual 6-inch personal pizzas with spiced fillings and melted mozzarella.', '/src/assets/images/small_pizza_tikka_1793384934555.jpg'),
    ('c2222222-2222-2222-2222-222222222222', 'Cakes', 'Artisanal layered celebration cakes, rich Belgian chocolate ganache, and cream sponges.', '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg'),
    ('c3333333-3333-3333-3333-333333333333', 'Brownies', 'Dense, chewy chocolate squares with crackly tops, toasted nuts, and molten centers.', '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg'),
    ('c4444444-4444-4444-4444-444444444444', 'Buns', 'Soft golden bakery buns stuffed with seasoned chicken mince or sweetened with fresh cream.', '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg'),
    ('c5555555-5555-5555-5555-555555555555', 'Fresh Bread', 'Daily oven-baked soft milky sandwich bread, rustic bran loaves, and sliced breakfast bread.', '/src/assets/images/fresh_sliced_bread_1793384935958.jpg'),
    ('c6666666-6666-6666-6666-666666666666', 'Blue Band', 'Original enriched vitamin margarine and breakfast spreads for fresh morning toast.', '/src/assets/images/blue_band_margarine_1793384955886.jpg'),
    ('c7777777-7777-7777-7777-777777777777', 'Chips', 'House-special crinkle-cut potato crisps tossed with secret bakery chatkhara spices.', '/src/assets/images/crispy_potato_chips_1793385083217.jpg'),
    ('c8888888-8888-8888-8888-888888888888', 'Cold Drinks', 'Chilled glass bottles, gourmet craft sodas, and fresh ice-cold beverages.', '/src/assets/images/cold_drinks_soda_1793384956354.jpg')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description, image_url = EXCLUDED.image_url;

-- --------------------------------------------------------
-- 7. SEED DATA: PRODUCTS IN PAKISTANI RUPEES (PKR / Rs.)
-- --------------------------------------------------------
INSERT INTO public.products (id, name, description, category_id, price, image_url, stock_quantity, is_available, weight, flavor, ingredients, allergens, is_best_seller, is_featured)
VALUES 
    -- Small Pizza
    ('p1111111-1111-1111-1111-111111111111', 'Chicken Tikka Small Pizza', '6-inch personal stone-baked pizza loaded with spicy marinated chicken tikka, bell peppers, onions, and melted mozzarella.', 'c1111111-1111-1111-1111-111111111111', 390.00, '/src/assets/images/small_pizza_tikka_1793384934555.jpg', 40, true, '6-inch Individual (260g)', 'Spicy Chicken Tikka & Herbs', ARRAY['Refined Flour Dough', 'Spiced Chicken Tikka', 'Mozzarella Cheese', 'Pizza Sauce', 'Capsicum', 'Onions', 'Oregano'], ARRAY['Wheat (Gluten)', 'Milk / Dairy'], true, true),
    ('p1111111-1111-1111-1111-111111111112', 'Chicken Fajita Small Pizza', 'Mildly spiced Mexican-style chicken strips with black olives, mushrooms, sweet corn, and double mozzarella.', 'c1111111-1111-1111-1111-111111111111', 420.00, '/src/assets/images/small_pizza_tikka_1793384934555.jpg', 35, true, '6-inch Individual (280g)', 'Smoky Chicken Fajita & Olives', ARRAY['Stoneground Flour', 'Fajita Seasoned Chicken', 'Mozzarella', 'Black Olives', 'Button Mushrooms', 'Garlic Butter'], ARRAY['Wheat (Gluten)', 'Milk / Dairy'], false, true),
    ('p1111111-1111-1111-1111-111111111113', 'Four-Cheese Melt Small Pizza', 'Pure vegetarian cheesy bliss with melted mozzarella, cheddar, cottage cheese and Italian herbs.', 'c1111111-1111-1111-1111-111111111111', 350.00, '/src/assets/images/small_pizza_tikka_1793384934555.jpg', 30, true, '6-inch Individual (240g)', 'Rich Mozzarella & Cheddar', ARRAY['Pizza Dough', 'Mozzarella', 'Aged Cheddar', 'Cottage Cheese', 'Tomato Basil Sauce', 'Dried Basil'], ARRAY['Wheat (Gluten)', 'Milk / Dairy'], false, false),

    -- Cakes
    ('p2222222-2222-2222-2222-222222222221', 'Belgian Dark Fudge Cake (1 Lb)', 'Moist dark cocoa sponge layered with molten Belgian chocolate fudge and crowned with dark chocolate curls.', 'c2222222-2222-2222-2222-222222222222', 1450.00, '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg', 20, true, '1 Lb (approx. 450g)', 'Deep Belgian Chocolate Fudge', ARRAY['Imported Dark Cocoa', 'Fresh Cream', 'Butter', 'Farm Eggs', 'Refined Wheat Flour', 'Brown Sugar'], ARRAY['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'], true, true),
    ('p2222222-2222-2222-2222-222222222222', 'Belgian Dark Fudge Cake (2 Lbs)', 'Double-tier luxury chocolate fudge cake, perfect for family birthdays, celebrations and anniversaries.', 'c2222222-2222-2222-2222-222222222222', 2600.00, '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg', 15, true, '2 Lbs (approx. 900g)', 'Double Belgian Chocolate Ganache', ARRAY['Dutch-Processed Cocoa', 'Dairy Cream', 'Grass-Fed Butter', 'Eggs', 'Pure Vanilla Bean', 'Dark Chocolate Shavings'], ARRAY['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'], false, false),
    ('p2222222-2222-2222-2222-222222222223', 'Classic Red Velvet Cream Cheese Cake', 'Vibrant crimson velvet sponge with gentle buttermilk tang, layered with whipped Philadelphia cream cheese.', 'c2222222-2222-2222-2222-222222222222', 1650.00, '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg', 18, true, '1 Lb (approx. 480g)', 'Tangy Cream Cheese & Vanilla', ARRAY['Buttermilk', 'Cultured Cream Cheese', 'Flour', 'Cocoa Powder', 'Pure Vanilla', 'Beetroot Extract'], ARRAY['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'], false, false),

    -- Brownies
    ('p3333333-3333-3333-3333-333333333331', 'Roasted Walnut Fudge Brownie', 'Chewy, fudgy chocolate square loaded with toasted Swat valley walnuts and a glossy crinkled crust.', 'c3333333-3333-3333-3333-333333333333', 220.00, '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg', 60, true, 'Single Serving (115g)', 'Dark Chocolate & Roasted Walnut', ARRAY['70% Dark Chocolate', 'Swat Valley Walnuts', 'Fresh Butter', 'Eggs', 'Cane Sugar', 'Flour'], ARRAY['Wheat (Gluten)', 'Tree Nuts (Walnuts)', 'Milk / Dairy', 'Eggs'], true, true),
    ('p3333333-3333-3333-3333-333333333332', 'Triple Chocolate Molten Brownie', 'Intense cocoa batter folded with milk chocolate chips, dark chunks, and white chocolate drops.', 'c3333333-3333-3333-3333-333333333333', 240.00, '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg', 50, true, 'Single Serving (120g)', 'Triple Chocolate Melt', ARRAY['Cocoa Mass', 'Milk Chocolate Chips', 'Dark Chocolate Chips', 'Butter', 'Eggs', 'Flour'], ARRAY['Wheat (Gluten)', 'Milk / Dairy', 'Eggs', 'Soy'], false, true),
    ('p3333333-3333-3333-3333-333333333333', 'Salted Caramel Drizzle Brownie', 'Dense fudge brownie swirled with golden brown butter caramel and pink Himalayan salt.', 'c3333333-3333-3333-3333-333333333333', 230.00, '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg', 45, true, 'Single Serving (115g)', 'Salted Toffee Caramel', ARRAY['Dark Chocolate', 'Butter Caramel', 'Himalayan Pink Salt', 'Butter', 'Eggs', 'Flour'], ARRAY['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'], false, false),

    -- Buns
    ('p4444444-4444-4444-4444-444444444441', 'Classic Bakery Chicken Stuffed Bun', 'Soft pillowy milk bun packed with savory shredded chicken, green chilies, coriander, and black pepper.', 'c4444444-4444-4444-4444-444444444444', 140.00, '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg', 80, true, 'Single Large Bun (140g)', 'Savory Black Pepper Chicken', ARRAY['Flour', 'Milk', 'Shredded Chicken Breast', 'Green Chilies', 'Black Pepper', 'Coriander', 'Sesame Seeds'], ARRAY['Wheat (Gluten)', 'Milk / Dairy', 'Eggs', 'Sesame'], true, true),
    ('p4444444-4444-4444-4444-444444444442', 'Fresh Dairy Cream Bun', 'Light sweet bun split open and piped with chilled sweetened dairy cream and strawberry glaze dot.', 'c4444444-4444-4444-4444-444444444444', 120.00, '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg', 60, true, 'Single Bun (110g)', 'Sweet Dairy Cream & Vanilla', ARRAY['Sweet Milk Dough', 'Whipped Dairy Cream', 'Vanilla Essence', 'Caster Sugar', 'Fruit Glaze'], ARRAY['Wheat (Gluten)', 'Milk / Dairy'], false, true),
    ('p4444444-4444-4444-4444-444444444443', 'Sesame Gourmet Burger Buns (Pack of 4)', 'Pack of 4 brioche-style fluffy burger buns generously sprinkled with golden sesame seeds.', 'c4444444-4444-4444-4444-444444444444', 180.00, '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg', 40, true, 'Pack of 4 Buns (320g)', 'Buttery Brioche & Toasted Sesame', ARRAY['High-Protein Flour', 'Butter', 'Milk', 'Yeast', 'Golden Sesame Seeds', 'Sea Salt'], ARRAY['Wheat (Gluten)', 'Milk / Dairy', 'Sesame'], false, false),

    -- Fresh Bread
    ('p5555555-5555-5555-5555-555555555551', 'Plain Milky Sandwich Bread (Large)', 'Soft, sliced everyday breakfast bread baked with fresh whole milk and pure butter.', 'c5555555-5555-5555-5555-555555555555', 240.00, '/src/assets/images/fresh_sliced_bread_1793384935958.jpg', 50, true, 'Large Loaf 650g (18 Slices)', 'Sweet Whole Milk & Butter', ARRAY['Enriched Wheat Flour', 'Fresh Whole Milk', 'Pure Butter', 'Yeast', 'Cane Sugar', 'Salt'], ARRAY['Wheat (Gluten)', 'Milk / Dairy'], true, true),
    ('p5555555-5555-5555-5555-555555555552', 'Healthy Whole Wheat Bran Bread', '100% stoneground whole wheat loaf enriched with natural wheat germ and toasted bran flakes.', 'c5555555-5555-5555-5555-555555555555', 280.00, '/src/assets/images/fresh_sliced_bread_1793384935958.jpg', 35, true, 'Medium Loaf 500g (14 Slices)', 'Toasted Wheat Grain & Bran', ARRAY['100% Stoneground Whole Wheat', 'Wheat Bran', 'Malted Barley', 'Yeast', 'Pure Spring Water', 'Salt'], ARRAY['Wheat (Gluten)'], false, false),
    ('p5555555-5555-5555-5555-555555555553', 'Herbed Garlic Butter Pull-Apart Loaf', 'Crusty loaf scored and drenched with roasted garlic butter, parsley, and parmesan cheese.', 'c5555555-5555-5555-5555-555555555555', 320.00, '/src/assets/images/fresh_sliced_bread_1793384935958.jpg', 30, true, 'Loaf (420g)', 'Roasted Garlic & Garden Herbs', ARRAY['Artisan Bread Flour', 'Cultured Butter', 'Roasted Garlic', 'Fresh Parsley', 'Sea Salt', 'Black Pepper'], ARRAY['Wheat (Gluten)', 'Milk / Dairy'], false, false),

    -- Blue Band
    ('p6666666-6666-6666-6666-666666666661', 'Blue Band Margarine Spread (200g Tub)', 'Original breakfast margarine spread enriched with Vitamins A, D, and essential fatty acids.', 'c6666666-6666-6666-6666-666666666666', 280.00, '/src/assets/images/blue_band_margarine_1793384955886.jpg', 70, true, '200g Sealed Tub', 'Classic Rich Butter Flavor', ARRAY['Vegetable Oils (Palm, Canola)', 'Water', 'Salt', 'Milk Solids', 'Vitamins A & D', 'Natural Beta Carotene'], ARRAY['Milk Solids'], true, true),
    ('p6666666-6666-6666-6666-666666666662', 'Blue Band Margarine Spread (450g Family Pack)', 'Economical family size tub for daily baking, breakfast spreading, and cooking.', 'c6666666-6666-6666-6666-666666666666', 560.00, '/src/assets/images/blue_band_margarine_1793384955886.jpg', 45, true, '450g Family Tub', 'Classic Rich Butter Flavor', ARRAY['Refined Vegetable Oils', 'Water', 'Iodized Salt', 'Emulsifiers', 'Vitamin Fortification (A, B6, B12, D, E)'], ARRAY['Milk Solids'], false, false),

    -- Chips
    ('p7777777-7777-7777-7777-777777777771', 'Bakery Special Masala Crinkle Chips (120g)', 'Extra-thick wavy cut potato chips dusted with our signature sweet & tangy chatpata masala.', 'c7777777-7777-7777-7777-777777777777', 130.00, '/src/assets/images/crispy_potato_chips_1793385083217.jpg', 100, true, '120g Fresh Pack', 'Chatpata Masala & Tangy Mango', ARRAY['Farm Fresh Potatoes', 'Sunflower Oil', 'Black Salt', 'Red Chili', 'Dry Mango Powder', 'Cumin', 'Coriander'], ARRAY[]::TEXT[], true, true),
    ('p7777777-7777-7777-7777-777777777772', 'Sea Salt & Black Pepper Crisps (120g)', 'Light and crispy thin potato crisps seasoned with pure rock sea salt and cracked black peppercorns.', 'c7777777-7777-7777-7777-777777777777', 130.00, '/src/assets/images/crispy_potato_chips_1793385083217.jpg', 90, true, '120g Fresh Pack', 'Sea Salt & Cracked Pepper', ARRAY['Potatoes', 'Vegetable Oil', 'Pure Sea Salt', 'Crushed Black Pepper'], ARRAY[]::TEXT[], false, false),
    ('p7777777-7777-7777-7777-777777777773', 'Bakery Special Masala Chips (Jumbo 250g)', 'Large party pack of our addictive crinkle-cut masala crisps, sealed for maximum freshness.', 'c7777777-7777-7777-7777-777777777777', 240.00, '/src/assets/images/crispy_potato_chips_1793385083217.jpg', 50, true, '250g Jumbo Pack', 'Signature Chatpata Spice', ARRAY['Potatoes', 'Vegetable Oil', 'Spice Mix', 'Salt'], ARRAY[]::TEXT[], false, false),

    -- Cold Drinks
    ('p8888888-8888-8888-8888-888888888881', 'Pakola Ice Cream Soda (Chilled Can)', 'Pakistan’s national pride drink, ice-cold with sweet vanilla cream and fragrant green soda.', 'c8888888-8888-8888-8888-888888888888', 90.00, '/src/assets/images/cold_drinks_soda_1793384956354.jpg', 120, true, '250ml Chilled Can', 'Vanilla Ice Cream Soda', ARRAY['Carbonated Water', 'Sugar', 'Citric Acid', 'Artificial Ice Cream Flavor', 'Permitted Food Color'], ARRAY[]::TEXT[], true, true),
    ('p8888888-8888-8888-8888-888888888882', 'Fresh Mint Lemonade Soda (Chilled Bottle)', 'House-made sparkling lemonade with freshly crushed garden mint leaves and black salt.', 'c8888888-8888-8888-8888-888888888888', 160.00, '/src/assets/images/cold_drinks_soda_1793384956354.jpg', 40, true, '330ml Glass Bottle', 'Fresh Lemon & Garden Mint', ARRAY['Sparkling Spring Water', 'Fresh Lemon Juice', 'Wild Mint Leaves', 'Cane Sugar', 'Black Salt'], ARRAY[]::TEXT[], false, true),
    ('p8888888-8888-8888-8888-888888888883', 'Classic Gourmet Cola (500ml Chilled)', 'Crisp, highly carbonated classic dark cola with refreshing caramel and citrus undertones.', 'c8888888-8888-8888-8888-888888888888', 110.00, '/src/assets/images/cold_drinks_soda_1793384956354.jpg', 80, true, '500ml PET Bottle', 'Classic Sparkling Cola', ARRAY['Carbonated Water', 'Sugar', 'Caramel Color', 'Caffeine', 'Phosphoric Acid', 'Natural Flavors'], ARRAY[]::TEXT[], false, false)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    stock_quantity = EXCLUDED.stock_quantity,
    is_available = EXCLUDED.is_available,
    weight = EXCLUDED.weight,
    flavor = EXCLUDED.flavor,
    ingredients = EXCLUDED.ingredients,
    allergens = EXCLUDED.allergens,
    is_best_seller = EXCLUDED.is_best_seller,
    is_featured = EXCLUDED.is_featured;
