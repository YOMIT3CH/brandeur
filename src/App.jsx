import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient.js';
import { CartProvider } from './context/CartContext.jsx';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import VendorDashboard from './components/VendorDashboard';
import StoreFront from './components/StoreFront';
import NotFound from './pages/NotFound';
import OrderTracking from './pages/OrderTracking';

export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Initial Fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // 2. Auth Listener with State Lock
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-xs font-black tracking-widest text-slate-400 uppercase">
                Verifying Grid Session...
            </div>
        );
    }

    return (
        <CartProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/store/:slug" element={<StoreFront />} />

                    {/* Redirects to dashboard if already logged in, otherwise renders AuthPage */}
                    <Route
                        path="/login"
                        element={session ? <Navigate to="/dashboard" replace /> : <AuthPage isSignUpFlow={false} />}
                    />
                    <Route
                        path="/signup"
                        element={session ? <Navigate to="/dashboard" replace /> : <AuthPage isSignUpFlow={true} />}
                    />

                    <Route
                        path="/dashboard"
                        element={session ? <VendorDashboard /> : <Navigate to="/login" replace />}
                    />

                    <Route path="/track" element={<OrderTracking />} />

                    {/* 404 Catch-all */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </CartProvider>
    );
}
