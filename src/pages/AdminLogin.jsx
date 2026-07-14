import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { LogoIcon, MailIcon, LockIcon } from '../components/Icons.jsx';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Sign in with Supabase Auth
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) {
                throw new Error('Invalid email or password');
            }

            // Check if user has admin role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile || !profile.is_admin) {
                // Sign out if not admin
                await supabase.auth.signOut();
                throw new Error('Access denied. Admin privileges required.');
            }

            // Store admin session in sessionStorage with timestamp
            const sessionData = {
                email: data.user.email,
                loggedIn: true,
                loginTime: Date.now()
            };
            sessionStorage.setItem('admin_session', JSON.stringify(sessionData));

            navigate('/admin');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <LogoIcon className="w-8 h-8" />
                        <span className="text-2xl font-black tracking-tighter text-blue-950">brandeur</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-950 mb-2">Admin Login</h1>
                    <p className="text-sm text-slate-500">Access the admin dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                        <div className="relative">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="admin@brandeur.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs font-bold text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}