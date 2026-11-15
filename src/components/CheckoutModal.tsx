import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Clock, MapPin, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'idem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
};

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen, cart, subtotal, clearCart, addCustomerOrder } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    pickupTime: 'Today: 04:30 PM – 06:00 PM (Fresh Evening Bake)',
    paymentMethod: 'Pay at Bakery Counter',
    notes: '',
  });

  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState<number>(subtotal);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(createIdempotencyKey);

  useEffect(() => {
    if (isCheckoutOpen && !orderConfirmed) {
      setIdempotencyKey(createIdempotencyKey());
      setSubmitError(null);
    }
  }, [isCheckoutOpen, orderConfirmed]);

  if (!isCheckoutOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setIsSubmitting(true);

    const result = await addCustomerOrder({
      customerName: formData.name,
      customerPhone: formData.phone,
      customerAddress: formData.address,
      pickupWindow: formData.pickupTime,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      idempotencyKey,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
      })),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error || 'Could not place your order. Please verify your details.');
      return;
    }

    setTicketId(result.orderNumber || 'OAK-' + Math.floor(100000 + Math.random() * 900000));
    setConfirmedTotal(typeof result.total === 'number' ? result.total : subtotal);
    setOrderConfirmed(true);
    clearCart();
  };

  const handleCopyTicket = () => {
    navigator.clipboard?.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setOrderConfirmed(false);
    setSubmitError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-[#3B241C]/45 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white border border-[#3B241C]/25 max-w-xl w-full p-4 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto my-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-[#3B241C] hover:bg-[#3B241C]/5 transition-colors border border-[#3B241C]/15 cursor-pointer z-10"
          aria-label="Close checkout modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!orderConfirmed ? (
          <div>
            <div className="space-y-1 mb-6 border-b border-[#3B241C]/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B241C]/60">
                Reserve Bakery Order · No Account Needed
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3B241C]">
                Confirm Your Bakery Order
              </h2>
              <p className="text-xs text-[#3B241C]/75">
                We prepare and package your fresh bakes from 42 Oak Hearth Lane.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Bilal Ahmed"
                    className="w-full px-3 py-2 text-xs border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    minLength={7}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 text-xs border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. House 14, Street 6, Gulberg III, Lahore"
                  className="w-full px-3 py-2 text-xs border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Delivery / Pickup Time Window *
                </label>
                <select
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#3B241C]/25 text-[#3B241C] bg-white focus:outline-none focus:border-[#3B241C]"
                >
                  <option value="Today: 04:30 PM – 06:00 PM (Fresh Evening Bake)">
                    Today: 04:30 PM – 06:00 PM (Fresh Evening Bake)
                  </option>
                  <option value="Today: 06:30 PM – 08:30 PM (Dinner & Tea Hour)">
                    Today: 06:30 PM – 08:30 PM (Dinner &amp; Tea Hour)
                  </option>
                  <option value="Tomorrow: 08:00 AM – 10:30 AM (Breakfast Pull)">
                    Tomorrow: 08:00 AM – 10:30 AM (Breakfast Pull)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3B241C] mb-1">
                  Special Instructions / Order Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Please write Happy Birthday on cake box, pack pizza hot..."
                  className="w-full px-3 py-2 text-xs border border-[#3B241C]/25 text-[#3B241C] focus:outline-none focus:border-[#3B241C]"
                />
              </div>

              {/* Payment selection */}
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3B241C] mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Pay at Bakery Counter' })}
                    className={`p-3 border text-left cursor-pointer transition-colors ${
                      formData.paymentMethod === 'Pay at Bakery Counter'
                        ? 'border-[#3B241C] bg-[#3B241C]/5 font-semibold text-[#3B241C]'
                        : 'border-[#3B241C]/20 text-[#3B241C]/70 hover:border-[#3B241C]/40'
                    }`}
                  >
                    <div className="font-serif">Cash on Delivery / Pickup</div>
                    <div className="text-[10px] text-[#3B241C]/60 mt-0.5">Pay upon receiving order</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Card / Raast / EasyPaisa' })}
                    className={`p-3 border text-left cursor-pointer transition-colors ${
                      formData.paymentMethod === 'Card / Raast / EasyPaisa'
                        ? 'border-[#3B241C] bg-[#3B241C]/5 font-semibold text-[#3B241C]'
                        : 'border-[#3B241C]/20 text-[#3B241C]/70 hover:border-[#3B241C]/40'
                    }`}
                  >
                    <div className="font-serif">Card / Raast / EasyPaisa</div>
                    <div className="text-[10px] text-[#3B241C]/60 mt-0.5">Pay at counter / rider</div>
                  </button>
                </div>
              </div>

              {/* Summary line */}
              <div className="p-4 bg-[#3B241C]/5 border border-[#3B241C]/15 text-xs flex justify-between items-center mt-4">
                <div>
                  <span className="font-semibold text-[#3B241C]">Estimated Total (PKR):</span>
                  <span className="text-[#3B241C]/70 block text-[11px]">
                    {cart.length} unique items · Verified on submit
                  </span>
                </div>
                <div className="text-xl font-serif font-bold text-[#3B241C] tabular-nums">
                  Rs. {subtotal.toLocaleString()}
                </div>
              </div>

              {submitError && (
                <div className="p-3 border border-[#3B241C]/30 bg-[#3B241C]/10 text-xs font-semibold text-[#3B241C]">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-4 bg-[#3B241C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3B241C]/90 transition-colors cursor-pointer mt-4 disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting Order...' : 'Place Bakery Order'}
              </button>
            </form>
          </div>
        ) : (
          /* Order Confirmation View */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 mx-auto bg-[#3B241C] text-white flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest font-mono text-[#3B241C]/60">
                Order Logged
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#3B241C]">
                Your Order is Confirmed
              </h2>
              <p className="text-xs sm:text-sm text-[#3B241C]/80 max-w-sm mx-auto font-sans">
                Thank you, {formData.name}. Your order has been dispatched to the kitchen queue.
              </p>
            </div>

            {/* Ticket Box */}
            <div className="p-6 border border-[#3B241C] bg-[#3B241C]/[0.02] text-left space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between border-b border-[#3B241C]/15 pb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[#3B241C]/70">
                  Order Reference
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-mono font-bold text-[#3B241C]">#{ticketId}</span>
                  <button
                    onClick={handleCopyTicket}
                    className="p-1 text-[#3B241C] hover:bg-[#3B241C]/10 border border-[#3B241C]/20 transition-colors"
                    title="Copy Ticket ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#3B241C]/85">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#3B241C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#3B241C]">Delivery Address: </span>
                    {formData.address}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Store className="w-4 h-4 text-[#3B241C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#3B241C]">Verified Total: </span>
                    <span className="font-mono font-bold">Rs. {confirmedTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#3B241C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#3B241C]">Time Slot: </span>
                    {formData.pickupTime}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#3B241C]/15 text-[11px] text-[#3B241C]/70 font-mono">
                Order status logged in bakery kitchen display
              </div>
            </div>

            <button
              onClick={handleClose}
              className="px-8 py-3 bg-[#3B241C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3B241C]/90 transition-colors cursor-pointer"
            >
              Done &amp; Return to Bakery
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
