import React, { useState } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Editorial Announcement Bar */}
      <div className="bg-[#3B241C] text-white text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center font-sans tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
          <span className="truncate">Fresh bakery pulls from 07:00 AM daily</span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="hidden sm:inline">All Prices in Pakistani Rupees (PKR)</span>
          <span aria-hidden="true" className="opacity-40 hidden sm:inline">·</span>
          <span className="truncate">42 Oak Hearth Lane</span>
        </div>
      </div>

      {/* Main Top Bar - Adhering to strict 3-Zone Top Bar Contract */}
      {/* NOTE: Strictly NO Admin button displayed as per user requirement */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#3B241C]/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4 sm:gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <a 
            href="#" 
            className="text-2xl lg:text-3xl font-serif font-bold tracking-[0.12em] text-[#3B241C] whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            OVEN &amp; OAK
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-[#3B241C]/80">
            <button 
              onClick={() => scrollToSection('categories')} 
              className="hover:text-[#3B241C] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 cursor-pointer"
            >
              Categories
            </button>
            <button 
              onClick={() => scrollToSection('featured-products')} 
              className="hover:text-[#3B241C] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 cursor-pointer"
            >
              All Bakes
            </button>
            <button 
              onClick={() => scrollToSection('best-sellers')} 
              className="hover:text-[#3B241C] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 cursor-pointer"
            >
              Best Sellers
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="hover:text-[#3B241C] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 cursor-pointer"
            >
              Our Craft
            </button>
          </nav>

          {/* Zone 3: 1 primary action / Shopping Bag */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-[#3B241C] hover:bg-[#3B241C]/5 transition-colors rounded-sm flex items-center gap-2 cursor-pointer border border-[#3B241C]/20"
              aria-label={`Shopping Bag with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-semibold tracking-wider uppercase hidden sm:inline font-sans">
                Bag
              </span>
              <span className="text-xs font-mono tabular-nums font-bold bg-[#3B241C] text-white px-1.5 py-0.2 rounded-xs min-w-[20px] text-center">
                {totalItems}
              </span>
            </button>

            <button
              onClick={() => scrollToSection('featured-products')}
              className="hidden lg:inline-flex items-center justify-center px-5 py-2.5 text-xs font-medium tracking-wider uppercase text-white bg-[#3B241C] hover:bg-[#3B241C]/90 transition-colors cursor-pointer border border-[#3B241C]"
            >
              Order Pickup
            </button>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#3B241C] md:hidden hover:bg-[#3B241C]/5 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#3B241C]/10 bg-white px-6 py-6 space-y-4">
            <button
              onClick={() => scrollToSection('categories')}
              className="block w-full text-left py-2 text-base font-serif text-[#3B241C] border-b border-[#3B241C]/10"
            >
              Bakery Categories
            </button>
            <button
              onClick={() => scrollToSection('featured-products')}
              className="block w-full text-left py-2 text-base font-serif text-[#3B241C] border-b border-[#3B241C]/10"
            >
              Full Menu (PKR)
            </button>
            <button
              onClick={() => scrollToSection('best-sellers')}
              className="block w-full text-left py-2 text-base font-serif text-[#3B241C] border-b border-[#3B241C]/10"
            >
              Best Sellers
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 text-base font-serif text-[#3B241C] border-b border-[#3B241C]/10"
            >
              Our Heritage &amp; Craft
            </button>
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCartOpen(true);
                }}
                className="w-full py-3 text-center text-xs tracking-wider uppercase font-semibold text-white bg-[#3B241C]"
              >
                View Bag ({totalItems} Items)
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
