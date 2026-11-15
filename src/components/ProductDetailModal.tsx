import React, { useState } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductDetailModal: React.FC = () => {
  const { selectedProduct, setSelectedProduct, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!selectedProduct) return null;

  const handleAdd = () => {
    addToCart(selectedProduct, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setSelectedProduct(null);
      setQuantity(1);
    }, 1200);
  };

  const totalPrice = selectedProduct.price * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={() => setSelectedProduct(null)}
        className="fixed inset-0 bg-[#3B241C]/45 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Content */}
      <div className="relative bg-white border border-[#3B241C]/25 max-w-3xl w-full p-4 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto my-auto">
        
        {/* Close button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-[#3B241C] hover:bg-[#3B241C]/5 transition-colors border border-[#3B241C]/15 cursor-pointer z-10"
          aria-label="Close product view"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Product Image Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="aspect-[4/3] sm:aspect-square overflow-hidden bg-[#3B241C]/5 border border-[#3B241C]/15">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Quick Specs */}
            <div className="p-3 bg-[#3B241C]/5 border border-[#3B241C]/10 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-[#3B241C]">Portion Size:</span>
                <span className="font-mono text-[#3B241C]/80">{selectedProduct.weight}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-[#3B241C]">Flavor:</span>
                <span className="text-[#3B241C]/80">{selectedProduct.flavor}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-[#3B241C]">Stock:</span>
                <span className="font-mono text-[#3B241C]/80">{selectedProduct.stockStatus || 'In Stock'}</span>
              </div>
            </div>
          </div>

          {/* Product Details Column */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#3B241C]/60 font-mono">
                <span>{selectedProduct.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span>OVEN &amp; OAK BAKERY</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C] mt-1">
                {selectedProduct.name}
              </h2>

              <div className="text-2xl font-serif font-bold text-[#3B241C] tabular-nums mt-2">
                Rs. {selectedProduct.price.toLocaleString()}
              </div>
            </div>

            <p className="text-sm text-[#3B241C]/80 font-sans leading-relaxed">
              {selectedProduct.fullDesc}
            </p>

            {/* Ingredients & Allergens */}
            <div className="space-y-2 text-xs border-t border-b border-[#3B241C]/10 py-3">
              <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-[#3B241C] block">
                Bakery Ingredients:
              </span>
              <p className="text-[#3B241C]/75 leading-normal">
                {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 
                  ? selectedProduct.ingredients.join(', ') + '.' 
                  : 'Fresh bakery ingredients.'}
              </p>

              {selectedProduct.allergens && selectedProduct.allergens.length > 0 && (
                <div className="pt-1 flex items-start gap-1.5 text-[11px] text-[#3B241C]/80">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#3B241C] shrink-0 mt-0.5" />
                  <span>Allergen Notice: {selectedProduct.allergens.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Quantity and Add to Bag Row */}
            <div className="pt-2 flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-[#3B241C]/30">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-[#3B241C] hover:bg-[#3B241C]/10 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-mono font-bold tabular-nums text-[#3B241C]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 text-[#3B241C] hover:bg-[#3B241C]/10 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                onClick={handleAdd}
                disabled={selectedProduct.stockStatus === 'Sold Out' || selectedProduct.stockQuantity === 0}
                className={`flex-1 py-3.5 px-6 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  added
                    ? 'bg-[#3B241C] text-white'
                    : 'bg-[#3B241C] text-white hover:bg-[#3B241C]/90'
                }`}
              >
                {selectedProduct.stockStatus === 'Sold Out' || selectedProduct.stockQuantity === 0 ? (
                  <span>Sold Out</span>
                ) : added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag (Rs. {totalPrice.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>

            {/* Serving suggestion tip */}
            <div className="p-3 bg-white border border-[#3B241C]/15 text-[11px] text-[#3B241C]/80 flex items-start gap-2">
              <Flame className="w-4 h-4 text-[#3B241C] shrink-0 mt-0.5" />
              <span>
                <strong>Bakery Serving Suggestion:</strong> Enjoy fresh upon pickup. Pizzas and stuffed buns can be gently warmed for 20 seconds in a microwave or 3 minutes in a toaster oven.
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
