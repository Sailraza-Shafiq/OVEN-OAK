import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Hero: React.FC = () => {
  const scrollToShop = () => {
    const el = document.getElementById('featured-products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCategories = () => {
    const el = document.getElementById('categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-white border-b border-[#3B241C]/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Headline & Narrative */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs uppercase tracking-[0.2em] font-medium text-[#3B241C]/70">
                <span>Artisanal Bakery &amp; Kitchen</span>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span>Fresh Stone Deck Bakes</span>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span>PKR (Rs.)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#3B241C] leading-[1.12] tracking-tight [text-wrap:balance]">
                Artisanal small pizzas, decadent cakes &amp; daily fresh bakes.
              </h1>

              <p className="text-sm sm:text-lg text-[#3B241C]/80 leading-relaxed font-sans max-w-xl [text-wrap:balance]">
                From hot individual chicken tikka pizzas and Belgian chocolate fudge cakes to stuffed bakery buns, walnut brownies, and sliced morning breads. Baked fresh daily with pure ingredients.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              <button
                onClick={scrollToShop}
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#3B241C] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#3B241C]/90 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm group"
              >
                <span>Shop Bakery Menu</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={scrollToCategories}
                className="px-5 sm:px-6 py-3.5 sm:py-4 bg-transparent text-[#3B241C] border border-[#3B241C]/30 text-xs font-semibold uppercase tracking-widest hover:bg-[#3B241C]/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Browse 8 Categories</span>
              </button>
            </div>

            {/* Editorial Metric Strip in PKR context */}
            <div className="pt-6 sm:pt-8 border-t border-[#3B241C]/10 grid grid-cols-3 gap-3 sm:gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C] tabular-nums">
                  8
                </p>
                <p className="text-[11px] sm:text-xs uppercase tracking-wider text-[#3B241C]/70 mt-1">
                  Bakery Categories
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C] tabular-nums">
                  100%
                </p>
                <p className="text-[11px] sm:text-xs uppercase tracking-wider text-[#3B241C]/70 mt-1">
                  Daily Fresh Bakes
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C] tabular-nums">
                  Rs. 90+
                </p>
                <p className="text-[11px] sm:text-xs uppercase tracking-wider text-[#3B241C]/70 mt-1">
                  Accessible Luxury
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Hero High-Fidelity Photograph */}
          <div className="lg:col-span-6 relative">
            <div className="relative border border-[#3B241C]/15 bg-white p-2.5 sm:p-3 shadow-md">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#3B241C]/5">
                <img
                  src="/src/assets/images/small_pizza_tikka_1793384934555.jpg"
                  alt="Freshly baked artisan chicken tikka small pizza with bubbling mozzarella on wooden peel"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              </div>

              {/* Photographic caption */}
              <div className="pt-2.5 sm:pt-3 px-1 flex items-center justify-between text-[11px] sm:text-xs text-[#3B241C]/75">
                <span className="font-serif italic truncate">Chicken Tikka Small Pizza</span>
                <span className="tabular-nums font-mono text-[10px] sm:text-[11px] shrink-0">Rs. 390 · FRESH PULL</span>
              </div>
            </div>

            {/* Floating Editorial Badge */}
            <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-6 sm:-left-6 bg-white border border-[#3B241C]/20 p-3.5 sm:p-4 shadow-lg max-w-[240px]">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-[#3B241C]">
                Daily Morning Commitment
              </p>
              <p className="text-xs text-[#3B241C]/80 mt-1 font-serif italic">
                “Pure dairy butter, farm-fresh eggs, and stone-baked savory specialties.”
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
