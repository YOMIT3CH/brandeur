export default function OrderDetailsModal({ isOpen, onClose, order }) {
    if (!isOpen || !order) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    let items;
    try {
        items = JSON.parse(order.items);
    } catch {
        items = [{ title: order.items, price: order.total, quantity: 1 }];
    }

    const statusColors = {
        'Pending': 'bg-amber-50 text-amber-600 border-amber-200',
        'Processing': 'bg-purple-50 text-purple-600 border-purple-200',
        'Fulfilled': 'bg-blue-50 text-blue-600 border-blue-200',
        'Cancelled': 'bg-red-50 text-red-600 border-red-200'
    };

    return (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[500px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">Order Details</h2>
                        <p className="text-xs text-slate-400 font-mono mt-1">{order.id.slice(0, 8)}...</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-950 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Order Status */}
                <div className="mb-6">
                    <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${statusColors[order.status] || 'bg-slate-50 text-slate-600'}`}>
                        {order.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2">
                        Placed on {formatDate(order.created_at)}
                    </p>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Order Items</h3>
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity || 1}</p>
                                    </div>
                                    <p className="text-sm font-black text-slate-950">
                                        ₦{(item.price * (item.quantity || 1)).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Total */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Order Total</span>
                        <span className="text-2xl font-black text-blue-600">₦{Number(order.total).toFixed(2)}</span>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Customer Information</h3>
                    <div className="space-y-2">
                        {order.customer_email && (
                            <div className="flex items-start gap-2">
                                <span className="text-xs font-bold text-slate-500 min-w-[80px]">Email:</span>
                                <span className="text-xs text-slate-700">{order.customer_email}</span>
                            </div>
                        )}
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-slate-500 min-w-[80px]">Phone:</span>
                            <span className="text-xs text-slate-700">{order.phone}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-slate-500 min-w-[80px]">Address:</span>
                            <span className="text-xs text-slate-700">{order.address}</span>
                        </div>
                    </div>
                </div>

                {/* Order Notes */}
                {order.notes && (
                    <div className="mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {order.notes}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}