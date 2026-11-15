import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORIES_LIST } from '../data/bakeryData';
import { useCart } from '../context/CartContext';

interface CategoriesSectionProps {
  onSelectCategory: (catId: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ onSelectCategory }) => {
  const { categories } = useCart();
  const displayCategories = categories && categories.length > 0 ? categories : CATEGORIES_LIST;

  const handleCategoryClick = (id: string) => {
    onSelectCategory(id);
    const el = document.getElementById('featured-products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categories" className="py-14 sm:py-20 lg:py-24 bg-white border-b border-[#3B241C]/10 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2 sm:space-y-3">
          <div className="text-xs uppercase tracking-[0.25em] font-medium text-[#3B241C]/70">
            Our Bakery Departments
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#3B241C]">
            Explore Bakery Categories
          </h2>
          <p className="text-xs sm:text-base text-[#3B241C]/80 font-sans">
            From hot stone-deck small pizzas and decadent chocolate cakes to soft morning buns, fresh loaves, and tea-time snacks.
          </p>
        </div>

        {/* 8 Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayCategories.map((cat, index) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="group border border-[#3B241C]/15 bg-white p-4 sm:p-6 flex flex-col justify-between hover:border-[#3B241C] transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Natural Editorial Numbering */}
                <div className="flex items-center justify-between text-xs text-[#3B241C]/60 font-mono tracking-widest uppercase">
                  <span>0{index + 1}. Department</span>
                  <ArrowUpRight className="w-4 h-4 text-[#3B241C] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>

                {/* Category Photography */}
                <div className="aspect-[4/3] overflow-hidden bg-[#3B241C]/5 border border-[#3B241C]/10">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-serif font-bold text-[#3B241C] group-hover:underline underline-offset-4 decoration-1">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#3B241C]/65 mt-1 font-mono uppercase tracking-wider">
                    {cat.count}
                  </p>
                </div>

                <p className="text-xs text-[#3B241C]/80 font-sans leading-relaxed line-clamp-2">
                  {cat.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#3B241C]/10 flex items-center justify-between text-xs font-semibold text-[#3B241C]">
                <span className="uppercase tracking-wider">View Menu</span>
                <span className="underline underline-offset-4 uppercase tracking-wider">
                  Explore →
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
