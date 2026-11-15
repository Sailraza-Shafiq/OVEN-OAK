import React, { useState } from 'react';
import { Eye, Plus, Check } from 'lucide-react';
import { Product, CATEGORIES_LIST } from '../data/bakeryData';
import { useCart } from '../context/CartContext';

interface FeaturedProductsProps {
  selectedCategoryFilter?: string;
  onFilterChange?: (cat: string) => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  selectedCategoryFilter = 'all',
  onFilterChange
}) => {
  const { products, categories: dynamicCategories, addToCart, setSelectedProduct } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategoryFilter);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Sync internal state when prop changes
  React.useEffect(() => {
    setActiveCategory(selectedCategoryFilter);
  }, [selectedCategoryFilter]);

  const currentCategories = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : CATEGORIES_LIST;
  const categories = [
    { id: 'all', label: 'All Items' },
    ...currentCategories.map(c => ({ id: c.id, label: c.title }))
  ];

  const handleCategorySelect = (catId: string) => {
    setActiveCategory(catId);
    if (onFilterChange) {
      onFilterChange(catId);
    }
  };

  const availableProducts = products.filter(p => p.isAvailable !== false);
  const filteredProducts = activeCategory === 'all'
    ? availableProducts
    : availableProducts.filter(p => p.category === activeCategory);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(prev => prev === product.id ? null : prev);
    }, 1500);
  };

  return (
    <section id="featured-products" className="py-14 sm:py-20 lg:py-24 bg-white border-b border-[#3B241C]/10 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="space-y-2 sm:space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] font-medium text-[#3B241C]/70">
              The Daily Bakery Menu
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3B241C]">
              Fresh Bakery Collection
            </h2>
            <p className="text-xs sm:text-base text-[#3B241C]/75 max-w-xl font-sans">
              Handcrafted in small morning batches. All prices in Pakistani Rupees (PKR) with guaranteed fresh ingredients.
            </p>
          </div>

          <div className="text-right hidden sm:block text-xs font-mono text-[#3B241C]/60 uppercase tracking-widest">
            {filteredProducts.length} Products Available
          </div>
        </div>

        {/* Category Filter Tabs - responsive horizontal scroll on mobile, wrap on desktop */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#3B241C]/5 border border-[#3B241C]/10 mb-8 sm:mb-10 overflow-x-auto no-scrollbar flex-nowrap md:flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3.5 py-2 text-xs font-medium tracking-wide uppercase transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-[#3B241C] text-white shadow-xs font-semibold'
                  : 'text-[#3B241C]/75 hover:text-[#3B241C] hover:bg-white/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid - Responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map(product => {
            const isJustAdded = addedAnimationId === product.id;

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group relative bg-white border border-[#3B241C]/15 flex flex-col justify-between hover:border-[#3B241C] transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md"
              >
                <div>
                  {/* Image Container with Zoom & Quick View */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#3B241C]/5 border-b border-[#3B241C]/10">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />

                    {/* Unboxed editorial badge */}
                    {product.isBestSeller && (
                      <div className="absolute top-3 left-3 bg-white text-[#3B241C] border border-[#3B241C]/25 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 shadow-xs">
                        Popular Choice
                      </div>
                    )}

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-[#3B241C]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-white text-[#3B241C] text-xs font-medium uppercase tracking-wider px-3.5 py-1.5 shadow-sm flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Quick View
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-3">
                    {/* Unboxed Metadata with · separator */}
                    <div className="flex items-center gap-2 text-xs text-[#3B241C]/65 uppercase tracking-wider font-medium">
                      <span>{product.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-mono">{product.weight}</span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-serif font-bold text-[#3B241C] group-hover:underline underline-offset-4 decoration-1">
                        {product.name}
                      </h3>
                      {/* Price in Rs. */}
                      <div className="text-lg font-serif font-bold text-[#3B241C] tabular-nums whitespace-nowrap">
                        Rs. {product.price.toLocaleString()}
                      </div>
                    </div>

                    <p className="text-sm text-[#3B241C]/80 line-clamp-2 font-sans leading-relaxed">
                      {product.shortDesc}
                    </p>

                    {/* Flavor / Spec callout */}
                    <div className="pt-2 text-xs text-[#3B241C]/75 flex items-center gap-1">
                      <span className="font-semibold text-[#3B241C]">Flavor:</span>
                      <span>{product.flavor}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="p-6 pt-0 border-t border-[#3B241C]/5 flex items-center gap-3">
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className={`flex-1 py-3 px-4 text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border ${
                      isJustAdded
                        ? 'bg-[#3B241C] text-white border-[#3B241C]'
                        : 'bg-white text-[#3B241C] border-[#3B241C]/40 hover:bg-[#3B241C] hover:text-white hover:border-[#3B241C]'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    className="p-3 text-[#3B241C] border border-[#3B241C]/25 hover:bg-[#3B241C]/5 transition-colors cursor-pointer"
                    title="View Full Ingredients &amp; Portion Details"
                    aria-label={`View details for ${product.name}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 p-6 border border-[#3B241C]/15 bg-[#3B241C]/[0.02] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#3B241C]/80">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-sm text-[#3B241C]">Fresh Counter Pickups:</span>
            <span>All bakery items are baked daily. Prices include local retail packaging.</span>
          </div>
          <div className="font-mono text-[#3B241C]/60 uppercase tracking-wider">
            All prices in PKR (Rs.)
          </div>
        </div>

      </div>
    </section>
  );
};
