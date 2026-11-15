export type ProductCategory = 
  | 'small-pizza'
  | 'cakes'
  | 'brownies'
  | 'buns'
  | 'fresh-bread'
  | 'blue-band'
  | 'chips'
  | 'cold-drinks';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number; // Stored in Pakistani Rupees (PKR)
  shortDesc: string;
  fullDesc: string;
  image: string;
  weight: string; // Size or portion weight
  flavor: string;
  ingredients: string[];
  allergens: string[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  stockQuantity?: number;
  isAvailable?: boolean;
  stockStatus?: 'In Stock' | 'Low Stock' | 'Sold Out';
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export interface CustomerOrder {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerEmail: string;
  pickupWindow: string;
  paymentMethod: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  status: OrderStatus;
}

export interface CategoryInfo {
  id: ProductCategory;
  title: string;
  desc: string;
  count: string;
  iconName?: string;
  image: string;
}

export const CATEGORIES_LIST: CategoryInfo[] = [
  {
    id: 'small-pizza',
    title: 'Small Pizza',
    desc: 'Freshly baked individual 6-inch personal pizzas with spiced fillings and melted mozzarella.',
    count: '3 Varieties',
    image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg'
  },
  {
    id: 'cakes',
    title: 'Cakes',
    desc: 'Artisanal layered celebration cakes, rich Belgian chocolate ganache, and cream sponges.',
    count: '4 Flavors',
    image: '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg'
  },
  {
    id: 'brownies',
    title: 'Brownies',
    desc: 'Dense, chewy chocolate squares with crackly tops, toasted nuts, and molten centers.',
    count: '3 Varieties',
    image: '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg'
  },
  {
    id: 'buns',
    title: 'Buns',
    desc: 'Soft golden bakery buns stuffed with seasoned chicken mince or sweetened with fresh cream.',
    count: '4 Styles',
    image: '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg'
  },
  {
    id: 'fresh-bread',
    title: 'Fresh Bread',
    desc: 'Daily oven-baked soft milky sandwich bread, rustic bran loaves, and sliced breakfast bread.',
    count: '3 Loaves',
    image: '/src/assets/images/fresh_sliced_bread_1793384935958.jpg'
  },
  {
    id: 'blue-band',
    title: 'Blue Band',
    desc: 'Original enriched vitamin margarine and breakfast spreads for fresh morning toast.',
    count: '2 Pack Sizes',
    image: '/src/assets/images/blue_band_margarine_1793384955886.jpg'
  },
  {
    id: 'chips',
    title: 'Chips',
    desc: 'House-special crinkle-cut potato crisps tossed with secret bakery chatkhara spices.',
    count: '3 Flavors',
    image: '/src/assets/images/crispy_potato_chips_1793385083217.jpg'
  },
  {
    id: 'cold-drinks',
    title: 'Cold Drinks',
    desc: 'Chilled glass bottles, gourmet craft sodas, and fresh ice-cold beverages.',
    count: '4 Refreshers',
    image: '/src/assets/images/cold_drinks_soda_1793384956354.jpg'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Small Pizza
  {
    id: 'pizza-chicken-tikka',
    name: 'Chicken Tikka Small Pizza',
    category: 'small-pizza',
    categoryLabel: 'Small Pizza',
    price: 390,
    shortDesc: '6-inch personal stone-baked pizza loaded with spicy marinated chicken tikka, bell peppers, onions, and melted mozzarella.',
    fullDesc: 'A bakery classic baked on our stone deck oven. Made with fresh daily pizza dough, tangy tomato-herb sauce, spiced tandoori chicken chunks, diced red onions, crunchy green peppers, and 100% pure shredded mozzarella cheese.',
    image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg',
    weight: '6-inch Individual (260g)',
    flavor: 'Spicy Chicken Tikka & Herbs',
    ingredients: ['Refined Flour Dough', 'Spiced Chicken Tikka', 'Mozzarella Cheese', 'Pizza Sauce', 'Capsicum', 'Onions', 'Oregano'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy'],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'pizza-fajita-supreme',
    name: 'Chicken Fajita Small Pizza',
    category: 'small-pizza',
    categoryLabel: 'Small Pizza',
    price: 420,
    shortDesc: 'Mildly spiced Mexican-style chicken strips with black olives, mushrooms, sweet corn, and double mozzarella.',
    fullDesc: 'Golden baked 6-inch hand-stretched crust topped with tender fajita-seasoned chicken breast, sliced black olives, button mushrooms, sweet golden corn, and aromatic garlic butter crust drizzle.',
    image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg',
    weight: '6-inch Individual (280g)',
    flavor: 'Smoky Chicken Fajita & Olives',
    ingredients: ['Stoneground Flour', 'Fajita Seasoned Chicken', 'Mozzarella', 'Black Olives', 'Button Mushrooms', 'Garlic Butter'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy'],
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'pizza-cheese-lover',
    name: 'Four-Cheese Melt Small Pizza',
    category: 'small-pizza',
    categoryLabel: 'Small Pizza',
    price: 350,
    shortDesc: 'Pure vegetarian cheesy bliss with melted mozzarella, cheddar, cottage cheese and Italian herbs.',
    fullDesc: 'Crisp golden crust smothered in slow-cooked San Marzano style tomato base and a decadent blend of four cheeses, finished with dried oregano and virgin olive oil.',
    image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg',
    weight: '6-inch Individual (240g)',
    flavor: 'Rich Mozzarella & Cheddar',
    ingredients: ['Pizza Dough', 'Mozzarella', 'Aged Cheddar', 'Cottage Cheese', 'Tomato Basil Sauce', 'Dried Basil'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy'],
    stockStatus: 'In Stock'
  },

  // 2. Cakes
  {
    id: 'cake-belgian-fudge',
    name: 'Belgian Dark Fudge Cake (1 Lb)',
    category: 'cakes',
    categoryLabel: 'Cakes',
    price: 1450,
    shortDesc: 'Moist dark cocoa sponge layered with molten Belgian chocolate fudge and crowned with dark chocolate curls.',
    fullDesc: 'Our most celebrated celebration cake. Crafted with 70% dark Belgian cocoa powder, layered with silky boiled chocolate fudge frosting, and glazed with glossy dark ganache that melts softly on the tongue.',
    image: '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg',
    weight: '1 Lb (approx. 450g)',
    flavor: 'Deep Belgian Chocolate Fudge',
    ingredients: ['Imported Dark Cocoa', 'Fresh Cream', 'Butter', 'Farm Eggs', 'Refined Wheat Flour', 'Brown Sugar'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'cake-belgian-fudge-2lb',
    name: 'Belgian Dark Fudge Cake (2 Lbs)',
    category: 'cakes',
    categoryLabel: 'Cakes',
    price: 2600,
    shortDesc: 'Double-tier luxury chocolate fudge cake, perfect for family birthdays, celebrations and anniversaries.',
    fullDesc: 'Generous two-pound edition of our signature Belgian fudge cake. Multi-layered sponge filled with whipped cocoa cream, enrobed in glossy ganache and finished with handcrafted chocolate bark.',
    image: '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg',
    weight: '2 Lbs (approx. 900g)',
    flavor: 'Double Belgian Chocolate Ganache',
    ingredients: ['Dutch-Processed Cocoa', 'Dairy Cream', 'Grass-Fed Butter', 'Eggs', 'Pure Vanilla Bean', 'Dark Chocolate Shavings'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'],
    stockStatus: 'In Stock'
  },
  {
    id: 'cake-classic-red-velvet',
    name: 'Classic Red Velvet Cream Cheese Cake',
    category: 'cakes',
    categoryLabel: 'Cakes',
    price: 1650,
    shortDesc: 'Vibrant crimson velvet sponge with gentle buttermilk tang, layered with whipped Philadelphia cream cheese.',
    fullDesc: 'Authentic Southern-style red velvet crumb with a whisper of cocoa and Madagascar vanilla, filled and frosted with tangy, rich cream cheese icing and velvet cake crumbles.',
    image: '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg',
    weight: '1 Lb (approx. 480g)',
    flavor: 'Tangy Cream Cheese & Vanilla',
    ingredients: ['Buttermilk', 'Cultured Cream Cheese', 'Flour', 'Cocoa Powder', 'Pure Vanilla', 'Beetroot Extract'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'],
    stockStatus: 'In Stock'
  },

  // 3. Brownies
  {
    id: 'brownie-fudge-walnut',
    name: 'Roasted Walnut Fudge Brownie',
    category: 'brownies',
    categoryLabel: 'Brownies',
    price: 220,
    shortDesc: 'Chewy, fudgy chocolate square loaded with toasted Swat valley walnuts and a glossy crinkled crust.',
    fullDesc: 'Baked in small batches with melted dark chocolate and rich butter. Deep chocolate chewiness in every bite with crunchy pieces of freshly toasted walnuts scattered throughout.',
    image: '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg',
    weight: 'Single Serving (115g)',
    flavor: 'Dark Chocolate & Roasted Walnut',
    ingredients: ['70% Dark Chocolate', 'Swat Valley Walnuts', 'Fresh Butter', 'Eggs', 'Cane Sugar', 'Flour'],
    allergens: ['Wheat (Gluten)', 'Tree Nuts (Walnuts)', 'Milk / Dairy', 'Eggs'],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'brownie-triple-chocolate',
    name: 'Triple Chocolate Molten Brownie',
    category: 'brownies',
    categoryLabel: 'Brownies',
    price: 240,
    shortDesc: 'Intense cocoa batter folded with milk chocolate chips, dark chunks, and white chocolate drops.',
    fullDesc: 'Decadent chocolate lover’s delight. Warm it in the microwave for 15 seconds to release the molten chocolate center and serve with a scoop of vanilla cream.',
    image: '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg',
    weight: 'Single Serving (120g)',
    flavor: 'Triple Chocolate Melt',
    ingredients: ['Cocoa Mass', 'Milk Chocolate Chips', 'Dark Chocolate Chips', 'Butter', 'Eggs', 'Flour'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy', 'Eggs', 'Soy'],
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'brownie-salted-caramel',
    name: 'Salted Caramel Drizzle Brownie',
    category: 'brownies',
    categoryLabel: 'Brownies',
    price: 230,
    shortDesc: 'Dense fudge brownie swirled with golden brown butter caramel and pink Himalayan salt.',
    fullDesc: 'Sweet and salty perfection. Our rich chocolate fudge brownie base ribboned with house-made sticky toffee caramel and crystalline rock salt flakes.',
    image: '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg',
    weight: 'Single Serving (115g)',
    flavor: 'Salted Toffee Caramel',
    ingredients: ['Dark Chocolate', 'Butter Caramel', 'Himalayan Pink Salt', 'Butter', 'Eggs', 'Flour'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy', 'Eggs'],
    stockStatus: 'In Stock'
  },

  // 4. Buns
  {
    id: 'bun-chicken-stuffed',
    name: 'Classic Bakery Chicken Stuffed Bun',
    category: 'buns',
    categoryLabel: 'Buns',
    price: 140,
    shortDesc: 'Soft pillowy milk bun packed with savory shredded chicken, green chilies, coriander, and black pepper.',
    fullDesc: 'The quintessential Pakistani bakery specialty. Hand-shaped dough stuffed with fragrant, spiced shredded chicken cooked with mild green peppers and black pepper, brushed with egg wash and toasted white sesame seeds.',
    image: '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg',
    weight: 'Single Large Bun (140g)',
    flavor: 'Savory Black Pepper Chicken',
    ingredients: ['Flour', 'Milk', 'Shredded Chicken Breast', 'Green Chilies', 'Black Pepper', 'Coriander', 'Sesame Seeds'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy', 'Eggs', 'Sesame'],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'bun-sweet-cream',
    name: 'Fresh Dairy Cream Bun',
    category: 'buns',
    categoryLabel: 'Buns',
    price: 120,
    shortDesc: 'Light sweet bun split open and piped with chilled sweetened dairy cream and strawberry glaze dot.',
    fullDesc: 'A nostalgic favorite. Soft, airy bun dusted with fine sugar, filled generously with freshly whipped sweet vanilla cream and a jewel of red berry jam.',
    image: '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg',
    weight: 'Single Bun (110g)',
    flavor: 'Sweet Dairy Cream & Vanilla',
    ingredients: ['Sweet Milk Dough', 'Whipped Dairy Cream', 'Vanilla Essence', 'Caster Sugar', 'Fruit Glaze'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy'],
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'bun-sesame-burger-pack',
    name: 'Sesame Gourmet Burger Buns (Pack of 4)',
    category: 'buns',
    categoryLabel: 'Buns',
    price: 180,
    shortDesc: 'Pack of 4 brioche-style fluffy burger buns generously sprinkled with golden sesame seeds.',
    fullDesc: 'Bakery fresh buns with exceptional structural integrity for shami kababs, chicken patties, or breakfast sliders. Toasts to a crisp golden crunch without crumbling.',
    image: '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg',
    weight: 'Pack of 4 Buns (320g)',
    flavor: 'Buttery Brioche & Toasted Sesame',
    ingredients: ['High-Protein Flour', 'Butter', 'Milk', 'Yeast', 'Golden Sesame Seeds', 'Sea Salt'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy', 'Sesame'],
    stockStatus: 'In Stock'
  },

  // 5. Fresh Bread
  {
    id: 'bread-plain-milky-large',
    name: 'Plain Milky Sandwich Bread (Large)',
    category: 'fresh-bread',
    categoryLabel: 'Fresh Bread',
    price: 240,
    shortDesc: 'Soft, sliced everyday breakfast bread baked with fresh whole milk and pure butter.',
    fullDesc: 'Freshly baked at dawn every morning. Impossibly soft with a tender golden crust and uniform crumb, perfect for morning French toast, club sandwiches, or dipped in warm chai.',
    image: '/src/assets/images/fresh_sliced_bread_1793384935958.jpg',
    weight: 'Large Loaf 650g (18 Slices)',
    flavor: 'Sweet Whole Milk & Butter',
    ingredients: ['Enriched Wheat Flour', 'Fresh Whole Milk', 'Pure Butter', 'Yeast', 'Cane Sugar', 'Salt'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy'],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'bread-whole-wheat-bran',
    name: 'Healthy Whole Wheat Bran Bread',
    category: 'fresh-bread',
    categoryLabel: 'Fresh Bread',
    price: 280,
    shortDesc: '100% stoneground whole wheat loaf enriched with natural wheat germ and toasted bran flakes.',
    fullDesc: 'High-fiber, low glycemic index bread formulated for wholesome health. Contains zero added artificial coloring, offering a natural nutty aroma and sustaining energy.',
    image: '/src/assets/images/fresh_sliced_bread_1793384935958.jpg',
    weight: 'Medium Loaf 500g (14 Slices)',
    flavor: 'Toasted Wheat Grain & Bran',
    ingredients: ['100% Stoneground Whole Wheat', 'Wheat Bran', 'Malted Barley', 'Yeast', 'Pure Spring Water', 'Salt'],
    allergens: ['Wheat (Gluten)'],
    stockStatus: 'In Stock'
  },
  {
    id: 'bread-artisan-garlic-loaf',
    name: 'Herbed Garlic Butter Pull-Apart Loaf',
    category: 'fresh-bread',
    categoryLabel: 'Fresh Bread',
    price: 320,
    shortDesc: 'Crusty loaf scored and drenched with roasted garlic butter, parsley, and parmesan cheese.',
    fullDesc: 'Warm it in the oven for 5 minutes for an unforgettable garlic bread experience. Filled between every deep score with whipped garlic butter and fragrant garden parsley.',
    image: '/src/assets/images/fresh_sliced_bread_1793384935958.jpg',
    weight: 'Loaf (420g)',
    flavor: 'Roasted Garlic & Garden Herbs',
    ingredients: ['Artisan Bread Flour', 'Cultured Butter', 'Roasted Garlic', 'Fresh Parsley', 'Sea Salt', 'Black Pepper'],
    allergens: ['Wheat (Gluten)', 'Milk / Dairy'],
    stockStatus: 'In Stock'
  },

  // 6. Blue Band
  {
    id: 'blueband-margarine-tub-200g',
    name: 'Blue Band Margarine Spread (200g Tub)',
    category: 'blue-band',
    categoryLabel: 'Blue Band',
    price: 280,
    shortDesc: 'Original breakfast margarine spread enriched with Vitamins A, D, and essential fatty acids.',
    fullDesc: 'Pakistan’s favorite breakfast table staple for generations. Smooth and easy to spread directly from the refrigerator onto freshly toasted bakery bread or warm parathas.',
    image: '/src/assets/images/blue_band_margarine_1793384955886.jpg',
    weight: '200g Sealed Tub',
    flavor: 'Classic Rich Butter Flavor',
    ingredients: ['Vegetable Oils (Palm, Canola)', 'Water', 'Salt', 'Milk Solids', 'Vitamins A & D', 'Natural Beta Carotene'],
    allergens: ['Milk Solids'],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'blueband-margarine-family-450g',
    name: 'Blue Band Margarine Spread (450g Family Pack)',
    category: 'blue-band',
    categoryLabel: 'Blue Band',
    price: 560,
    shortDesc: 'Economical family size tub for daily baking, breakfast spreading, and cooking.',
    fullDesc: 'The generous 450g tub ensures your kitchen is always stocked for morning breakfasts, sandwich making, and baking fluffy sponge cakes and cookies at home.',
    image: '/src/assets/images/blue_band_margarine_1793384955886.jpg',
    weight: '450g Family Tub',
    flavor: 'Classic Rich Butter Flavor',
    ingredients: ['Refined Vegetable Oils', 'Water', 'Iodized Salt', 'Emulsifiers', 'Vitamin Fortification (A, B6, B12, D, E)'],
    allergens: ['Milk Solids'],
    stockStatus: 'In Stock'
  },

  // 7. Chips
  {
    id: 'chips-masala-crinkle',
    name: 'Bakery Special Masala Crinkle Chips (120g)',
    category: 'chips',
    categoryLabel: 'Chips',
    price: 130,
    shortDesc: 'Extra-thick wavy cut potato chips dusted with our signature sweet & tangy chatpata masala.',
    fullDesc: 'Kettle-cooked in pure sunflower oil from hand-selected Pakistani potatoes. Extra thick crinkle ridges trap our proprietary blend of black salt, amchur, roasted cumin, and chili.',
    image: '/src/assets/images/crispy_potato_chips_1793385083217.jpg',
    weight: '120g Fresh Pack',
    flavor: 'Chatpata Masala & Tangy Mango',
    ingredients: ['Farm Fresh Potatoes', 'Sunflower Oil', 'Black Salt', 'Red Chili', 'Dry Mango Powder', 'Cumin', 'Coriander'],
    allergens: [],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'chips-salted-classic-crisps',
    name: 'Sea Salt & Black Pepper Crisps (120g)',
    category: 'chips',
    categoryLabel: 'Chips',
    price: 130,
    shortDesc: 'Light and crispy thin potato crisps seasoned with pure rock sea salt and cracked black peppercorns.',
    fullDesc: 'Pure potato crunch. Golden thin cut chips with a clean salty snap and mild warmth of coarsely crushed Malabar black peppercorns.',
    image: '/src/assets/images/crispy_potato_chips_1793385083217.jpg',
    weight: '120g Fresh Pack',
    flavor: 'Sea Salt & Cracked Pepper',
    ingredients: ['Potatoes', 'Vegetable Oil', 'Pure Sea Salt', 'Crushed Black Pepper'],
    allergens: [],
    stockStatus: 'In Stock'
  },
  {
    id: 'chips-masala-jumbo-family',
    name: 'Bakery Special Masala Chips (Jumbo 250g)',
    category: 'chips',
    categoryLabel: 'Chips',
    price: 240,
    shortDesc: 'Large party pack of our addictive crinkle-cut masala crisps, sealed for maximum freshness.',
    fullDesc: 'Perfect for tea time gatherings, game nights, and family road trips. Generous 250g sharing bag packed with crisp crunch and signature spice.',
    image: '/src/assets/images/crispy_potato_chips_1793385083217.jpg',
    weight: '250g Jumbo Pack',
    flavor: 'Signature Chatpata Spice',
    ingredients: ['Potatoes', 'Vegetable Oil', 'Spice Mix', 'Salt'],
    allergens: [],
    stockStatus: 'In Stock'
  },

  // 8. Cold Drinks
  {
    id: 'drink-pakola-ice-cream-soda',
    name: 'Pakola Ice Cream Soda (Chilled Can)',
    category: 'cold-drinks',
    categoryLabel: 'Cold Drinks',
    price: 90,
    shortDesc: 'Pakistan’s national pride drink, ice-cold with sweet vanilla cream and fragrant green soda.',
    fullDesc: 'Served chilled from our glass beverage display. The legendary bright green soda featuring smooth vanilla cream notes and refreshing carbonation.',
    image: '/src/assets/images/cold_drinks_soda_1793384956354.jpg',
    weight: '250ml Chilled Can',
    flavor: 'Vanilla Ice Cream Soda',
    ingredients: ['Carbonated Water', 'Sugar', 'Citric Acid', 'Artificial Ice Cream Flavor', 'Permitted Food Color'],
    allergens: [],
    isBestSeller: true,
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'drink-mint-lemonade-fresh',
    name: 'Fresh Mint Lemonade Soda (Chilled Bottle)',
    category: 'cold-drinks',
    categoryLabel: 'Cold Drinks',
    price: 160,
    shortDesc: 'House-made sparkling lemonade with freshly crushed garden mint leaves and black salt.',
    fullDesc: 'Invigorating and deeply refreshing. Prepared daily with freshly squeezed lemons, bruised mountain mint, sparkling soda, and a pinch of digestive black salt.',
    image: '/src/assets/images/cold_drinks_soda_1793384956354.jpg',
    weight: '330ml Glass Bottle',
    flavor: 'Fresh Lemon & Garden Mint',
    ingredients: ['Sparkling Spring Water', 'Fresh Lemon Juice', 'Wild Mint Leaves', 'Cane Sugar', 'Black Salt'],
    allergens: [],
    isFeatured: true,
    stockStatus: 'In Stock'
  },
  {
    id: 'drink-gourmet-cola-500ml',
    name: 'Classic Gourmet Cola (500ml Chilled)',
    category: 'cold-drinks',
    categoryLabel: 'Cold Drinks',
    price: 110,
    shortDesc: 'Crisp, highly carbonated classic dark cola with refreshing caramel and citrus undertones.',
    fullDesc: 'The classic partner for fresh chicken buns, hot personal pizzas, and crispy potato chips. Served ice-cold straight from the cellar cooler.',
    image: '/src/assets/images/cold_drinks_soda_1793384956354.jpg',
    weight: '500ml PET Bottle',
    flavor: 'Classic Sparkling Cola',
    ingredients: ['Carbonated Water', 'Sugar', 'Caramel Color', 'Caffeine', 'Phosphoric Acid', 'Natural Flavors'],
    allergens: [],
    stockStatus: 'In Stock'
  }
];

export const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: 'ord-101',
    ticketNumber: 'OAK-7821',
    customerName: 'Hamza Farooq',
    customerPhone: '0300-4589211',
    customerEmail: 'hamza.f@gmail.com',
    pickupWindow: 'Today: 04:30 PM – 06:00 PM',
    paymentMethod: 'Pay at Bakery Counter',
    notes: 'Please pack the pizza hot and include extra napkins.',
    items: [
      {
        productId: 'pizza-chicken-tikka',
        name: 'Chicken Tikka Small Pizza',
        price: 390,
        quantity: 2,
        image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg'
      },
      {
        productId: 'drink-pakola-ice-cream-soda',
        name: 'Pakola Ice Cream Soda (Chilled Can)',
        price: 90,
        quantity: 2,
        image: '/src/assets/images/cold_drinks_soda_1793384956354.jpg'
      }
    ],
    subtotal: 960,
    total: 960,
    createdAt: 'Today, 03:15 PM',
    status: 'Ready for Pickup'
  },
  {
    id: 'ord-102',
    ticketNumber: 'OAK-7822',
    customerName: 'Ayesha Malik',
    customerPhone: '0321-9876543',
    customerEmail: 'ayesha.m@yahoo.com',
    pickupWindow: 'Today: 06:00 PM – 07:30 PM',
    paymentMethod: 'Contactless Pre-Pay',
    notes: 'Birthday message on cake box: Happy Birthday Bilal!',
    items: [
      {
        productId: 'cake-belgian-fudge',
        name: 'Belgian Dark Fudge Cake (1 Lb)',
        price: 1450,
        quantity: 1,
        image: '/src/assets/images/chocolate_fudge_cake_1793384934658.jpg'
      },
      {
        productId: 'brownie-fudge-walnut',
        name: 'Roasted Walnut Fudge Brownie',
        price: 220,
        quantity: 4,
        image: '/src/assets/images/fudge_walnut_brownies_1793384935245.jpg'
      }
    ],
    subtotal: 2330,
    total: 2330,
    createdAt: 'Today, 02:40 PM',
    status: 'Preparing'
  },
  {
    id: 'ord-103',
    ticketNumber: 'OAK-7820',
    customerName: 'Zainab Qureshi',
    customerPhone: '0333-1122334',
    customerEmail: 'zainab.q@outlook.com',
    pickupWindow: 'Today: 01:00 PM – 02:30 PM',
    paymentMethod: 'Pay at Bakery Counter',
    notes: 'Breakfast order',
    items: [
      {
        productId: 'bread-plain-milky-large',
        name: 'Plain Milky Sandwich Bread (Large)',
        price: 240,
        quantity: 1,
        image: '/src/assets/images/fresh_sliced_bread_1793384935958.jpg'
      },
      {
        productId: 'blueband-margarine-tub-200g',
        name: 'Blue Band Margarine Spread (200g Tub)',
        price: 280,
        quantity: 1,
        image: '/src/assets/images/blue_band_margarine_1793384955886.jpg'
      },
      {
        productId: 'bun-chicken-stuffed',
        name: 'Classic Bakery Chicken Stuffed Bun',
        price: 140,
        quantity: 2,
        image: '/src/assets/images/chicken_stuffed_bun_1793384936696.jpg'
      }
    ],
    subtotal: 800,
    total: 800,
    createdAt: 'Today, 11:20 AM',
    status: 'Completed'
  }
];

export const TESTIMONIALS = [
  {
    id: 't1',
    quote: 'The Chicken Tikka Small Pizza and Walnut Fudge Brownies from OVEN & OAK are unmatched. Fresh dough, generous toppings, and authentic bakery taste every single time.',
    author: 'Tariq Mansoor',
    role: 'Food Blogger & Lahore Gourmet',
    location: 'Gulberg',
    favoriteItem: 'Chicken Tikka Small Pizza'
  },
  {
    id: 't2',
    quote: 'Their Belgian Dark Fudge Cake has become the mandatory birthday cake for our entire family. Moist, rich, and never overly sweet.',
    author: 'Samina Khan',
    role: 'Loyal Patron since 2019',
    location: 'DHA Phase 5',
    favoriteItem: 'Belgian Dark Fudge Cake'
  },
  {
    id: 't3',
    quote: 'Picking up warm chicken buns and fresh sliced milky bread on Sunday morning is my favorite ritual. The quality and hygiene are outstanding.',
    author: 'Kamran Siddiqui',
    role: 'Architect & Designer',
    location: 'Model Town',
    favoriteItem: 'Bakery Chicken Stuffed Bun'
  }
];

export interface BakingSlot {
  time: string;
  item: string;
  category: string;
  notes: string;
}

export const BAKING_SCHEDULE: BakingSlot[] = [
  {
    time: '07:00 AM',
    item: 'Fresh Milky Bread Loaves & Bran Buns',
    category: 'Fresh Bread',
    notes: 'Morning dawn pull for breakfast tables.'
  },
  {
    time: '09:30 AM',
    item: 'Chicken Stuffed Buns & Sweet Cream Buns',
    category: 'Buns',
    notes: 'Warm sesame-crusted savory buns.'
  },
  {
    time: '11:30 AM',
    item: 'Small Pizzas (Chicken Tikka & Fajita)',
    category: 'Small Pizza',
    notes: 'Hot bubbling stone-deck individual pizzas.'
  },
  {
    time: '02:00 PM',
    item: 'Walnut Fudge Brownies & Triple Chocolate Slices',
    category: 'Brownies',
    notes: 'Freshly cut warm chewy brownie batches.'
  },
  {
    time: '04:00 PM',
    item: 'Belgian Fudge Cakes & Red Velvet Layers',
    category: 'Cakes',
    notes: 'Glazed and decorated for evening celebrations.'
  }
];

