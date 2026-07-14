import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { LogoIcon, CartIcon, SearchIcon, MinusIcon, PlusIcon } from './Icons.jsx';
import Toast from './Toast.jsx';
import CartModal from './CartModal.jsx';
import { useCart } from '../context/CartContext.jsx';

// Skeleton Loading Component
const ProductSkeleton = () => (
    <div className="bg-white border border-blue-100/40 rounded-3xl overflow-hidden p-5 shadow-[0_4px_25px_rgba(37,99,235,0.01)] animate-shimmer">
        <div className="w-full h-52 rounded-2xl bg-slate-200 mb-4" />
        <div className="h-5 bg-slate-200 rounded mb-2" />
        <div className="h-3 bg-slate-200 rounded mb-4 w-3/4" />
        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
            <div className="h-4 bg-slate-200 rounded w-16" />
            <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded" />
                <div className="w-20 h-8 bg-slate-200 rounded" />
            </div>
        </div>
    </div>
);

export default function StoreFront() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { cartCount, addToCart } = useCart();

    // Core Data Pipeline States
    const [vendor, setVendor] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [vendorPaymentMethods, setVendorPaymentMethods] = useState(null);
    
    // Cart & Search States
    const [showCart, setShowCart] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Order & Modal Pipeline States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [orderForm, setOrderForm] = useState({ address: '', phone: '', email: '' });
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Discount States
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountError, setDiscountError] = useState('');
    
    // Pagination States
    const [page, setPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const productsPerPage = 12;
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    
    // Get unique categories
    const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
    
    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    useEffect(() => {
        async function loadStorefrontData() {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch vendor profile matching the dynamic URL path slug
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, store_name, payment_methods')
                    .eq('store_slug', slug)
                    .single();

                if (profileError || !profileData) {
                    throw new Error('This store channel does not exist or has been modified.');
                }

                setVendor(profileData);
                setVendorPaymentMethods(profileData.payment_methods || {
                    bank_transfer: { enabled: false },
                    mobile_money: { enabled: false },
                    cash_on_delivery: { enabled: true }
                });

                // 2. Get total count for pagination
                const { count: totalCount, error: countError } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('vendor_id', profileData.id);

                if (countError) throw countError;
                setTotalProducts(totalCount || 0);

                // 3. Query active catalog pipelines with pagination
                const from = (page - 1) * productsPerPage;
                const to = from + productsPerPage - 1;
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('vendor_id', profileData.id)
                    .order('created_at', { ascending: false })
                    .range(from, to);

                if (productsError) throw productsError;
                setProducts(productsData);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (slug) loadStorefrontData();
    }, [slug, page]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Calculate total with discount
            const baseTotal = Number(selectedProduct.price) * orderQuantity;
            const discountAmount = appliedDiscount 
                ? (appliedDiscount.type === 'percentage' 
                    ? baseTotal * (appliedDiscount.value / 100)
                    : Math.min(appliedDiscount.value, baseTotal))
                : 0;
            const finalTotal = baseTotal - discountAmount;

            // Packages order schema precisely into your target columns
            const checkoutPayload = {
                vendor_id: vendor.id,
                items: JSON.stringify([{
                    id: selectedProduct.id,
                    title: selectedProduct.title,
                    price: selectedProduct.price,
                    quantity: orderQuantity
                }]),
                total: finalTotal,
                address: orderForm.address,
                phone: orderForm.phone,
                customer_email: orderForm.email,
                status: 'Pending',
                discount_code: appliedDiscount?.code || null,
                discount_amount: discountAmount
            };

            // Increment discount usage if applied
            if (appliedDiscount) {
                await supabase
                    .from('discounts')
                    .update({ uses: (appliedDiscount.uses || 0) + 1 })
                    .eq('id', appliedDiscount.id);
            }

            const { error: orderError } = await supabase
                .from('orders')
                .insert([checkoutPayload]);

            if (orderError) throw orderError;

            // Decrement stock quantity
            const { error: stockError } = await supabase
                .from('products')
                .update({ 
                    stock_quantity: Math.max(0, (selectedProduct.stock_quantity || 1) - orderQuantity),
                    in_stock: (selectedProduct.stock_quantity || 1) - orderQuantity > 0
                })
                .eq('id', selectedProduct.id);

            if (stockError) console.error('Error updating stock:', stockError);

            setOrderSuccess(true);
            setOrderForm({ address: '', phone: '', email: '' });
            setOrderQuantity(1);

            setTimeout(() => {
                setSelectedProduct(null);
                setOrderSuccess(false);
            }, 2500);

        } catch (err) {
            setToast({ show: true, message: `Transaction Exception: ${err.message}`, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Reset quantity when product changes
    useEffect(() => {
        if (selectedProduct) {
            setOrderQuantity(1);
        }
    }, [selectedProduct]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
                <span className="inline-block w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Syncing Merchant Pipeline...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold mb-4">⚠️</div>
                <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-1">Pipeline Routing Fault</h2>
                <p className="text-xs text-slate-400 font-medium max-w-xs">{error}</p>
                <button onClick={() => navigate('/')} className="mt-6 text-xs font-bold text-blue-600 hover:underline">Return to core link</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased relative overflow-x-hidden flex flex-col justify-between">

            {/* Ambient Background Glow System */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-400/5 blur-[120px] rounded-full pointer-events-none" />

            <div>
                {/* Header Navbar */}
                <header className="bg-white/80 backdrop-blur-md border-b border-blue-50/60 sticky top-0 z-30 shadow-[0_2px_20px_rgba(37,99,235,0.01)]">
                    <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
                        <div className="flex items-center gap-3 group">
                            <LogoIcon className="w-5 h-5" />
                            <div>
                                <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest block leading-none mb-0.5">Live Channel</span>
                                <h1 className="text-lg font-black tracking-tight text-slate-950 leading-tight">{vendor?.store_name}</h1>
                            </div>
                        </div>
                        <div className="hidden sm:inline-flex px-3 py-1 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-lg border border-slate-200/50 tracking-wide font-mono">
                            brandeur.platform/store/{slug}
                        </div>
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                        >
                            <CartIcon className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Main Product Space Grid */}
                <main className="max-w-6xl w-full mx-auto px-6 py-12 relative z-10">
                    
                    {/* Search & Filter Bar */}
                    {products.length > 0 && (
                        <div className="mb-8 space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-blue-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            
                            {/* Category Filter */}
                            {categories.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                                selectedCategory === category
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {category === 'all' ? 'All Products' : category}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-24 border border-dashed border-blue-100 rounded-3xl bg-slate-50/30 max-w-md mx-auto">
                            {searchQuery || selectedCategory !== 'all' ? (
                                <>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">No products match your search</p>
                                    <p className="text-[10px] text-slate-400 mb-4">Try adjusting your search or filter criteria</p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('all');
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">No products available yet</p>
                                    <p className="text-[10px] text-slate-400">The vendor hasn't added any products to their store</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className="bg-white border border-blue-50/60 rounded-3xl overflow-hidden p-5 shadow-[0_4px_25px_rgba(37,99,235,0.01)] hover:shadow-[0_12px_30px_rgba(37,99,235,0.04)] hover:border-blue-100 transition-all duration-300 flex flex-col justify-between group">
                                    <div>
                                        {product.image_urls?.[0] || product.image_url ? (
                                            <div className="w-full h-52 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 mb-4 relative cursor-pointer"
                                                onClick={() => setViewingProduct(product)}
                                            >
                                                <img 
                                                    src={product.image_urls?.[0] || product.image_url} 
                                                    alt={product.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">Image Unavailable</div>';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-52 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 mb-4 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase cursor-pointer"
                                                onClick={() => setViewingProduct(product)}
                                            >
                                                No Image
                                            </div>
                                        )}
                                        <h3 className="font-bold text-slate-950 text-base tracking-tight mb-1 group-hover:text-blue-600 transition-colors cursor-pointer"
                                            onClick={() => setViewingProduct(product)}
                                        >{product.title}</h3>
                                        <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed mb-3 cursor-pointer"
                                            onClick={() => setViewingProduct(product)}
                                        >{product.description || 'No description available'}</p>
                                        
                                        {/* Stock Count */}
                                        {product.in_stock && product.stock_quantity > 0 && (
                                            <div className="mb-3">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                    Stock: {product.stock_quantity}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {!product.in_stock || product.stock_quantity <= 0 ? (
                                        <div className="pt-3 border-t border-slate-50">
                                            <span className="block w-full px-3 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs text-center uppercase tracking-wider">
                                                Out of Stock
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Price</span>
                                                <span className="text-base font-black text-slate-950">₦{Number(product.price).toFixed(2)}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        addToCart(product);
                                                        setToast({ show: true, message: 'Added to cart!', type: 'success' });
                                                    }}
                                                    className="px-3 py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold rounded-xl text-xs tracking-wider transition-colors shadow-sm"
                                                >
                                                    <CartIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedProduct(product)}
                                                    className="px-5 py-2.5 bg-slate-950 hover:bg-blue-600 text-white font-bold rounded-xl text-xs tracking-wider transition-colors uppercase shadow-sm"
                                                >
                                                    Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-5 py-2.5 bg-white border border-blue-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ← Previous
                            </button>
                            <div className="flex gap-1.5">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const startPage = Math.max(1, page - 2);
                                    const pageNum = startPage + i;
                                    if (pageNum > totalPages) return null;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                                pageNum === page
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-white border border-blue-100 text-slate-600 hover:bg-blue-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-5 py-2.5 bg-white border border-blue-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Direct Instant Checkout Overlay Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-[420px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">

                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">Direct Purchase</h2>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Complete your order securely</p>
                            </div>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-[10px] font-black text-slate-400 hover:text-slate-950 uppercase bg-slate-50 hover:bg-slate-100 border border-slate-200/40 px-2.5 py-1 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        {orderSuccess ? (
                            <div className="py-10 text-center text-emerald-700 font-bold uppercase tracking-wider text-xs bg-emerald-50/70 border border-emerald-100/80 rounded-2xl animate-scaleUp">
                                🎉 Order Placed Successfully!
                            </div>
                        ) : (
                            <form onSubmit={handlePlaceOrder} className="space-y-4">
                                {/* Item Details Card */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div className="max-w-[70%]">
                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Selected Item</span>
                                        <p className="text-xs font-bold text-slate-800 truncate">{selectedProduct.title}</p>
                                    </div>
                                    <span className="text-sm font-black text-slate-950">₦{Number(selectedProduct.price).toFixed(2)}</span>
                                </div>

                                {/* Quantity Selector */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setOrderQuantity(q => Math.max(1, q - 1))}
                                            disabled={orderQuantity <= 1}
                                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center disabled:opacity-50"
                                        >
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="text-lg font-black text-slate-950 w-12 text-center">{orderQuantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setOrderQuantity(q => Math.min(selectedProduct.stock_quantity || 999, q + 1))}
                                            disabled={orderQuantity >= (selectedProduct.stock_quantity || 999)}
                                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center disabled:opacity-50"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] text-slate-400 ml-2">Available: {selectedProduct.stock_quantity || 'Unlimited'}</span>
                                    </div>
                                </div>

                                {/* Discount Code Input */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Discount Code (optional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter code"
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                            disabled={!!appliedDiscount || submitting}
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-blue-600/5 disabled:opacity-60"
                                        />
                                        {appliedDiscount ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAppliedDiscount(null);
                                                    setDiscountCode('');
                                                }}
                                                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!discountCode) return;
                                                    try {
                                                        const { data, error } = await supabase
                                                            .from('discounts')
                                                            .select('*')
                                                            .eq('code', discountCode)
                                                            .eq('vendor_id', vendor.id)
                                                            .single();
                                                        
                                                        if (error || !data) {
                                                            setDiscountError('Invalid discount code');
                                                            return;
                                                        }

                                                        // Check expiry
                                                        if (data.expires_at && new Date(data.expires_at) < new Date()) {
                                                            setDiscountError('Discount has expired');
                                                            return;
                                                        }

                                                        // Check max uses
                                                        if (data.max_uses && data.uses >= data.max_uses) {
                                                            setDiscountError('Discount usage limit reached');
                                                            return;
                                                        }

                                                        // Check minimum order
                                                        const total = Number(selectedProduct.price) * orderQuantity;
                                                        if (data.min_order && total < data.min_order) {
                                                            setDiscountError(`Minimum order of ₦${data.min_order} required`);
                                                            return;
                                                        }

                                                        setAppliedDiscount(data);
                                                        setDiscountError('');
                                                        setToast({ show: true, message: `Discount ${data.code} applied!`, type: 'success' });
                                                    } catch (err) {
                                                        setDiscountError('Error applying discount');
                                                    }
                                                }}
                                                disabled={!discountCode || submitting}
                                                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
                                            >
                                                Apply
                                            </button>
                                        )}
                                    </div>
                                    {discountError && (
                                        <p className="text-[10px] text-red-600 mt-1">{discountError}</p>
                                    )}
                                    {appliedDiscount && (
                                        <p className="text-[10px] text-emerald-600 mt-1 font-bold">
                                            {appliedDiscount.type === 'percentage' 
                                                ? `${appliedDiscount.value}% off` 
                                                : `₦${appliedDiscount.value} off`}
                                        </p>
                                    )}
                                </div>

                                {/* Total */}
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700">Total Amount</span>
                                        <span className="text-xl font-black text-blue-600">
                                            ₦{appliedDiscount 
                                                ? (appliedDiscount.type === 'percentage' 
                                                    ? (Number(selectedProduct.price) * orderQuantity * (1 - appliedDiscount.value / 100)).toFixed(2)
                                                    : Math.max(0, Number(selectedProduct.price) * orderQuantity - appliedDiscount.value).toFixed(2)
                                                )
                                                : (Number(selectedProduct.price) * orderQuantity).toFixed(2)
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Methods Display */}
                                {vendorPaymentMethods && (
                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2">Accepted Payment Methods</p>
                                        <div className="flex flex-wrap gap-2">
                                            {vendorPaymentMethods.bank_transfer?.enabled && (
                                                <span className="text-[10px] font-bold px-2 py-1 bg-white border border-blue-200 rounded-lg text-blue-700">🏦 Bank Transfer</span>
                                            )}
                                            {vendorPaymentMethods.mobile_money?.enabled && (
                                                <span className="text-[10px] font-bold px-2 py-1 bg-white border border-blue-200 rounded-lg text-blue-700">📱 Mobile Money</span>
                                            )}
                                            {vendorPaymentMethods.cash_on_delivery?.enabled && (
                                                <span className="text-[10px] font-bold px-2 py-1 bg-white border border-blue-200 rounded-lg text-blue-700">💵 Cash on Delivery</span>
                                            )}
                                        </div>
                                        {vendorPaymentMethods.bank_transfer?.enabled && (
                                            <div className="mt-2 p-2 bg-white rounded-lg border border-blue-100">
                                                <p className="text-[10px] font-bold text-slate-700">Bank: {vendorPaymentMethods.bank_transfer.bank_name}</p>
                                                <p className="text-[10px] font-bold text-slate-700">Account: {vendorPaymentMethods.bank_transfer.account_name}</p>
                                                <p className="text-[10px] font-bold text-slate-700">Number: {vendorPaymentMethods.bank_transfer.account_number}</p>
                                            </div>
                                        )}
                                        {vendorPaymentMethods.mobile_money?.enabled && (
                                            <div className="mt-2 p-2 bg-white rounded-lg border border-blue-100">
                                                <p className="text-[10px] font-bold text-slate-700">Provider: {vendorPaymentMethods.mobile_money.provider}</p>
                                                <p className="text-[10px] font-bold text-slate-700">Phone: {vendorPaymentMethods.mobile_money.phone_number}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Email Input */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Email Address (for order confirmation)</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={submitting}
                                        placeholder="your@email.com"
                                        value={orderForm.email}
                                        onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-blue-600/5 disabled:opacity-60"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">We'll send your order confirmation here</p>
                                </div>

                                {/* Address Input */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Delivery Address</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={submitting}
                                        placeholder="Street, City, State"
                                        value={orderForm.address}
                                        onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-blue-600/5 disabled:opacity-60"
                                    />
                                </div>

                                {/* Phone Input */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        disabled={submitting}
                                        placeholder="+234 801 234 5678"
                                        value={orderForm.phone}
                                        onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-blue-600/5 disabled:opacity-60"
                                    />
                                </div>

                                {/* Submit Actions */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs tracking-widest uppercase transition-all shadow-md shadow-blue-600/10 disabled:bg-blue-400 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Place Order'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Sticky Footprint Context */}
            <footer className="w-full border-t border-slate-100 py-6 text-center bg-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Secured Channel Engine // Hosted via brandeur Core
                </p>
            </footer>

            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            {/* Product Detail Modal */}
            {viewingProduct && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-[600px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Product Details</h2>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">View product information</p>
                            </div>
                            <button
                                onClick={() => setViewingProduct(null)}
                                className="text-[10px] font-black text-slate-400 hover:text-slate-950 uppercase bg-slate-50 hover:bg-slate-100 border border-slate-200/40 px-2.5 py-1 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Product Image */}
                            {viewingProduct.image_urls?.[0] || viewingProduct.image_url ? (
                                <div className="w-full h-64 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                                    <img 
                                        src={viewingProduct.image_urls?.[0] || viewingProduct.image_url} 
                                        alt={viewingProduct.title} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">Image Unavailable</div>';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-64 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                    No Image
                                </div>
                            )}

                            {/* Product Info */}
                            <div>
                                <h3 className="text-lg font-black text-slate-950 mb-2">{viewingProduct.title}</h3>
                                <p className="text-xs text-slate-600 mb-3">{viewingProduct.description || 'No description available'}</p>
                                
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Price</span>
                                    <span className="text-xl font-black text-blue-600">₦{Number(viewingProduct.price).toFixed(2)}</span>
                                </div>

                                {viewingProduct.in_stock && viewingProduct.stock_quantity > 0 && (
                                    <div className="mb-3">
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                            Stock: {viewingProduct.stock_quantity}
                                        </span>
                                    </div>
                                )}

                                {viewingProduct.category && (
                                    <div className="mb-3">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                                        <span className="text-xs text-slate-600 ml-2">{viewingProduct.category}</span>
                                    </div>
                                )}

                                {viewingProduct.tags?.length > 0 && (
                                    <div className="mb-3">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tags</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {viewingProduct.tags.map((tag, idx) => (
                                                <span key={idx} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        addToCart(viewingProduct);
                                        setToast({ show: true, message: 'Added to cart!', type: 'success' });
                                        setViewingProduct(null);
                                    }}
                                    disabled={!viewingProduct.in_stock || viewingProduct.stock_quantity <= 0}
                                    className="flex-1 px-4 py-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                                >
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedProduct(viewingProduct);
                                        setViewingProduct(null);
                                    }}
                                    disabled={!viewingProduct.in_stock || viewingProduct.stock_quantity <= 0}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Modal */}
            <CartModal
                isOpen={showCart}
                onClose={() => setShowCart(false)}
            />
        </div>
    );
}
