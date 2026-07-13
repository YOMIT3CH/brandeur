import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [vendorId, setVendorId] = useState(() => {
        const saved = localStorage.getItem('cart_vendor');
        return saved || null;
    });
    const [wishlistItems, setWishlistItems] = useState(() => {
        const saved = localStorage.getItem('wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        if (vendorId) {
            localStorage.setItem('cart_vendor', vendorId);
        } else {
            localStorage.removeItem('cart_vendor');
        }
    }, [vendorId]);

    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToCart = (product) => {
        // Clear cart if adding from a different vendor
        if (vendorId && vendorId !== product.vendor_id) {
            if (!confirm('Your cart contains items from another store. Clear cart and add this item?')) {
                return false;
            }
            setCartItems([]);
            setVendorId(product.vendor_id);
        } else if (!vendorId) {
            setVendorId(product.vendor_id);
        }

        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_quantity || 999) }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        return true;
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
        if (cartItems.length === 1) {
            setVendorId(null);
        }
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prev =>
            prev.map(item =>
                item.id === productId
                    ? { ...item, quantity: Math.min(quantity, item.stock_quantity || 999) }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setVendorId(null);
    };

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Wishlist functions
    const addToWishlist = (product) => {
        setWishlistItems(prev => {
            if (prev.find(item => item.id === product.id)) {
                return prev; // Already in wishlist
            }
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId) => {
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.id === productId);
    };

    const wishlistCount = wishlistItems.length;

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            vendorId,
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            wishlistCount
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}