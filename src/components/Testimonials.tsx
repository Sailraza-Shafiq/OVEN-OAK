import React from 'react';
import { Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/bakeryData';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-[#FFFFFF] border-b border-[#3B241C]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-2 sm:space-y-3">
          <div className="text-xs uppercase tracking-[0.25em] font-medium text-[#3B241C]/70">
            Voices of Our Patrons
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#3B241C]">
            Words From the Table
          </h2>
          <p className="text-xs sm:text-base text-[#3B241C]/80 font-sans">
            Trusted by Michelin-starred culinary kitchens, neighborhood regulars, and dedicated sourdough enthusiasts.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border border-[#3B241C]/15 p-8 flex flex-col justify-between hover:border-[#3B241C] transition-colors shadow-xs"
            >
              <div className="space-y-6">
                <Quote className="w-8 h-8 text-[#3B241C]/30" />
                
                <p className="text-base font-serif italic text-[#3B241C] leading-relaxed">
                  “{item.quote}”
                </p>
              </div>

              <div className="pt-8 mt-6 border-t border-[#3B241C]/10 space-y-1">
                <div className="font-serif font-bold text-base text-[#3B241C]">
                  {item.author}
                </div>
                <div className="text-xs text-[#3B241C]/75 font-sans">
                  {item.role}
                </div>
                <div className="text-[11px] text-[#3B241C]/60 uppercase tracking-wider font-mono pt-1">
                  Favorite: <span className="text-[#3B241C] font-semibold">{item.favoriteItem}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Media / Press Recognition Strip */}
        <div className="mt-16 pt-12 border-t border-[#3B241C]/10 flex flex-wrap items-center justify-around gap-8 text-center">
          <div>
            <span className="block font-serif text-lg font-bold text-[#3B241C]">Michelin Guide</span>
            <span className="text-xs text-[#3B241C]/60 uppercase tracking-widest font-mono">Recommended Artisan Bakery</span>
          </div>
          <div className="w-px h-8 bg-[#3B241C]/15 hidden md:block"></div>
          <div>
            <span className="block font-serif text-lg font-bold text-[#3B241C]">Gastronomy Today</span>
            <span className="text-xs text-[#3B241C]/60 uppercase tracking-widest font-mono">Bakery of the Year 2024</span>
          </div>
          <div className="w-px h-8 bg-[#3B241C]/15 hidden md:block"></div>
          <div>
            <span className="block font-serif text-lg font-bold text-[#3B241C]">Artisan Bread Guild</span>
            <span className="text-xs text-[#3B241C]/60 uppercase tracking-widest font-mono">Master Hearth Certification</span>
          </div>
        </div>

      </div>
    </section>
  );
};
