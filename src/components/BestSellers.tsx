import React from 'react';
import { Star, ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const BestSellers: React.FC = () => {
  const { products, addToCart, setSelectedProduct } = useCart();
  const bestSellers = products.filter(p => p.isAvailable !== false && p.isBestSeller).slice(0, 3);

  return (
    <section id="best-sellers" className="py-14 sm:py-20 lg:py-24 bg-[#3B241C] text-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-16 border-b border-white/15 pb-6 sm:pb-8">
          <div className="space-y-2 sm:space-y-3">
            <div className="text-xs uppercase tracking-[0.25em] text-white/70 font-medium">
              Bakery Hall of Fame
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
              Our Permanent Best Sellers
            </h2>
            <p className="text-xs sm:text-base text-white/80 max-w-xl font-sans leading-relaxed">
              The everyday crowd-pullers at OVEN &amp; OAK. Freshly baked at dawn and restocked throughout the day.
            </p>
          </div>

          <div className="text-left md:text-right space-y-1">
            <div className="text-xs uppercase tracking-widest text-white/60 font-mono">
              Bakery Currency
            </div>
            <div className="text-sm font-serif italic text-white/90">
              Pakistani Rupees (Rs.)
            </div>
          </div>
        </div>

        {/* Best Sellers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {bestSellers.map((product, idx) => (
            <div
              key={product.id}
              className="bg-white text-[#3B241C] border border-white/20 flex flex-col justify-between p-4 sm:p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="space-y-6">
                
                {/* Header row with rank */}
                <div className="flex items-center justify-between border-b border-[#3B241C]/10 pb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#3B241C]/60">
                    ICON NO. 0{idx + 1}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#3B241C] font-serif italic">
                    <Star className="w-3.5 h-3.5 fill-[#3B241C]" />
                    <span>Customer Favorite</span>
                  </div>
                </div>

                {/* High quality product image */}
                <div 
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-[4/3] overflow-hidden bg-[#3B241C]/5 border border-[#3B241C]/10 cursor-pointer group"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>

                {/* Title & Price */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 
                      onClick={() => setSelectedProduct(product)}
                      className="text-2xl font-serif font-bold text-[#3B241C] hover:underline cursor-pointer"
                    >
                      {product.name}
                    </h3>
                    <span className="text-xl font-serif font-bold tabular-nums text-[#3B241C] whitespace-nowrap">
                      Rs. {product.price.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#3B241C]/60 uppercase tracking-widest font-mono mt-1">
                    {product.categoryLabel} · {product.weight}
                  </p>
                </div>

                <p className="text-sm text-[#3B241C]/80 font-sans leading-relaxed">
                  {product.fullDesc}
                </p>

                {/* Flavor & portion callout */}
                <div className="p-3 bg-[#3B241C]/5 border border-[#3B241C]/10 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#3B241C]">Flavor Profile:</span>
                    <span className="text-[#3B241C]/80 text-right text-[11px] font-mono">{product.flavor}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#3B241C]/10">
                    <span className="font-semibold text-[#3B241C]">Portion Size:</span>
                    <span className="text-[#3B241C]/80 text-[11px] font-mono">{product.weight}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-[#3B241C]/10 flex items-center gap-3">
                <button
                  onClick={() => addToCart(product, 1)}
                  className="flex-1 py-3 px-4 bg-[#3B241C] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#3B241C]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={() => setSelectedProduct(product)}
                  className="p-3 border border-[#3B241C]/30 text-[#3B241C] hover:bg-[#3B241C]/5 transition-colors cursor-pointer"
                  title="View detailed product profile"
                  aria-label={`View details for ${product.name}`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 p-8 border border-white/20 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-xl font-serif font-bold text-white">
              Catering &amp; Party Boxes
            </h4>
            <p className="text-sm text-white/70 max-w-xl">
              Planning a tea party, birthday, or corporate meeting? Order custom bakery boxes with miniature pizzas, chocolate brownies, chicken buns, and cold drinks.
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('featured-products');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 bg-white text-[#3B241C] text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            Explore Full Menu
          </button>
        </div>

      </div>
    </section>
  );
};
