import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useImageUpload } from '../hooks/useImageUpload.js';
import { 
    PackageIcon, 
    DollarSignIcon,
    PlusIcon,
    EditIcon,
    TrashIcon,
    CopyIcon,
    CheckIcon,
    TrendingUpIcon,
    ClockIcon,
    SettingsIcon,
    LogOutIcon,
    MenuIcon,
    XIcon
} from './Icons.jsx';
import Toast from './Toast.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';
import OrderDetailsModal from './OrderDetailsModal.jsx';
import DiscountManager from './DiscountManager.jsx';

// Skeleton Components
const StatCardSkeleton = () => (
    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] animate-shimmer">
        <div className="h-4 bg-slate-200 rounded mb-2 w-20" />
        <div className="h-8 bg-slate-200 rounded mb-1 w-16" />
        <div className="h-3 bg-slate-200 rounded w-24" />
    </div>
);

const ProductSkeleton = () => (
    <div className="bg-white border border-blue-100/40 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] animate-shimmer">
        <div className="w-full h-32 bg-slate-200 rounded-xl mb-3" />
        <div className="h-4 bg-slate-200 rounded mb-2" />
        <div className="h-3 bg-slate-200 rounded mb-3 w-3/4" />
        <div className="flex justify-between">
            <div className="h-5 bg-slate-200 rounded w-16" />
            <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded" />
                <div className="w-8 h-8 bg-slate-200 rounded" />
            </div>
        </div>
    </div>
);

