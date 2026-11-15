import React, { useState } from 'react';
import { X, Minus, Plus, Trash2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalItems,
    setIsCheckoutOpen
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [selectedPickupSlot, setSelectedPickupSlot] = useState('Today: 04:30 PM – 06:00 PM (Fresh Evening Bake)');
  const [specialPacking, setSpecialPacking] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'OAKFRESH' || clean === 'WELCOME10') {
      setDiscountPercent(10);
      setPromoMessage('10% Hearth Welcome discount applied');
    } else {
      setPromoMessage('Invalid promo code. Try "OAKFRESH"');
    }
  };

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = subtotal - discountAmount;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#3B241C]/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-white border-l border-[#3B241C]/20 shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-6 border-b border-[#3B241C]/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B241C]/60">
                Counter Collection
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#3B241C]">
                Your Bakery Bag ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#3B241C] hover:bg-[#3B241C]/5 transition-colors cursor-pointer border border-[#3B241C]/15"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto border border-[#3B241C]/20 flex items-center justify-center text-[#3B241C]/40 font-serif text-2xl">
                  &amp;
                </div>
                <h3 className="text-xl font-serif font-bold text-[#3B241C]">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-[#3B241C]/70 max-w-xs mx-auto">
                  Select fresh small pizzas, chocolate fudge cakes, walnut brownies, or fresh bakery bread.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#3B241C] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#3B241C]/90 transition-colors cursor-pointer"
                >
                  Browse Bakery Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-4">
                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="border border-[#3B241C]/15 p-4 flex gap-4 bg-white hover:border-[#3B241C]/40 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-[#3B241C]/5 shrink-0 overflow-hidden border border-[#3B241C]/10">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Details & Controls */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-serif font-bold text-[#3B241C]">
                              {product.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="text-[#3B241C]/40 hover:text-[#3B241C] transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <p className="text-[11px] text-[#3B241C]/60 font-mono">
                            {product.categoryLabel} · {product.weight}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-[#3B241C]/25">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 hover:bg-[#3B241C]/10 transition-colors text-[#3B241C]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-mono font-bold tabular-nums text-[#3B241C]">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="p-1 hover:bg-[#3B241C]/10 transition-colors text-[#3B241C]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-sm font-serif font-bold text-[#3B241C] tabular-nums">
                            Rs. {(product.price * quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pickup Window Selection */}
                <div className="border border-[#3B241C]/15 p-4 bg-[#3B241C]/[0.02] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3B241C]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Select Pickup Window</span>
                  </div>
                  <select
                    value={selectedPickupSlot}
                    onChange={(e) => setSelectedPickupSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#3B241C]/20 bg-white text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  >
                    <option value="Today: 04:30 PM – 06:00 PM (Fresh Evening Bake)">Today: 04:30 PM – 06:00 PM (Fresh Evening Bake)</option>
                    <option value="Today: 06:30 PM – 08:30 PM (Dinner &amp; Tea Hour)">Today: 06:30 PM – 08:30 PM (Dinner &amp; Tea Hour)</option>
                    <option value="Tomorrow: 08:00 AM – 10:30 AM (Breakfast Pull)">Tomorrow: 08:00 AM – 10:30 AM (Breakfast Pull)</option>
                  </select>
                  <p className="text-[11px] text-[#3B241C]/65">
                    Items are boxed and ready at our pickup counter at 42 Oak Hearth Lane.
                  </p>
                </div>

                {/* Complimentary Birthday / Gift Packaging Note */}
                <label className="flex items-center gap-2.5 text-xs text-[#3B241C]/80 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={specialPacking}
                    onChange={(e) => setSpecialPacking(e.target.checked)}
                    className="accent-[#3B241C] w-4 h-4 cursor-pointer"
                  />
                  <span>Include gift ribbon and cake birthday candles (complimentary)</span>
                </label>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. OAKFRESH)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-[#3B241C]/25 text-[#3B241C] uppercase placeholder-[#3B241C]/40 focus:outline-none focus:border-[#3B241C]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#3B241C]/10 text-[#3B241C] hover:bg-[#3B241C] hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <p className="text-[11px] text-[#3B241C]/75 font-mono mt-1">
                      {promoMessage}
                    </p>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Drawer Footer / Subtotal & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-[#3B241C]/15 bg-[#3B241C]/[0.02] space-y-3 sm:space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#3B241C]/70">
                  <span>Bakery Subtotal</span>
                  <span className="font-mono tabular-nums">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-[#3B241C] font-semibold">
                    <span>Discount (10% OAKFRESH)</span>
                    <span className="font-mono tabular-nums">-Rs. {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-serif font-bold text-[#3B241C] pt-2 border-t border-[#3B241C]/15">
                  <span>Total Due (PKR)</span>
                  <span className="font-mono tabular-nums text-lg">Rs. {finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-4 bg-[#3B241C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3B241C]/90 transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-sm"
              >
                <span>Proceed to Reserve (Rs. {finalTotal.toLocaleString()})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#3B241C]/60 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3B241C]" />
                <span>Reserve in advance · Pay at counter upon collection</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
