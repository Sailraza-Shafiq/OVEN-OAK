import React, { useState } from 'react';
import { 
  Package, ShoppingBag, Layers, Plus, Edit2, Trash2, Search, 
  ArrowLeft, LogOut, Check, X, RefreshCw, AlertCircle, TrendingUp,
  Clock, Phone, MapPin, Upload
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Product, ProductCategory, CATEGORIES_LIST, OrderStatus } from '../../data/bakeryData';
import { uploadProductImageToStorage } from '../../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const { 
    products,
    adminProducts,
    categories,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    resetDefaultProducts,
    orders, 
    updateOrderStatus, 
    logoutAdmin, 
    setIsAdminView,
    isSupabaseOnline,
    backendStatusMessage,
    refreshAdminData,
    isLoadingData,
    showToast
  } = useCart();

  const managedProducts = adminProducts && adminProducts.length > 0 ? adminProducts : products;

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'categories'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Inline price editing state: { [productId]: number }
  const [quickPriceEditId, setQuickPriceEditId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');

  // New product form state
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'small-pizza',
    categoryLabel: 'Small Pizza',
    price: 350,
    shortDesc: '',
    fullDesc: '',
    weight: 'Standard Serving',
    flavor: 'Bakery Fresh',
    ingredients: ['Enriched Flour', 'Water', 'Salt'],
    allergens: ['Wheat (Gluten)'],
    stockQuantity: 50,
    isAvailable: true,
    stockStatus: 'In Stock',
    image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg'
  });

  // Calculate high-level KPIs
  const totalProducts = managedProducts.length;
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => ['Pending', 'Confirmed', 'Preparing'].includes(o.status)).length;
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const handleReturnToStore = () => {
    setIsAdminView(false);
    if (window.location.pathname.includes('/admin')) {
      window.history.pushState({}, '', '/');
    }
    if (window.location.hash.includes('admin')) {
      window.location.hash = '';
    }
  };

  const filteredProducts = managedProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.flavor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const displayCategories = categories && categories.length > 0 ? categories : CATEGORIES_LIST;

  const handleStartQuickPrice = (product: Product) => {
    setQuickPriceEditId(product.id);
    setQuickPriceValue(product.price.toString());
  };

  const handleSaveQuickPrice = async (productId: string) => {
    const numeric = parseFloat(quickPriceValue);
    if (!isNaN(numeric) && numeric >= 0) {
      await updateProduct(productId, { price: numeric });
    }
    setQuickPriceEditId(null);
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, {
      ...editingProduct,
      fullDesc: editingProduct.shortDesc,
    });
    setEditingProduct(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || newProductForm.price === undefined) return;

    const matchedCat = displayCategories.find(c => c.id === newProductForm.category);
    const qty = typeof newProductForm.stockQuantity === 'number' ? newProductForm.stockQuantity : 50;
    const avail = newProductForm.isAvailable !== false;

    const created: Product = {
      id: 'prod-' + Date.now(),
      name: newProductForm.name,
      category: (newProductForm.category as ProductCategory) || 'small-pizza',
      categoryLabel: matchedCat ? matchedCat.title : 'Bakery Item',
      price: Number(newProductForm.price),
      shortDesc: newProductForm.shortDesc || 'Fresh bakery preparation.',
      fullDesc: newProductForm.fullDesc || newProductForm.shortDesc || 'Handcrafted at OVEN & OAK.',
      image: newProductForm.image || '/src/assets/images/small_pizza_tikka_1793384934555.jpg',
      weight: newProductForm.weight || 'Portion',
      flavor: newProductForm.flavor || 'Signature Flavor',
      ingredients: typeof newProductForm.ingredients === 'string'
        ? (newProductForm.ingredients as string).split(',').map(s => s.trim())
        : (newProductForm.ingredients || ['Flour', 'Water']),
      allergens: typeof newProductForm.allergens === 'string'
        ? (newProductForm.allergens as string).split(',').map(s => s.trim())
        : (newProductForm.allergens || []),
      stockQuantity: qty,
      isAvailable: avail,
      stockStatus: !avail || qty === 0 ? 'Sold Out' : qty <= 10 ? 'Low Stock' : 'In Stock'
    };

    const ok = await addProduct(created);
    if (!ok) return;

    setIsAddModalOpen(false);
    setNewProductForm({
      name: '',
      category: 'small-pizza',
      categoryLabel: 'Small Pizza',
      price: 350,
      shortDesc: '',
      fullDesc: '',
      weight: 'Standard Serving',
      flavor: 'Bakery Fresh',
      ingredients: ['Enriched Flour', 'Water', 'Salt'],
      allergens: ['Wheat (Gluten)'],
      stockQuantity: 50,
      isAvailable: true,
      stockStatus: 'In Stock',
      image: '/src/assets/images/small_pizza_tikka_1793384934555.jpg'
    });
  };

  const handleImageUpload = async (file: File, target: 'new' | 'edit') => {
    setIsUploadingImage(true);
    try {
      const res = await uploadProductImageToStorage(file, file.name);
      if (res.url) {
        if (target === 'new') {
          setNewProductForm(prev => ({ ...prev, image: res.url! }));
        } else if (editingProduct) {
          setEditingProduct(prev => prev ? ({ ...prev, image: res.url! }) : null);
        }
        showToast('Product image uploaded to storage');
      } else {
        showToast(res.error || 'Image upload failed (Supabase storage not configured)');
      }
    } catch (e: any) {
      showToast(e?.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#3B241C] flex flex-col font-sans selection:bg-[#3B241C] selection:text-white">
      
      {/* Admin Top Navigation - Mobile & Desktop Polish */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#3B241C]/15 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-[#3B241C]">
              OVEN &amp; OAK
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-[#3B241C]/60 pl-2.5 border-l border-[#3B241C]/25">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Connection Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#3B241C]/15 bg-white text-[10px] sm:text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isSupabaseOnline ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[#3B241C]/80 font-medium hidden sm:inline">
                {isSupabaseOnline ? 'Supabase Live' : 'Local Storage Mode'}
              </span>
              <button
                type="button"
                onClick={() => refreshAdminData()}
                title={`Sync Database (${backendStatusMessage})`}
                disabled={isLoadingData}
                className="text-[#3B241C]/60 hover:text-[#3B241C] p-0.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <button
              onClick={handleReturnToStore}
              className="px-3 sm:px-4 py-2 border border-[#3B241C]/25 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#3B241C] hover:bg-[#3B241C]/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Storefront</span>
            </button>

            <button
              onClick={logoutAdmin}
              className="px-3 sm:px-4 py-2 bg-[#3B241C] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wider hover:bg-[#3B241C]/90 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8">
        
        {/* KPI Dashboard Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="border border-[#3B241C]/15 p-4 sm:p-6 bg-white shadow-xs">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#3B241C]/60 font-mono uppercase tracking-wider">
              <span>Products</span>
              <Package className="w-4 h-4 text-[#3B241C]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C] tabular-nums mt-1 sm:mt-2">
              {totalProducts}
            </div>
            <div className="text-[10px] sm:text-xs text-[#3B241C]/70 mt-1 truncate">
              8 Bakery Categories
            </div>
          </div>

          <div className="border border-[#3B241C]/15 p-4 sm:p-6 bg-white shadow-xs">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#3B241C]/60 font-mono uppercase tracking-wider">
              <span>Active Orders</span>
              <ShoppingBag className="w-4 h-4 text-[#3B241C]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C] tabular-nums mt-1 sm:mt-2">
              {pendingOrdersCount}
            </div>
            <div className="text-[10px] sm:text-xs text-[#3B241C]/70 mt-1 truncate">
              {totalOrdersCount} Total In Queue
            </div>
          </div>

          <div className="border border-[#3B241C]/15 p-4 sm:p-6 bg-white shadow-xs">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#3B241C]/60 font-mono uppercase tracking-wider">
              <span>Order Value</span>
              <TrendingUp className="w-4 h-4 text-[#3B241C]" />
            </div>
            <div className="text-xl sm:text-3xl font-serif font-bold text-[#3B241C] tabular-nums mt-1 sm:mt-2 truncate">
              Rs. {totalRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-xs text-[#3B241C]/70 mt-1 truncate">
              PKR Gross Total
            </div>
          </div>

          <div className="border border-[#3B241C]/15 p-4 sm:p-6 bg-white shadow-xs">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#3B241C]/60 font-mono uppercase tracking-wider">
              <span>Hearth Deck</span>
              <Clock className="w-4 h-4 text-[#3B241C]" />
            </div>
            <div className="text-lg sm:text-xl font-serif font-bold text-[#3B241C] mt-1 sm:mt-2">
              Bake Shift
            </div>
            <div className="text-[10px] sm:text-xs text-[#3B241C]/70 mt-1 truncate">
              Deck Heat: 480°F
            </div>
          </div>
        </div>

        {/* Tab Switcher - Mobile friendly scroll strip */}
        <div className="flex items-center gap-2 border-b border-[#3B241C]/15 pb-px overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'products'
                ? 'border-[#3B241C] text-[#3B241C] font-bold'
                : 'border-transparent text-[#3B241C]/60 hover:text-[#3B241C]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'orders'
                ? 'border-[#3B241C] text-[#3B241C] font-bold'
                : 'border-transparent text-[#3B241C]/60 hover:text-[#3B241C]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders ({pendingOrdersCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'categories'
                ? 'border-[#3B241C] text-[#3B241C] font-bold'
                : 'border-transparent text-[#3B241C]/60 hover:text-[#3B241C]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories (8)</span>
          </button>
        </div>

        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Toolbar: Search, Category Filter, Add Button, Reset Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B241C]/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products or flavors..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#3B241C]/25 text-[#3B241C] placeholder-[#3B241C]/50 focus:outline-none focus:border-[#3B241C]"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2.5 text-xs border border-[#3B241C]/25 bg-white text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                >
                  <option value="all">All Categories ({managedProducts.length})</option>
                  {displayCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title} ({managedProducts.filter(p => p.category === cat.id).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={resetDefaultProducts}
                  className="flex-1 sm:flex-none px-3 py-2.5 border border-[#3B241C]/20 text-[#3B241C]/80 hover:text-[#3B241C] hover:bg-[#3B241C]/5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Restore initial Pakistani bakery products"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-[#3B241C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3B241C]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

            </div>

            {/* Mobile View: Product Cards (Shown on screens < md) */}
            <div className="md:hidden space-y-3">
              {filteredProducts.map(product => {
                const isEditingThisPrice = quickPriceEditId === product.id;

                return (
                  <div 
                    key={product.id}
                    className="border border-[#3B241C]/15 bg-white p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover border border-[#3B241C]/15 shrink-0 bg-[#3B241C]/5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif font-bold text-sm text-[#3B241C] truncate">
                            {product.name}
                          </h4>
                          <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#3B241C]/5 border border-[#3B241C]/10 shrink-0">
                            {product.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#3B241C]/65 font-mono mt-0.5">
                          {product.weight} · {product.flavor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#3B241C]/10">
                      {/* Price / Quick Price edit on mobile */}
                      <div>
                        {isEditingThisPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#3B241C]">Rs.</span>
                            <input
                              type="number"
                              autoFocus
                              value={quickPriceValue}
                              onChange={(e) => setQuickPriceValue(e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-[#3B241C] font-mono font-bold"
                            />
                            <button
                              onClick={() => handleSaveQuickPrice(product.id)}
                              className="p-1 bg-[#3B241C] text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setQuickPriceEditId(null)}
                              className="p-1 border border-[#3B241C]/30 text-[#3B241C]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartQuickPrice(product)}
                            className="flex items-center gap-1.5 cursor-pointer py-1"
                          >
                            <span className="font-serif font-bold text-base text-[#3B241C] tabular-nums">
                              Rs. {product.price.toLocaleString()}
                            </span>
                            <Edit2 className="w-3 h-3 text-[#3B241C]/40" />
                          </div>
                        )}
                      </div>

                      {/* Stock & Enable/Disable toggle on mobile */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const nextAvail = product.isAvailable === false;
                            updateProduct(product.id, { isAvailable: nextAvail });
                          }}
                          className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                            product.isAvailable === false
                              ? 'border-[#3B241C]/20 text-[#3B241C]/45 line-through bg-white'
                              : 'border-[#3B241C]/20 bg-[#3B241C]/5 text-[#3B241C]'
                          }`}
                        >
                          {product.isAvailable === false
                            ? 'Disabled'
                            : `${product.stockQuantity ?? 50} qty · ${product.stockStatus || 'In Stock'}`}
                        </button>

                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 border border-[#3B241C]/25 text-[#3B241C]"
                          aria-label="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingProductId(product.id)}
                          className="p-1.5 border border-[#3B241C]/25 text-[#3B241C]/70"
                          aria-label="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Shown on screens >= md) */}
            <div className="hidden md:block border border-[#3B241C]/15 overflow-x-auto shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#3B241C]/5 border-b border-[#3B241C]/15 font-mono uppercase text-[#3B241C]/70 tracking-wider">
                    <th className="p-4">Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Portion / Size</th>
                    <th className="p-4">Flavor Profile</th>
                    <th className="p-4">Price (PKR)</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3B241C]/10">
                  {filteredProducts.map(product => {
                    const isEditingThisPrice = quickPriceEditId === product.id;

                    return (
                      <tr key={product.id} className="hover:bg-[#3B241C]/[0.02] transition-colors">
                        
                        {/* Thumbnail & Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover border border-[#3B241C]/15 shrink-0 bg-[#3B241C]/5"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-serif font-bold text-sm text-[#3B241C]">
                                {product.name}
                              </div>
                              <div className="text-[11px] text-[#3B241C]/60 line-clamp-1 max-w-xs">
                                {product.shortDesc}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#3B241C]/80">
                            {product.categoryLabel}
                          </span>
                        </td>

                        {/* Weight / Size */}
                        <td className="p-4 font-mono text-[#3B241C]/80 whitespace-nowrap">
                          {product.weight}
                        </td>

                        {/* Flavor */}
                        <td className="p-4 text-[#3B241C]/80">
                          {product.flavor}
                        </td>

                        {/* Editable Price */}
                        <td className="p-4 whitespace-nowrap">
                          {isEditingThisPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#3B241C]">Rs.</span>
                              <input
                                type="number"
                                autoFocus
                                value={quickPriceValue}
                                onChange={(e) => setQuickPriceValue(e.target.value)}
                                className="w-24 px-2 py-1 text-xs border border-[#3B241C] font-mono font-bold"
                              />
                              <button
                                onClick={() => handleSaveQuickPrice(product.id)}
                                className="p-1 bg-[#3B241C] text-white hover:bg-[#3B241C]/90"
                                title="Save price"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setQuickPriceEditId(null)}
                                className="p-1 border border-[#3B241C]/30 text-[#3B241C]"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleStartQuickPrice(product)}
                              className="group/price flex items-center gap-2 cursor-pointer py-1 px-2 -ml-2 hover:bg-[#3B241C]/5"
                              title="Click to quickly edit price"
                            >
                              <span className="text-sm font-serif font-bold text-[#3B241C] tabular-nums">
                                Rs. {product.price.toLocaleString()}
                              </span>
                              <Edit2 className="w-3 h-3 text-[#3B241C]/30 group-hover/price:text-[#3B241C] transition-colors" />
                            </div>
                          )}
                        </td>

                        {/* Stock & Enable/Disable toggle */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-[#3B241C]/80 tabular-nums">
                              {product.stockQuantity ?? 50} qty
                            </span>
                            <button
                              onClick={() => {
                                const nextAvail = product.isAvailable === false;
                                updateProduct(product.id, { isAvailable: nextAvail });
                              }}
                              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold border cursor-pointer ${
                                product.isAvailable === false
                                  ? 'border-[#3B241C]/20 text-[#3B241C]/45 line-through'
                                  : product.stockStatus === 'Low Stock'
                                    ? 'border-[#3B241C] text-[#3B241C] font-bold'
                                    : 'border-[#3B241C]/30 bg-[#3B241C]/5 text-[#3B241C]'
                              }`}
                              title="Click to enable or disable on storefront"
                            >
                              {product.isAvailable === false ? 'Disabled' : (product.stockStatus || 'Enabled')}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-1.5 border border-[#3B241C]/25 text-[#3B241C] hover:bg-[#3B241C] hover:text-white transition-colors cursor-pointer"
                              title="Edit complete product details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingProductId(product.id)}
                              className="p-1.5 border border-[#3B241C]/25 text-[#3B241C]/70 hover:text-[#3B241C] hover:bg-[#3B241C]/10 transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-[#3B241C]/60 text-xs border border-[#3B241C]/15">
                No products matched your search or category filter.
              </div>
            )}

          </div>
        )}

        {/* TAB 2: ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3B241C]/15 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#3B241C]">
                  Bakery Pickup &amp; Reservation Queue
                </h3>
                <p className="text-xs text-[#3B241C]/75">
                  Real orders placed by customers through the storefront bag checkout.
                </p>
              </div>

              <div className="text-xs font-mono uppercase tracking-wider text-[#3B241C]/60">
                {orders.length} Total Orders
              </div>
            </div>

            <div className="space-y-4">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="border border-[#3B241C]/20 bg-white p-4 sm:p-6 shadow-xs space-y-4 hover:border-[#3B241C] transition-colors"
                >
                  {/* Order header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3B241C]/10 pb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-mono font-bold text-sm sm:text-base text-[#3B241C]">
                          #{order.ticketNumber}
                        </span>
                        <span className="text-xs font-serif font-semibold text-[#3B241C]">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-[#3B241C]/50 hidden sm:inline">·</span>
                        <span className="text-[11px] font-mono text-[#3B241C]/70">
                          {order.createdAt}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#3B241C]/75 pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-[#3B241C]/60 shrink-0" />
                          {order.customerPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#3B241C]/60 shrink-0" />
                          {order.customerAddress || order.customerEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#3B241C]/60 shrink-0" />
                          {order.pickupWindow}
                        </span>
                      </div>
                    </div>

                    {/* Order Status Control */}
                    <div className="flex items-center gap-2 pt-1 sm:pt-0">
                      <span className="text-xs uppercase font-mono text-[#3B241C]/60">Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-2 border focus:outline-none cursor-pointer ${
                          order.status === 'Ready' || order.status === 'Ready for Pickup'
                            ? 'bg-[#3B241C] text-white border-[#3B241C]'
                            : order.status === 'Delivered' || order.status === 'Completed'
                              ? 'bg-[#3B241C]/10 text-[#3B241C] border-[#3B241C]/30'
                              : order.status === 'Cancelled'
                                ? 'bg-white text-[#3B241C]/50 border-[#3B241C]/25 line-through'
                                : 'bg-white text-[#3B241C] border-[#3B241C]'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        {order.status === 'Ready for Pickup' && <option value="Ready for Pickup">Ready for Pickup</option>}
                        {order.status === 'Completed' && <option value="Completed">Completed</option>}
                      </select>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#3B241C]/60 block">
                      Ordered Bakery Items:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2 bg-[#3B241C]/[0.03] border border-[#3B241C]/10">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover border border-[#3B241C]/15 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#3B241C] truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-[#3B241C]/70 font-mono">
                              {item.quantity}x @ Rs. {item.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes & Total Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#3B241C]/10 text-xs">
                    <div className="text-[#3B241C]/80 italic">
                      {order.notes ? `Customer Note: “${order.notes}”` : 'Payment: ' + order.paymentMethod}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="uppercase font-mono text-[#3B241C]/60 text-xs">Total:</span>
                      <span className="text-base sm:text-lg font-serif font-bold text-[#3B241C] tabular-nums">
                        Rs. {order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: CATEGORIES OVERVIEW */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="border-b border-[#3B241C]/15 pb-4">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#3B241C]">
                Bakery Department Taxonomy
              </h3>
              <p className="text-xs text-[#3B241C]/75">
                The 8 core menu categories available in the OVEN &amp; OAK collection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayCategories.map((cat, idx) => {
                const count = managedProducts.filter(p => p.category === cat.id).length;
                const catProducts = managedProducts.filter(p => p.category === cat.id);
                const avgPrice = count > 0 
                  ? Math.round(catProducts.reduce((sum, p) => sum + p.price, 0) / count)
                  : 0;

                return (
                  <div key={cat.id} className="border border-[#3B241C]/15 p-4 sm:p-5 bg-white space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-[#3B241C]/60 uppercase">
                      <span>0{idx + 1}. Department</span>
                      <span className="font-bold text-[#3B241C]">{count} Products</span>
                    </div>

                    <div className="aspect-[4/3] bg-[#3B241C]/5 overflow-hidden border border-[#3B241C]/10">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div>
                      <h4 className="text-base font-serif font-bold text-[#3B241C]">
                        {cat.title}
                      </h4>
                      <p className="text-xs text-[#3B241C]/75 mt-1 line-clamp-2">
                        {cat.desc}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#3B241C]/10 flex justify-between text-xs font-mono">
                      <span className="text-[#3B241C]/60">Avg. Price:</span>
                      <span className="font-bold text-[#3B241C]">Rs. {avgPrice}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* EDIT PRODUCT MODAL - Fully responsive */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
          <div onClick={() => setEditingProduct(null)} className="fixed inset-0 bg-[#3B241C]/45 backdrop-blur-xs" />
          <div className="relative bg-white border border-[#3B241C]/25 max-w-xl w-full p-5 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-[#3B241C] hover:bg-[#3B241C]/5 border border-[#3B241C]/15"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#3B241C]/10 pb-3 mb-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B241C]/60">
                Menu Management
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#3B241C]">
                Edit Product Details
              </h2>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      const matched = displayCategories.find(c => c.id === cat);
                      setEditingProduct({ 
                        ...editingProduct, 
                        category: cat,
                        categoryLabel: matched ? matched.title : cat
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 bg-white text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  >
                    {displayCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Price in PKR (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 font-mono text-[#3B241C] font-bold focus:outline-none focus:border-[#3B241C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Weight / Portion / Size
                  </label>
                  <input
                    type="text"
                    value={editingProduct.weight}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Flavor Notes
                  </label>
                  <input
                    type="text"
                    value={editingProduct.flavor}
                    onChange={(e) => setEditingProduct({ ...editingProduct, flavor: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDesc}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDesc: e.target.value })}
                  className="w-full px-3 py-2 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Product Image (Supabase Storage: product-images)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border border-[#3B241C]/20 shrink-0 bg-[#3B241C]/5 overflow-hidden">
                    <img
                      src={editingProduct.image}
                      alt={editingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#3B241C]/30 text-[11px] font-semibold uppercase tracking-wider text-[#3B241C] hover:bg-[#3B241C]/5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'edit');
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingProduct.stockQuantity ?? 50}
                    onChange={(e) => {
                      const qty = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setEditingProduct({
                        ...editingProduct,
                        stockQuantity: qty,
                        stockStatus: qty === 0 ? 'Sold Out' : qty <= 10 ? 'Low Stock' : 'In Stock',
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 font-mono text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Storefront Visibility
                  </label>
                  <select
                    value={editingProduct.isAvailable === false ? 'disabled' : 'enabled'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isAvailable: e.target.value === 'enabled',
                      })
                    }
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 bg-white text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  >
                    <option value="enabled">Enabled (Visible on Storefront)</option>
                    <option value="disabled">Disabled (Hidden from Storefront)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#3B241C]/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 sm:px-5 py-2.5 border border-[#3B241C]/25 uppercase font-semibold text-[#3B241C] hover:bg-[#3B241C]/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 bg-[#3B241C] text-white uppercase font-bold hover:bg-[#3B241C]/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL - Fully responsive */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
          <div onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-[#3B241C]/45 backdrop-blur-xs" />
          <div className="relative bg-white border border-[#3B241C]/25 max-w-xl w-full p-5 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-[#3B241C] hover:bg-[#3B241C]/5 border border-[#3B241C]/15"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#3B241C]/10 pb-3 mb-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B241C]/60">
                Menu Management
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#3B241C]">
                Add New Bakery Product
              </h2>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nutella Swirl Brownie"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Category *
                  </label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      const matched = displayCategories.find(c => c.id === cat);
                      setNewProductForm({ 
                        ...newProductForm, 
                        category: cat,
                        categoryLabel: matched ? matched.title : cat,
                        image: matched ? matched.image : newProductForm.image
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 bg-white text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  >
                    {displayCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Price in PKR (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="250"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 font-mono text-[#3B241C] font-bold focus:outline-none focus:border-[#3B241C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Weight / Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Single Slice (120g)"
                    value={newProductForm.weight}
                    onChange={(e) => setNewProductForm({ ...newProductForm, weight: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Flavor Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hazelnut Cocoa"
                    value={newProductForm.flavor}
                    onChange={(e) => setNewProductForm({ ...newProductForm, flavor: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Product Image (Supabase Storage: product-images)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border border-[#3B241C]/20 shrink-0 bg-[#3B241C]/5 overflow-hidden">
                    <img
                      src={newProductForm.image || '/src/assets/images/small_pizza_tikka_1793384934555.jpg'}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={newProductForm.image || ''}
                      onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#3B241C]/30 text-[11px] font-semibold uppercase tracking-wider text-[#3B241C] hover:bg-[#3B241C]/5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'new');
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Appealing 1-2 sentence description..."
                  value={newProductForm.shortDesc}
                  onChange={(e) => setNewProductForm({ ...newProductForm, shortDesc: e.target.value })}
                  className="w-full px-3 py-2 border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newProductForm.stockQuantity ?? 50}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        stockQuantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 font-mono text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Storefront Visibility
                  </label>
                  <select
                    value={newProductForm.isAvailable === false ? 'disabled' : 'enabled'}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        isAvailable: e.target.value === 'enabled',
                      })
                    }
                    className="w-full px-3 py-2.5 border border-[#3B241C]/25 bg-white text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  >
                    <option value="enabled">Enabled (Visible on Storefront)</option>
                    <option value="disabled">Disabled (Hidden from Storefront)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#3B241C]/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 sm:px-5 py-2.5 border border-[#3B241C]/25 uppercase font-semibold text-[#3B241C] hover:bg-[#3B241C]/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 bg-[#3B241C] text-white uppercase font-bold hover:bg-[#3B241C]/90"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B241C]/45 backdrop-blur-xs">
          <div className="bg-white border border-[#3B241C]/30 p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-xs uppercase font-mono tracking-wider font-bold text-[#3B241C]">
              <AlertCircle className="w-4 h-4" />
              <span>Confirm Deletion</span>
            </div>
            <p className="text-xs text-[#3B241C]/80 font-sans">
              Are you sure you want to remove this product from the OVEN &amp; OAK bakery menu?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 border border-[#3B241C]/25 text-xs uppercase font-semibold text-[#3B241C]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(deletingProductId);
                  setDeletingProductId(null);
                }}
                className="px-4 py-2 bg-[#3B241C] text-white text-xs uppercase font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