export default function VendorDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Vendor Profile State
    const [vendorProfile, setVendorProfile] = useState(null);

    // Orders State
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
    });

    // Products State
    const [products, setProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        tags: '',
        image_urls: [''],
        stock_quantity: 0,
        in_stock: true,
        variants: []
    });
    const [submitting, setSubmitting] = useState(false);
    const { uploadImage, deleteImage, uploading: imageUploading, error: imageError } = useImageUpload();

    // Profile Edit State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({
        store_name: '',
        store_description: '',
        store_phone: '',
        store_address: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Payment Methods State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState({
        bank_transfer: { enabled: false, account_name: '', account_number: '', bank_name: '' },
        mobile_money: { enabled: false, provider: '', phone_number: '' },
        cash_on_delivery: { enabled: true }
    });
    const [savingPaymentMethods, setSavingPaymentMethods] = useState(false);

    // Analytics State
    const [analytics, setAnalytics] = useState({
        dailySales: [],
        topProducts: [],
        orderStatusDistribution: { pending: 0, processing: 0, fulfilled: 0, cancelled: 0 }
    });
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [variants, setVariants] = useState([]);
    const [variantForm, setVariantForm] = useState({
        name: '',
        options: ['']
    });

    // Get current user session
    useEffect(() => {
        async function getSession() {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        }
        getSession();
    }, []);

    // Fetch vendor profile and data
    useEffect(() => {
        if (!session?.user) return;

        async function loadVendorData() {
            try {
                setLoading(true);

                // Fetch vendor profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) throw profileError;
                setVendorProfile(profile);
                setProfileForm({
                    store_name: profile.store_name || '',
                    store_description: profile.store_description || '',
                    store_phone: profile.store_phone || '',
                    store_address: profile.store_address || ''
                });
                setPaymentMethods(profile.payment_methods || {
                    bank_transfer: { enabled: false, account_name: '', account_number: '', bank_name: '' },
                    mobile_money: { enabled: false, provider: '', phone_number: '' },
                    cash_on_delivery: { enabled: true }
                });

                // Fetch products
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('vendor_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (productsError) throw productsError;
                setProducts(productsData);

                // Fetch orders
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('vendor_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (ordersError) throw ordersError;
                setOrders(ordersData);

                // Calculate stats
                const totalProducts = productsData?.length || 0;
                const totalOrders = ordersData?.length || 0;
                const pendingOrders = ordersData?.filter(o => o.status === 'Pending').length || 0;
                const totalRevenue = ordersData?.filter(o => o.status === 'Fulfilled').reduce((sum, o) => sum + Number(o.total), 0) || 0;
                
                setStats({ totalProducts, totalOrders, pendingOrders, totalRevenue });

            } catch (err) {
                setToast({ show: true, message: `Error loading vendor data: ${err.message}`, type: 'error' });
            } finally {
                setLoading(false);
            }
        }

        loadVendorData();
    }, [session]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const handleCopyLink = () => {
        const storeLink = `${window.location.origin}/store/${vendorProfile?.store_slug}`;
        navigator.clipboard.writeText(storeLink);
        setCopied(true);
        setToast({ show: true, message: 'Store link copied to clipboard!', type: 'success' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const productData = {
                vendor_id: session.user.id,
                title: productForm.title,
                description: productForm.description,
                price: parseFloat(productForm.price),
                category: productForm.category,
                tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()).filter(t => t) : [],
                image_url: productForm.image_urls?.[0] || null,
                image_urls: productForm.image_urls?.filter(url => url) || [],
                stock_quantity: parseInt(productForm.stock_quantity) || 0,
                in_stock: productForm.in_stock
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                
                if (error) throw error;
                setToast({ show: true, message: 'Product updated successfully!', type: 'success' });
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                
                if (error) throw error;
                setToast({ show: true, message: 'Product added successfully!', type: 'success' });
            }

            // Refresh products
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('vendor_id', session.user.id)
                .order('created_at', { ascending: false });
            setProducts(productsData);
            
            // Update stats
            setStats(prev => ({ ...prev, totalProducts: productsData?.length || 0 }));

            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm({
                title: '',
                description: '',
                price: '',
                category: '',
                tags: '',
                image_urls: [''],
                stock_quantity: 0,
                in_stock: true,
                variants: []
            });

        } catch (err) {
            setToast({ show: true, message: `Error saving product: ${err.message}`, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (product) => {
        setConfirmModal({
            show: true,
            message: `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    // Delete image if exists
                    if (product.image_url) {
                        try {
                            await deleteImage(product.image_url);
                        } catch (err) {
                            console.error('Error deleting image:', err);
                        }
                    }

                    const { error } = await supabase
                        .from('products')
                        .delete()
                        .eq('id', product.id);

                    if (error) throw error;

                    setProducts(prev => prev.filter(p => p.id !== product.id));
                    setStats(prev => ({ ...prev, totalProducts: prev.totalProducts - 1 }));
                    setToast({ show: true, message: 'Product deleted successfully!', type: 'success' });
                } catch (err) {
                    setToast({ show: true, message: `Error deleting product: ${err.message}`, type: 'error' });
                }
            }
        });
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
            setToast({ show: true, message: `Order status updated to ${newStatus}`, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: `Error updating order: ${err.message}`, type: 'error' });
        }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    store_name: profileForm.store_name,
                    store_description: profileForm.store_description,
                    store_phone: profileForm.store_phone,
                    store_address: profileForm.store_address
                })
                .eq('id', session.user.id);

            if (error) throw error;

            setVendorProfile(prev => ({ ...prev, ...profileForm }));
            setShowProfileModal(false);
            setToast({ show: true, message: 'Profile updated successfully!', type: 'success' });
        } catch (err) {
            setToast({ show: true, message: `Error saving profile: ${err.message}`, type: 'error' });
        } finally {
            setSavingProfile(false);
        }
    };

    const savePaymentMethods = async (e) => {
        e.preventDefault();
        setSavingPaymentMethods(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ payment_methods: paymentMethods })
                .eq('id', session.user.id);

            if (error) throw error;

            setVendorProfile(prev => ({ ...prev, payment_methods: paymentMethods }));
            setShowPaymentModal(false);
            setToast({ show: true, message: 'Payment methods saved!', type: 'success' });
        } catch (err) {
            setToast({ show: true, message: `Error saving payment methods: ${err.message}`, type: 'error' });
        } finally {
            setSavingPaymentMethods(false);
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
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
                <span className="inline-block w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Dashboard...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-blue-50/60 sticky top-0 z-30 shadow-[0_2px_20px_rgba(37,99,235,0.01)]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <PackageIcon className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-black text-slate-950">Vendor Dashboard</h1>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-xs transition-colors"
                        >
                            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Store Link'}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors"
                        >
                            <LogOutIcon className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 bg-slate-50 rounded-lg"
                    >
                        {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-blue-50 bg-white/90 backdrop-blur-md">
                        <div className="px-6 py-4 flex flex-col gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-xs transition-colors"
                            >
                                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy Store Link'}
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors"
                            >
                                <LogOutIcon className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <PackageIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Products</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">{stats.totalProducts}</p>
                    </div>
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <ClockIcon className="w-4 h-4 text-amber-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">{stats.pendingOrders}</p>
                    </div>
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Orders</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSignIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">₦{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-blue-50">
                    {['overview', 'products', 'orders', 'analytics'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 text-xs font-bold rounded-t-xl transition-all ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-blue-100'
                            }`}
                        >
                            {tab === 'overview' ? 'Store Overview' : tab === 'products' ? 'Product Catalog' : tab === 'orders' ? 'Order Management' : 'Analytics'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Store Profile Card */}
                        <div className="bg-white border border-blue-100/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-black text-slate-950">Store Profile</h2>
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                >
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Store Name</span>
                                    <p className="text-sm font-bold text-slate-900">{vendorProfile?.store_name}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                                    <p className="text-sm text-slate-600">{vendorProfile?.store_description || 'No description set'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Store Link</span>
                                    <p className="text-sm font-mono text-blue-600 break-all">/store/{vendorProfile?.store_slug}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods Card */}
                        <div className="bg-white border border-blue-100/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-black text-slate-950">Payment Methods</h2>
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {vendorProfile?.payment_methods?.bank_transfer?.enabled && (
                                    <span className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">🏦 Bank Transfer</span>
                                )}
                                {vendorProfile?.payment_methods?.mobile_money?.enabled && (
                                    <span className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">📱 Mobile Money</span>
                                )}
                                {vendorProfile?.payment_methods?.cash_on_delivery?.enabled && (
                                    <span className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">💵 Cash on Delivery</span>
                                )}
                                {!vendorProfile?.payment_methods && (
                                    <span className="text-xs text-slate-400">No payment methods configured</span>
                                )}
                            </div>
                        </div>

                        {/* Discount Codes Card */}
                        <div className="bg-white border border-blue-100/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                            <DiscountManager vendorId={session.user.id} />
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-slate-950">Product Catalog</h2>
                            <button
                                onClick={() => {
                                    setEditingProduct(null);
                                    setProductForm({
                                        title: '',
                                        description: '',
                                        price: '',
                                        category: '',
                                        tags: '',
                                        image_urls: [''],
                                        stock_quantity: 0,
                                        in_stock: true,
                                        variants: []
                                    });
                                    setShowProductModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Product
                            </button>
                        </div>

                        {products.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-blue-100 rounded-2xl bg-slate-50/30">
                                <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-400 mb-2">No products yet</p>
                                <p className="text-xs text-slate-400 mb-4">Start adding products to your store</p>
                                <button
                                    onClick={() => setShowProductModal(true)}
                                    className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors"
                                >
                                    Add Your First Product
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {products.map((product) => (
                                    <div key={product.id} className="bg-white border border-blue-100/40 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(37,99,235,0.04)] transition-all">
                                        {product.image_urls?.[0] || product.image_url ? (
                                            <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 mb-3">
                                                <img 
                                                    src={product.image_urls?.[0] || product.image_url} 
                                                    alt={product.title} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-32 rounded-xl bg-slate-50/80 border border-dashed border-slate-200 mb-3 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                                No Image
                                            </div>
                                        )}
                                        <h3 className="font-bold text-slate-950 text-sm mb-1">{product.title}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{product.description || 'No description'}</p>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                            <span className="text-sm font-black text-blue-600">₦{Number(product.price).toFixed(2)}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                                    product.in_stock && product.stock_quantity > 0
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {product.in_stock && product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(product);
                                                setProductForm({
                                                    title: product.title,
                                                    description: product.description || '',
                                                    price: product.price.toString(),
                                                    category: product.category || '',
                                                    tags: product.tags ? product.tags.join(', ') : '',
                                                    image_urls: product.image_urls?.length > 0 ? product.image_urls : [product.image_url || ''],
                                                    stock_quantity: product.stock_quantity || 0,
                                                    in_stock: product.in_stock
                                                });
                                                        setShowProductModal(true);
                                                    }}
                                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                                >
                                                    <EditIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product)}
                                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div>
                        <h2 className="text-lg font-black text-slate-950 mb-6">Order Management</h2>

                        {orders.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-blue-100 rounded-2xl bg-slate-50/30">
                                <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-400 mb-2">No orders yet</p>
                                <p className="text-xs text-slate-400">Orders will appear here when customers place them</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(37,99,235,0.04)] transition-all cursor-pointer"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Order #{order.id.slice(0, 8)}</p>
                                                <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColors[order.status] || 'bg-slate-50 text-slate-600'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-700">Total: ₦{Number(order.total).toFixed(2)}</span>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Fulfilled">Fulfilled</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div>
                        <h2 className="text-lg font-black text-slate-950 mb-6">Store Analytics</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Order Status Distribution */}
                            <div className="bg-white border border-blue-100/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                <h3 className="text-sm font-bold text-slate-900 mb-4">Order Status Distribution</h3>
                                <div className="space-y-3">
                                    {Object.entries({
                                        Pending: stats.pendingOrders,
                                        Processing: orders.filter(o => o.status === 'Processing').length,
                                        Fulfilled: orders.filter(o => o.status === 'Fulfilled').length,
                                        Cancelled: orders.filter(o => o.status === 'Cancelled').length
                                    }).map(([status, count]) => (
                                        <div key={status} className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-600">{status}</span>
                                            <span className="text-sm font-black text-slate-950">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white border border-blue-100/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                <h3 className="text-sm font-bold text-slate-900 mb-4">Top Products by Price</h3>
                                <div className="space-y-3">
                                    {products.slice(0, 5).map((product) => (
                                        <div key={product.id} className="flex justify-between items-center">
                                            <span className="text-xs text-slate-600 truncate max-w-[180px]">{product.title}</span>
                                            <span className="text-sm font-black text-blue-600">₦{Number(product.price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {products.length === 0 && (
                                        <p className="text-xs text-slate-400">No products to display</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-[500px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">
                                    {editingProduct ? 'Update product details' : 'Add a new product to your store'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="text-slate-400 hover:text-slate-950 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleProductSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Title</label>
                                <input
                                    type="text"
                                    required
                                    value={productForm.title}
                                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                    placeholder="e.g. Wireless Headphones"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all resize-none"
                                    placeholder="Describe your product..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Price (₦)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                                    <input
                                        type="text"
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                        placeholder="e.g. Electronics"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={productForm.tags}
                                    onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                    placeholder="e.g. wireless, bluetooth, audio"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Add tags to help customers find your product</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Stock Quantity</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={productForm.stock_quantity}
                                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Images</label>
                                <div className="space-y-2">
                                    {productForm.image_urls.map((url, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => {
                                                    const newUrls = [...productForm.image_urls];
                                                    newUrls[idx] = e.target.value;
                                                    setProductForm({ ...productForm, image_urls: newUrls });
                                                }}
                                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                            {productForm.image_urls.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProductForm({ ...productForm, image_urls: productForm.image_urls.filter((_, i) => i !== idx) });
                                                    }}
                                                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setProductForm({ ...productForm, image_urls: [...productForm.image_urls, ''] })}
                                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-xs"
                                        >
                                            + Add Image
                                        </button>
                                        <label className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-xs cursor-pointer">
                                            Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files);
                                                    for (const file of files) {
                                                        try {
                                                            const url = await uploadImage(file, session.user.id);
                                                            setProductForm(prev => ({ ...prev, image_urls: [...prev.image_urls, url] }));
                                                        } catch (err) {
                                                            setToast({ show: true, message: `Upload failed: ${err.message}`, type: 'error' });
                                                        }
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    {imageUploading && (
                                        <p className="text-[10px] text-blue-600">Uploading image...</p>
                                    )}
                                    {productForm.image_urls.filter(url => url).length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {productForm.image_urls.filter(url => url).map((url, idx) => (
                                                <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                                                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="in_stock"
                                    checked={productForm.in_stock}
                                    onChange={(e) => setProductForm({ ...productForm, in_stock: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="in_stock" className="text-xs font-bold text-slate-700">
                                    Product is available for sale
                                </label>
                            </div>

                            {/* Variants Section */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Product Variants
                                </label>
                                <div className="space-y-2">
                                    {variants.length > 0 ? (
                                        variants.map((variant, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                                <span className="text-xs font-bold text-slate-600">{variant.name}:</span>
                                                <span className="text-xs text-slate-500">{variant.options.join(', ')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}
                                                    className="ml-auto text-red-600 hover:text-red-700"
                                                >
                                                    <TrashIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400">No variants added</p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowVariantModal(true)}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        + Add Variant
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProductModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-[420px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">Edit Store Profile</h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">Update your store information</p>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="text-slate-400 hover:text-slate-950 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={saveProfile} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Store Name</label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.store_name}
                                    onChange={(e) => setProfileForm({ ...profileForm, store_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                    placeholder="My Awesome Store"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={profileForm.store_description}
                                    onChange={(e) => setProfileForm({ ...profileForm, store_description: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all resize-none"
                                    placeholder="Tell customers about your store..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={profileForm.store_phone}
                                    onChange={(e) => setProfileForm({ ...profileForm, store_phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                    placeholder="+234 801 234 5678"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                                <input
                                    type="text"
                                    value={profileForm.store_address}
                                    onChange={(e) => setProfileForm({ ...profileForm, store_address: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                    placeholder="Store location or contact address"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {savingProfile ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Methods Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-[500px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-950">Payment Methods</h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-slate-400 hover:text-slate-950 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={savePaymentMethods} className="space-y-6">
                            {/* Bank Transfer Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="bank_enabled"
                                        checked={paymentMethods.bank_transfer.enabled}
                                        onChange={(e) => setPaymentMethods({
                                            ...paymentMethods,
                                            bank_transfer: { ...paymentMethods.bank_transfer, enabled: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="bank_enabled" className="text-sm font-bold text-slate-900">
                                        Enable Bank Transfer
                                    </label>
                                </div>

                                {paymentMethods.bank_transfer.enabled && (
                                    <div className="space-y-3 pl-6 border-l-2 border-blue-100">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bank Name</label>
                                            <input
                                                type="text"
                                                value={paymentMethods.bank_transfer.bank_name}
                                                onChange={(e) => setPaymentMethods({
                                                    ...paymentMethods,
                                                    bank_transfer: { ...paymentMethods.bank_transfer, bank_name: e.target.value }
                                                })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. First Bank"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account Name</label>
                                            <input
                                                type="text"
                                                value={paymentMethods.bank_transfer.account_name}
                                                onChange={(e) => setPaymentMethods({
                                                    ...paymentMethods,
                                                    bank_transfer: { ...paymentMethods.bank_transfer, account_name: e.target.value }
                                                })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Account holder name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account Number</label>
                                            <input
                                                type="text"
                                                value={paymentMethods.bank_transfer.account_number}
                                                onChange={(e) => setPaymentMethods({
                                                    ...paymentMethods,
                                                    bank_transfer: { ...paymentMethods.bank_transfer, account_number: e.target.value }
                                                })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0123456789"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Money Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="mobile_enabled"
                                        checked={paymentMethods.mobile_money.enabled}
                                        onChange={(e) => setPaymentMethods({
                                            ...paymentMethods,
                                            mobile_money: { ...paymentMethods.mobile_money, enabled: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="mobile_enabled" className="text-sm font-bold text-slate-900">
                                        Enable Mobile Money
                                    </label>
                                </div>

                                {paymentMethods.mobile_money.enabled && (
                                    <div className="space-y-3 pl-6 border-l-2 border-blue-100">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Provider</label>
                                            <input
                                                type="text"
                                                value={paymentMethods.mobile_money.provider}
                                                onChange={(e) => setPaymentMethods({
                                                    ...paymentMethods,
                                                    mobile_money: { ...paymentMethods.mobile_money, provider: e.target.value }
                                                })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. M-Pesa, Paystack"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={paymentMethods.mobile_money.phone_number}
                                                onChange={(e) => setPaymentMethods({
                                                    ...paymentMethods,
                                                    mobile_money: { ...paymentMethods.mobile_money, phone_number: e.target.value }
                                                })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="+234 801 234 5678"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cash on Delivery Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="cod_enabled"
                                        checked={paymentMethods.cash_on_delivery.enabled}
                                        onChange={(e) => setPaymentMethods({
                                            ...paymentMethods,
                                            cash_on_delivery: { ...paymentMethods.cash_on_delivery, enabled: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="cod_enabled" className="text-sm font-bold text-slate-900">
                                        Enable Cash on Delivery
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-400 pl-6">Customers pay when they receive their order</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPaymentMethods}
                                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingPaymentMethods ? 'Saving...' : 'Save Payment Methods'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    order={selectedOrder}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.show}
                title="Confirm Action"
                message={confirmModal.message}
                onConfirm={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal({ show: false, message: '', onConfirm: null });
                }}
                onCancel={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
            />

            {/* Variant Modal */}
            {showVariantModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-[420px] rounded-3xl p-6 sm:p-8 border border-blue-50 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">Add Product Variant</h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">Add size, color, or other options</p>
                            </div>
                            <button
                                onClick={() => setShowVariantModal(false)}
                                className="text-slate-400 hover:text-slate-950 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Variant Name</label>
                                <input
                                    type="text"
                                    value={variantForm.name}
                                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all"
                                    placeholder="e.g. Size, Color"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Options (one per line)</label>
                                <textarea
                                    value={variantForm.options.join('\n')}
                                    onChange={(e) => setVariantForm({ ...variantForm, options: e.target.value.split('\n').map(o => o.trim()).filter(o => o) })}
                                    rows="4"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/50 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all resize-none"
                                    placeholder="Small&#10;Medium&#10;Large"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowVariantModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (variantForm.name && variantForm.options.length > 0) {
                                            setVariants(prev => [...prev, { name: variantForm.name, options: variantForm.options }]);
                                            setVariantForm({ name: '', options: [''] });
                                            setShowVariantModal(false);
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
                                >
                                    Add Variant
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
}
