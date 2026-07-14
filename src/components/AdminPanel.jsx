import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { 
    ShieldIcon, 
    UsersIcon, 
    BarChartIcon,
    AlertCircleIcon
} from './AdminIcons.jsx';
import { TrashIcon, LogOutIcon, MenuIcon, XIcon, SearchIcon, PackageIcon, ShoppingBagIcon, TrendingUpIcon } from './Icons.jsx';
import Toast from './Toast.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';

// Skeleton Components
const StatCardSkeleton = () => (
    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] animate-shimmer">
        <div className="h-4 bg-slate-200 rounded mb-2 w-24" />
        <div className="h-8 bg-slate-200 rounded mb-1 w-16" />
        <div className="h-3 bg-slate-200 rounded w-20" />
    </div>
);

const TableRowSkeleton = () => (
    <div className="border-b border-blue-50/50 p-4 animate-shimmer">
        <div className="h-4 bg-slate-200 rounded mb-2" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
    </div>
);

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Get session from Supabase Auth
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Check if user has admin role
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                if (!error && profile?.is_admin) {
                    setIsAdmin(true);
                }
            }
        };
        getSession();
    }, []);

    // Platform Stats
    const [stats, setStats] = useState({
        totalVendors: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        activeVendors: 0
    });

    // Vendors Data
    const [vendors, setVendors] = useState([]);
    const [vendorSearch, setVendorSearch] = useState('');
    const [vendorStatusFilter, setVendorStatusFilter] = useState('all');

    // Products Data
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');

    // Orders Data
    const [orders, setOrders] = useState([]);
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');

    // Check if user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                try {
                    // Check if user has admin role
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('is_admin')
                        .eq('id', session.user.id)
                        .single();

                    if (!error && profile?.is_admin) {
                        setIsAdmin(true);
                    }
                } catch (err) {
                    console.error('Error checking admin status:', err);
                }
            }
        };
        checkAdminStatus();
    }, []);

    // Check session expiration
    useEffect(() => {
        const checkSessionExpiration = () => {
            const adminSession = sessionStorage.getItem('admin_session');
            if (adminSession) {
                const parsed = JSON.parse(adminSession);
                const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes
                if (Date.now() - parsed.loginTime > SESSION_DURATION) {
                    sessionStorage.removeItem('admin_session');
                    window.location.href = '/admin-login';
                }
            }
        };
        checkSessionExpiration();
    }, []);

    // Fetch platform data
    useEffect(() => {
        if (!isAdmin) return;

        async function loadAdminData() {
            try {
                setLoading(true);

                // Fetch all vendors (exclude admin users)
                const { data: vendorsData, error: vendorsError } = await supabase
                    .from('profiles')
                    .select('*, products(count), orders(count)')
                    .eq('is_admin', false)
                    .order('created_at', { ascending: false });

                if (vendorsError) throw vendorsError;
                setVendors(vendorsData || []);

                // Fetch all products
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*, profiles!inner(store_name)')
                    .order('created_at', { ascending: false });

                if (productsError) throw productsError;
                setProducts(productsData || []);

                // Fetch all orders
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('*, profiles!inner(store_name)')
                    .order('created_at', { ascending: false });

                if (ordersError) throw ordersError;
                setOrders(ordersData || []);

                // Calculate stats
                const totalVendors = vendorsData?.length || 0;
                const totalProducts = productsData?.length || 0;
                const totalOrders = ordersData?.length || 0;
                const totalRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
                const pendingOrders = ordersData?.filter(o => o.status === 'Pending').length || 0;
                
                setStats({
                    totalVendors,
                    totalProducts,
                    totalOrders,
                    totalRevenue,
                    pendingOrders,
                    activeVendors: totalVendors
                });

            } catch (err) {
                setToast({ show: true, message: `Error loading admin data: ${err.message}`, type: 'error' });
            } finally {
                setLoading(false);
            }
        }

        loadAdminData();
    }, [isAdmin]);

    const handleSignOut = () => {
        sessionStorage.removeItem('admin_session');
        supabase.auth.signOut();
        window.location.href = '/';
    };

    const handleDeleteVendor = async (vendor) => {
        setConfirmModal({
            show: true,
            message: `Are you sure you want to delete vendor "${vendor.store_name}"? This will also delete all their products and orders. This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    // Delete vendor's products first
                    const { error: productsError } = await supabase
                        .from('products')
                        .delete()
                        .eq('vendor_id', vendor.id);

                    if (productsError) throw productsError;

                    // Delete vendor's orders
                    const { error: ordersError } = await supabase
                        .from('orders')
                        .delete()
                        .eq('vendor_id', vendor.id);

                    if (ordersError) throw ordersError;

                    // Delete vendor profile
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .delete()
                        .eq('id', vendor.id);

                    if (profileError) throw profileError;

                    // Delete auth user
                    const { error: authError } = await supabase.auth.admin.deleteUser(vendor.id);
                    if (authError) console.error('Error deleting auth user:', authError);

                    setVendors(prev => prev.filter(v => v.id !== vendor.id));
                    setStats(prev => ({ ...prev, totalVendors: prev.totalVendors - 1 }));
                    setToast({ show: true, message: 'Vendor deleted successfully!', type: 'success' });
                } catch (err) {
                    setToast({ show: true, message: `Error deleting vendor: ${err.message}`, type: 'error' });
                }
            }
        });
    };

    const handleDeleteProduct = async (product) => {
        setConfirmModal({
            show: true,
            message: `Are you sure you want to delete product "${product.title}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter vendors
    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = vendor.store_name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
            vendor.store_description?.toLowerCase().includes(vendorSearch.toLowerCase());
        return matchesSearch;
    });

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
            product.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
            product.profiles?.store_name?.toLowerCase().includes(productSearch.toLowerCase());
        return matchesSearch;
    });

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
            order.profiles?.store_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
            order.customer_email?.toLowerCase().includes(orderSearch.toLowerCase());
        const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold mb-4">
                    <AlertCircleIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-950 mb-2">Access Denied</h2>
                <p className="text-sm text-slate-500 max-w-md mb-6">
                    You do not have permission to access the admin panel. Please contact the platform administrator.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
                <span className="inline-block w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Admin Panel...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-blue-50/60 sticky top-0 z-30 shadow-[0_2px_20px_rgba(37,99,235,0.01)]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShieldIcon className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-black text-slate-950">Admin Panel</h1>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-4">
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

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <UsersIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Vendors</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">{stats.totalVendors}</p>
                    </div>
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <PackageIcon className="w-4 h-4 text-amber-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Products</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">{stats.totalProducts}</p>
                    </div>
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingBagIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Orders</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-white border border-blue-100/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUpIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
                        </div>
                        <p className="text-2xl font-black text-slate-950">₦{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-blue-50 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChartIcon },
                        { id: 'vendors', label: 'Vendors', icon: UsersIcon },
                        { id: 'products', label: 'Products', icon: PackageIcon },
                        { id: 'orders', label: 'Orders', icon: ShoppingBagIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-blue-100'
                            }`}
                        >
                            <tab.icon className="w-4 h-4 inline mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Recent Vendors */}
                            <div className="bg-white border border-blue-100/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                <h2 className="text-lg font-black text-slate-950 mb-4">Recent Vendors</h2>
                                {vendors.slice(0, 5).length === 0 ? (
                                    <p className="text-sm text-slate-400">No vendors yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {vendors.slice(0, 5).map((vendor) => (
                                            <div key={vendor.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{vendor.store_name}</p>
                                                    <p className="text-xs text-slate-500">{vendor.store_description || 'No description'}</p>
                                                </div>
                                                <span className="text-xs text-slate-400">{formatDate(vendor.created_at)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Orders */}
                            <div className="bg-white border border-blue-100/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                <h2 className="text-lg font-black text-slate-950 mb-4">Recent Orders</h2>
                                {orders.slice(0, 5).length === 0 ? (
                                    <p className="text-sm text-slate-400">No orders yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {orders.slice(0, 5).map((order) => (
                                            <div key={order.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">#{order.id.slice(0, 8)}</p>
                                                    <p className="text-xs text-slate-500">{order.profiles?.store_name}</p>
                                                </div>
                                                <span className="text-xs font-bold text-blue-600">₦{Number(order.total).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'vendors' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-slate-950">Vendor Management</h2>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search vendors..."
                                    value={vendorSearch}
                                    onChange={(e) => setVendorSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-white border border-blue-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {filteredVendors.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-blue-100 rounded-2xl bg-slate-50/30">
                                <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-400 mb-2">No vendors found</p>
                                <p className="text-xs text-slate-400">Vendors will appear here when they sign up</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-blue-100/40 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-blue-50">
                                            <tr>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Store Name</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Description</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Created</th>
                                                <th className="text-right p-4 text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredVendors.map((vendor) => (
                                                <tr key={vendor.id} className="border-b border-blue-50/50 hover:bg-slate-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-slate-900">{vendor.store_name}</p>
                                                        <p className="text-xs text-slate-500 font-mono">/store/{vendor.store_slug}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm text-slate-600 max-w-xs truncate">{vendor.store_description || 'No description'}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-xs text-slate-500">{formatDate(vendor.created_at)}</p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteVendor(vendor)}
                                                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'products' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-slate-950">Product Management</h2>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-white border border-blue-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-blue-100 rounded-2xl bg-slate-50/30">
                                <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-400 mb-2">No products found</p>
                                <p className="text-xs text-slate-400">Products will appear here when vendors add them</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-blue-100/40 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-blue-50">
                                            <tr>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Product</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Vendor</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Price</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                                                <th className="text-right p-4 text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.map((product) => (
                                                <tr key={product.id} className="border-b border-blue-50/50 hover:bg-slate-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-slate-900">{product.title}</p>
                                                        <p className="text-xs text-slate-500 max-w-xs truncate">{product.description || 'No description'}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm text-slate-600">{product.profiles?.store_name}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-blue-600">₦{Number(product.price).toFixed(2)}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                                            product.in_stock && product.stock_quantity > 0
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-red-50 text-red-600'
                                                        }`}>
                                                            {product.in_stock && product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteProduct(product)}
                                                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-lg font-black text-slate-950">Order Management</h2>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search orders..."
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-white border border-blue-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
                                    />
                                </div>
                                <select
                                    value={orderStatusFilter}
                                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                                    className="px-3 py-2 bg-white border border-blue-100 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Fulfilled">Fulfilled</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-blue-100 rounded-2xl bg-slate-50/30">
                                <ShoppingBagIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-400 mb-2">No orders found</p>
                                <p className="text-xs text-slate-400">Orders will appear here when customers place them</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-blue-100/40 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-blue-50">
                                            <tr>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Order</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Vendor</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Total</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                                                <th className="text-left p-4 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrders.map((order) => (
                                                <tr key={order.id} className="border-b border-blue-50/50 hover:bg-slate-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-slate-900">#{order.id.slice(0, 8)}</p>
                                                        <p className="text-xs text-slate-500">{order.customer_email || 'No email'}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm text-slate-600">{order.profiles?.store_name}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-blue-600">₦{Number(order.total).toFixed(2)}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Processing">Processing</option>
                                                            <option value="Fulfilled">Fulfilled</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

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