import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Toast: React.FC = () => {
  const { toastMessage, setIsCartOpen } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
      <div className="bg-[#3B241C] text-white border border-white/20 p-4 shadow-2xl flex items-center gap-4 max-w-sm">
        <div className="p-2 bg-white/10 shrink-0">
          <ShoppingBag className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-xs font-sans">
          <p className="font-semibold text-white">{toastMessage}</p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="text-xs uppercase font-mono tracking-wider underline underline-offset-4 text-white/90 hover:text-white shrink-0 cursor-pointer"
        >
          View Bag
        </button>
      </div>
    </div>
  );
};
