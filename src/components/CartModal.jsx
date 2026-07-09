import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { CartIcon, TrashIcon, PlusIcon, MinusIcon } from './Icons.jsx';

export default function CartModal({ isOpen, onClose }) {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const [showCheckoutForm, setShowCheckoutForm] = useState(false);
    const [orderForm, setOrderForm] = useState({ address: '', phone: '', email: '' });
    const [submitting, setSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    const handleCheckout = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Import supabase dynamically to avoid circular dependency
            const { supabase } = await import('../lib/supabaseClient.js');

            // Get vendor ID from first cart item
            const vendorId = cartItems[0]?.vendor_id;

            const checkoutPayload = {
                vendor_id: vendorId,
                items: JSON.stringify(cartItems.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity
                }))),
                total: cartTotal,
                address: orderForm.address,
                phone: orderForm.phone,
                customer_email: orderForm.email,
                status: 'Pending'
            };

            const { error } = await supabase
                .from('orders')
                .insert([checkoutPayload]);

            if (error) throw error;

            // Decrement stock for each item
            for (const item of cartItems) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ 
                        stock_quantity: Math.max(0, (item.stock_quantity || item.quantity || 1) - item.quantity),
                        in_stock: (item.stock_quantity || item.quantity || 1) - item.quantity > 0
                    })
                    .eq('id', item.id);
                if (stockError) console.error('Error updating stock for', item.id, ':', stockError);
            }

            setOrderSuccess(true);
            clearCart();

            setTimeout(() => {
                setShowCheckoutForm(false);
                setOrderSuccess(false);
                setOrderForm({ address: '', phone: '', email: '' });
                onClose();
            }, 2500);

        } catch (err) {
            setToast({ show: true, message: `Order failed: ${err.message}`, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[500px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Shopping Cart</h2>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{cartItems.length} items in cart</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-950 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {orderSuccess ? (
                    <div className="py-10 text-center text-emerald-700 font-bold uppercase tracking-wider text-xs bg-emerald-50/70 border border-emerald-100/80 rounded-2xl">
                        🎉 Order Placed Successfully!
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CartIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-600 mb-2">Your cart is empty</p>
                        <p className="text-xs text-slate-400 mb-6">Add items to get started</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : showCheckoutForm ? (
                    <form onSubmit={handleCheckout} className="space-y-4">
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-4">
                            <p className="text-xs font-bold text-slate-700 mb-1">Order Total</p>
                            <p className="text-2xl font-black text-blue-600">₦{cartTotal.toFixed(2)}</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={orderForm.email}
                                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-xs font-medium outline-none transition-all"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Delivery Address</label>
                            <input
                                type="text"
                                required
                                value={orderForm.address}
                                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-xs font-medium outline-none transition-all"
                                placeholder="Street, City, State"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                            <input
                                type="tel"
                                required
                                value={orderForm.phone}
                                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-xs font-medium outline-none transition-all"
                                placeholder="+234 801 234 5678"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCheckoutForm(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                            >
                                Back to Cart
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : 'Place Order'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        {/* Cart Items */}
                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                                        <p className="text-sm font-black text-blue-600 mt-1">₦{Number(item.price).toFixed(2)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-100"
                                            >
                                                <MinusIcon className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-100"
                                            >
                                                <PlusIcon className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="ml-auto text-red-600 hover:text-red-700"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cart Summary */}
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600">Subtotal</span>
                                <span className="text-lg font-black text-slate-950">₦{cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => setShowCheckoutForm(true)}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-md"
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}

                {/* Toast */}
                {toast.show && (
                    <div className="fixed bottom-4 right-4 bg-slate-950 text-white px-6 py-3 rounded-xl shadow-lg text-xs font-bold z-50">
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}