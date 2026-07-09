import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { LogoIcon, SearchIcon, PackageIcon } from '../components/Icons.jsx';

export default function OrderTracking() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSearched(false);

        try {
            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (email && orderId) {
                query = query
                    .eq('customer_email', email)
                    .eq('id', orderId);
            } else if (email) {
                query = query.eq('customer_email', email);
            } else if (orderId) {
                query = query.eq('id', orderId);
            } else {
                setError('Please enter your email or order ID to search.');
                setLoading(false);
                return;
            }

            const { data, error: queryError } = await query;

            if (queryError) throw queryError;

            setOrders(data || []);
            setSearched(true);

            if (!data || data.length === 0) {
                setError('No orders found matching your search criteria.');
            }
        } catch (err) {
            setError(`Search error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        'Pending': 'bg-amber-50 text-amber-600 border-amber-200',
        'Processing': 'bg-purple-50 text-purple-600 border-purple-200',
        'Fulfilled': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'Cancelled': 'bg-red-50 text-red-600 border-red-200'
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/8 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] right-[-10%] w-[450px] h-[450px] bg-cyan-400/8 blur-[100px] rounded-full pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 px-4 sm:px-6 py-6">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer group">
                        <LogoIcon className="w-6 h-6" />
                        <span className="text-xl font-black tracking-tighter text-blue-950">brandeur</span>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors px-4 py-2"
                    >
                        Back to Home
                    </button>
                </div>
            </nav>

            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-16">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 text-xs font-extrabold tracking-widest text-blue-700 bg-blue-50 border border-blue-100/60 uppercase rounded-full shadow-sm">
                        <PackageIcon className="w-4 h-4" />
                        Order Status
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 mb-2">Track Your Order</h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Enter your email address or order ID to check the status of your purchases.
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-white border border-blue-100/40 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Order ID (optional)
                                </label>
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="First 8 characters..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><SearchIcon className="w-4 h-4" /> Search Orders</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
                        {error}
                    </div>
                )}

                {/* Order Results */}
                {searched && orders.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Found {orders.length} order{orders.length > 1 ? 's' : ''}
                        </p>
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white border border-blue-100/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Order #{order.id.slice(0, 8)}
                                        </p>
                                        <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                                    </div>
                                    <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${statusColors[order.status] || 'bg-slate-50 text-slate-600'}`}>
                                        {order.status}
                                    </span>
                                </div>

                                {/* Items */}
                                <div className="border-t border-slate-100 pt-3 mb-3">
                                    {(() => {
                                        try {
                                            const items = JSON.parse(order.items);
                                            return items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm py-1">
                                                    <span className="text-slate-700">{item.title} {item.quantity > 1 && `× ${item.quantity}`}</span>
                                                    <span className="font-bold text-slate-900">₦{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                                                </div>
                                            ));
                                        } catch {
                                            return <p className="text-sm text-slate-500">{order.items}</p>;
                                        }
                                    })()}
                                </div>

                                {/* Total */}
                                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Total</span>
                                    <span className="text-lg font-black text-blue-600">₦{Number(order.total).toFixed(2)}</span>
                                </div>

                                {/* Delivery */}
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                                    <p><span className="font-bold">Delivery:</span> {order.address}</p>
                                    {order.phone && <p className="mt-1"><span className="font-bold">Phone:</span> {order.phone}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {searched && orders.length === 0 && !error && (
                    <div className="text-center py-12 border border-dashed border-blue-100 rounded-3xl bg-slate-50/30">
                        <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-sm font-bold text-slate-400">No orders found</p>
                        <p className="text-xs text-slate-400 mt-1">Check your email or order ID and try again</p>
                    </div>
                )}
            </main>
        </div>
    );
}