import React from 'react';

export const AboutBakery: React.FC = () => {
  return (
    <section id="about" className="py-14 sm:py-20 lg:py-28 bg-white border-b border-[#3B241C]/10 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Two-Column Editorial Story Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Authentic Master Baker Photograph */}
          <div className="lg:col-span-6 relative">
            <div className="relative border border-[#3B241C]/15 bg-white p-3 shadow-lg">
              <div className="aspect-[4/3] overflow-hidden bg-[#3B241C]/5">
                <img
                  src="/src/assets/images/bakery_master_craft_1793384477639.jpg"
                  alt="Master baker carefully scoring an artisan loaf before hearth stone oven"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>

              {/* Photo caption */}
              <div className="pt-4 px-2 flex items-center justify-between text-xs text-[#3B241C]/70">
                <span className="font-serif italic">Head Baker Thomas Vance at the hearth</span>
                <span className="font-mono text-[11px] uppercase tracking-wider">Oak Hearth Lane · 05:15 AM</span>
              </div>
            </div>

            {/* Vintage Heritage Stamp */}
            <div className="absolute -top-4 -right-4 bg-white border border-[#3B241C] p-4 text-center shadow-md hidden sm:block">
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#3B241C]/60">
                ORIGIN
              </div>
              <div className="text-xl font-serif font-bold text-[#3B241C]">
                2018
              </div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#3B241C]/60">
                ESTABLISHED
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Pillars */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-[0.25em] text-[#3B241C]/70 font-medium">
                Our Philosophy &amp; Lineage
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#3B241C] leading-tight">
                Where ancient heritage grain meets the stone hearth.
              </h2>
              <p className="text-base text-[#3B241C]/80 font-sans leading-relaxed">
                OVEN &amp; OAK began with a solitary belief: that bread is not merely food, but a living craft of patience, wild biology, and honest fire. We refuse shortcuts, commercial yeast additives, and accelerated proving.
              </p>
            </div>

            {/* 3 Core Commitments - Clean Editorial Layout */}
            <div className="space-y-6 pt-2 border-t border-[#3B241C]/10">
              
              <div className="flex gap-4">
                <span className="text-base font-serif font-bold text-[#3B241C] font-mono shrink-0">
                  01.
                </span>
                <div>
                  <h4 className="text-base font-serif font-bold text-[#3B241C]">
                    The 36-Hour Cold Levain Ferment
                  </h4>
                  <p className="text-sm text-[#3B241C]/75 mt-1 font-sans leading-relaxed">
                    Time is our primary ingredient. Our sourdoughs undergo up to 36 hours of cold retarding, allowing wild microflora to convert complex starches into deeply aromatic organic acids and digestible nutrients.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="text-base font-serif font-bold text-[#3B241C] font-mono shrink-0">
                  02.
                </span>
                <div>
                  <h4 className="text-base font-serif font-bold text-[#3B241C]">
                    Stoneground Heritage Grain
                  </h4>
                  <p className="text-sm text-[#3B241C]/75 mt-1 font-sans leading-relaxed">
                    We mill select whole kernels of heirloom Red Fife, Turkey Red, and dark winter rye on granite stones weekly, preserving the germ oil, vital minerals, and natural cereal sweetness.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="text-base font-serif font-bold text-[#3B241C] font-mono shrink-0">
                  03.
                </span>
                <div>
                  <h4 className="text-base font-serif font-bold text-[#3B241C]">
                    Spanish Stone Deck Baking
                  </h4>
                  <p className="text-sm text-[#3B241C]/75 mt-1 font-sans leading-relaxed">
                    Loaves are turned directly onto heavy heated stone decks with injected pressurized steam. The sudden thermal shock creates the crackling blistered ear and caramelized blister crust.
                  </p>
                </div>
              </div>

            </div>

            {/* Founder Quote */}
            <div className="pt-6 border-t border-[#3B241C]/10">
              <blockquote className="text-sm italic font-serif text-[#3B241C]/90 border-l border-[#3B241C]/20 pl-4 py-1">
                “When flour, spring water, sea salt, and wild levain are guided by honest hands and steady stone heat, nothing more is ever needed.”
              </blockquote>
              <div className="text-xs uppercase tracking-wider font-semibold text-[#3B241C] mt-2 pl-4">
                — Thomas &amp; Clara Vance, Founders &amp; Bakers
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
