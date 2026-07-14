import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { LogoIcon, ArrowLeftIcon, LogOutIcon } from './Icons.jsx';

export default function AuthPage({ isSignUpFlow = false }) {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(isSignUpFlow);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({ shopName: '', shopDescription: '', email: '', password: '' });
    const [visible, setVisible] = useState(false);
    const [session, setSession] = useState(null);

    useEffect(() => {
        setTimeout(() => setVisible(true), 100);
        
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            if (isSignUp) {
                let generatedSlug = formData.shopName
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-+|-+$/g, '');

                if (!generatedSlug) throw new Error('Shop name must contain valid characters.');

                // Check if slug already exists and make it unique
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('store_slug')
                    .eq('store_slug', generatedSlug)
                    .single();

                if (existingProfile) {
                    // Add a unique suffix (timestamp or random number)
                    const uniqueSuffix = Date.now().toString().slice(-4);
                    generatedSlug = `${generatedSlug}-${uniqueSuffix}`;
                }

                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            store_name: formData.shopName,
                            store_slug: generatedSlug,
                            store_description: formData.shopDescription,
                            email: formData.email,
                        },
                    },
                });

                // Create or update profile with email
                if (!error && data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert([{
                            id: data.user.id,
                            store_name: formData.shopName,
                            store_slug: generatedSlug,
                            store_description: formData.shopDescription,
                            email: formData.email,
                            is_admin: false
                        }], { onConflict: 'id' });
                    
                    if (profileError) console.error('Error creating profile:', profileError);
                }

                if (error) throw error;
                navigate('/dashboard');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });

                if (error) throw error;
                navigate('/dashboard');
            }
        } catch (err) {
            const msg = err?.message || (typeof err === 'string' ? err : 'An error occurred during authentication.');
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased relative overflow-x-hidden">
            {/* Background Lighting Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] right-[-10%] w-[450px] h-[450px] bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-indigo-400/8 blur-[130px] rounded-full pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 px-4 sm:px-6 py-6">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer group">
                        <LogoIcon className="w-6 h-6" />
                        <span className="text-xl font-black tracking-tighter text-blue-950">brandeur</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors px-4 py-2"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back to Home
                        </button>
                        {session && (
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    navigate('/');
                                }}
                                className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors px-4 py-2"
                            >
                                <LogOutIcon className="w-4 h-4" />
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex items-center justify-center px-4 sm:px-6 py-12">
                <div className={`w-full max-w-[420px] transition-all duration-1000 ease-out transform ${
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 text-xs font-extrabold tracking-widest text-blue-700 bg-blue-50 border border-blue-100/60 uppercase rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                            {isSignUp ? 'Start Selling' : 'Welcome Back'}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 mb-2">
                            {isSignUp ? 'Launch your hub' : 'Access your pipeline'}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            {isSignUp
                                ? 'Create your store and start selling in minutes'
                                : 'Sign in to manage your store'
                            }
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-blue-100/40 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.04)] transition-all duration-500">
                        {errorMsg && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 uppercase tracking-wide animate-fadeIn">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isSignUp && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Shop Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={formData.shopName}
                                            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                            placeholder="My Awesome Store"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400">This will be your store's display name</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Store Description
                                        </label>
                                        <textarea
                                            value={formData.shopDescription}
                                            onChange={(e) => setFormData({ ...formData, shopDescription: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                            placeholder="Tell customers what your store is about..."
                                        />
                                        <p className="text-[10px] text-slate-400">Optional: Describe your store</p>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                                {isSignUp && (
                                    <p className="text-[10px] text-slate-400">Must be at least 6 characters</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        PROCESSING...
                                    </span>
                                ) : (
                                    isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="w-full text-center text-slate-500 text-xs font-bold hover:text-blue-600 transition-colors"
                            >
                                {isSignUp ? (
                                    <span>
                                        Already have an account?{' '}
                                        <span className="text-blue-600 underline">Sign In</span>
                                    </span>
                                ) : (
                                    <span>
                                        New vendor?{' '}
                                        <span className="text-blue-600 underline">Create an account</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer Text */}
                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Secured by enterprise-grade encryption
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}