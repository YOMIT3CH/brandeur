import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon, BoltIcon, ShieldCheckIcon, GlobeIcon, PackageIcon, SearchIcon } from './Icons.jsx';

export default function LandingPage() {
    const navigate = useNavigate();
    const [visibleSections, setVisibleSections] = useState({ hero: false, stats: false, bento: false, faq: false });
    const [activeFaq, setActiveFaq] = useState(null);

    useEffect(() => {
        // Sequential stagger loading for smooth UX transitions
        setTimeout(() => setVisibleSections(prev => ({ ...prev, hero: true })), 100);
        setTimeout(() => setVisibleSections(prev => ({ ...prev, stats: true })), 300);
        setTimeout(() => setVisibleSections(prev => ({ ...prev, bento: true })), 500);
        setTimeout(() => setVisibleSections(prev => ({ ...prev, faq: true })), 700);
    }, []);

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden">

            {/* Dynamic Pure CSS Keyframe Marquee Block */}
            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

            {/* Focused Background Lighting Orbs */}
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-[35%] right-0 w-[250px] h-[250px] bg-cyan-400/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-[10%] w-[300px] h-[300px] bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Contained Glassmorphism Navigation Layout */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-blue-50/80 px-4 sm:px-6 py-4 transition-all duration-300">
                <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer group">
                        <LogoIcon className="w-6 h-6" />
                        <span className="text-xl font-black tracking-tighter text-blue-950">brandeur</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors px-3 py-2">
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="text-xs sm:text-sm font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm transition-all duration-300"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* 1. Controlled Width Hero Segment */}
            <header className="relative px-4 sm:px-6 py-20 md:py-32 text-center max-w-4xl mx-auto z-10">
                <div className={`transition-all duration-1000 ease-out transform ${visibleSections.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 text-xs font-extrabold tracking-widest text-blue-700 bg-blue-50 border border-blue-100/60 uppercase rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            Vetted E-Commerce Setup
          </span>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-slate-950 leading-[1.08] mb-6">
                STOP PAYING FOR <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
            WEBSITES YOU DON'T NEED.
            </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
                Create your online store in minutes. Add products, manage orders, and get paid - all without any coding or setup fees.
            </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-sm sm:max-w-none mx-auto">
                        <button
                            onClick={() => navigate('/signup')}
                            className="group relative w-full sm:w-auto px-10 py-4.5 bg-blue-600 text-white text-sm sm:text-base font-bold rounded-full tracking-wide shadow-lg shadow-blue-600/20 overflow-hidden transition-all duration-300 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            LAUNCH YOUR SHOP NOW
                        </button>
                        <a href="#features" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors px-6 py-3">
                            Explore capabilities ↓
                        </a>
                    </div>
                </div>
            </header>

            {/* 2. Motion Social Proof (Marquee Stream) */}
            <section className="py-5 border-y border-blue-50 bg-slate-50/50 backdrop-blur-sm overflow-hidden whitespace-nowrap">
                <div className="animate-marquee text-xs sm:text-sm font-extrabold tracking-widest text-blue-900/40 uppercase">
                    <div className="flex gap-16 shrink-0 pr-16">
                        <span>⚡︎ Zero Maintenance Cost</span>
                        <span>⚡︎ Instant Global Checkout</span>
                        <span>⚡︎ Managed SQL Protection</span>
                        <span>⚡︎ 2-Minute Onboarding Setup</span>
                    </div>
                    <div className="flex gap-16 shrink-0 pr-16">
                        <span>⚡︎ Zero Maintenance Cost</span>
                        <span>⚡︎ Instant Global Checkout</span>
                        <span>⚡︎ Managed SQL Protection</span>
                        <span>⚡︎ 2-Minute Onboarding Setup</span>
                    </div>
                </div>
            </section>

            {/* 3. Scaled Responsive Stats Blocks */}
            <section className="py-12 bg-white max-w-5xl mx-auto px-4 sm:px-6">
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 delay-150 transform ${visibleSections.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    {[
                        { metric: "$45M+", label: "Processed Capital" },
                        { metric: "12.4k+", label: "Active Vendors" },
                        { metric: "0.02s", label: "Query Execution" },
                        { metric: "99.99%", label: "Platform Uptime" }
                    ].map((stat, i) => (
                        <div key={i} className="text-center md:text-left md:border-l border-blue-50 md:pl-6 first:border-0 first:pl-0">
                            <div className="text-2xl sm:text-4xl font-black text-blue-600 tracking-tight mb-0.5">{stat.metric}</div>
                            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Modular Bento-Grid Feature Core */}
            <section id="features" className="py-20 px-4 sm:px-6 bg-slate-50/50 border-y border-blue-50">
                <div className={`max-w-5xl mx-auto transition-all duration-1000 delay-300 transform ${visibleSections.bento ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="max-w-xl mx-auto text-center mb-16">
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 mb-3">Everything You Need to Sell Online</h2>
                        <p className="text-sm sm:text-base text-slate-500 font-medium">Simple tools to run your store without any technical skills.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Bento Block 1 */}
                        <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-blue-100/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.05)] hover:border-blue-500/30 transition-all duration-500 flex flex-col transform hover:-translate-y-1">
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl mb-6 group-hover:bg-blue-600 group-hover:text-white text-blue-600 transition-colors duration-300">
                                <BoltIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-950 mb-2">Quick Store Setup</h3>
                            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                                Create your store in minutes. Add products and start selling right away.
                            </p>
                        </div>

                        {/* Bento Block 2 */}
                        <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-blue-100/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.05)] hover:border-blue-500/30 transition-all duration-500 flex flex-col transform hover:-translate-y-1">
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl mb-6 group-hover:bg-blue-600 group-hover:text-white text-blue-600 transition-colors duration-300">
                                <ShieldCheckIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-950 mb-2">Easy Ordering</h3>
                            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                                Customers can buy from your store in just two clicks. No account needed.
                            </p>
                        </div>

                        {/* Bento Block 3 */}
                        <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-blue-100/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.05)] hover:border-blue-500/30 transition-all duration-500 flex flex-col transform hover:-translate-y-1">
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl mb-6 group-hover:bg-blue-600 group-hover:text-white text-blue-600 transition-colors duration-300">
                                <GlobeIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-950 mb-2">Get Paid Easily</h3>
                            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                                Connect your bank account and receive payments directly. Simple and secure.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Clean Interactive FAQ Accordion Block */}
            <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
                <div className={`transition-all duration-1000 delay-400 transform ${visibleSections.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center text-slate-950 mb-10">Frequently Asked Questions</h2>

                    <div className="space-y-3">
                        {[
                            { q: "Is there a monthly fee?", a: "No hidden fees. You only pay a small percentage when you make a sale." },
                            { q: "Can I use my own domain name?", a: "Yes! You can connect your own domain to your store from your dashboard." },
                            { q: "How many products can I add?", a: "You can add as many products as you want. There are no limits." }
                        ].map((faq, idx) => (
                            <div key={idx} className="border border-blue-50 bg-white rounded-xl overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full text-left px-5 py-4 font-bold text-sm sm:text-base text-slate-950 flex justify-between items-center bg-white hover:bg-blue-50/20 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`text-blue-600 font-mono transform transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`}>↓</span>
                                </button>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === idx ? 'max-h-40 border-t border-blue-50/50' : 'max-h-0'}`}>
                                    <p className="p-5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed bg-slate-50/30">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Dynamic Conversion CTA Section */}
            <section className="px-4 sm:px-6 pb-20">
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 sm:p-14 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent)]" />
                    <div className="relative z-10 max-w-xl mx-auto">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">Ready to maximize operations?</h2>
                        <p className="text-xs sm:text-sm text-blue-100 mb-8 font-medium">Deploy your customized standalone hub framework globally under minutes.</p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-700 text-sm font-extrabold rounded-full shadow-lg hover:bg-blue-50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
                        >
                            Start Selling Instantly
                        </button>
                    </div>
                </div>
            </section>

            {/* Order Tracking Section */}
            <section className="px-4 sm:px-6 py-12 bg-slate-50/50 border-y border-blue-50">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 text-xs font-extrabold tracking-widest text-blue-700 bg-blue-50 border border-blue-100/60 uppercase rounded-full shadow-sm">
                        <PackageIcon className="w-4 h-4" />
                        Order Tracking
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mb-3">Track Your Orders</h2>
                    <p className="text-sm text-slate-500 font-medium mb-6">
                        Already placed an order? Check the status of your purchase by entering your email or order ID.
                    </p>
                    <a
                        href="/track"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        <SearchIcon className="w-4 h-4" />
                        Track My Order
                    </a>
                </div>
            </section>

            {/* Contained Footer Area */}
            <footer className="bg-white border-t border-blue-50 py-10 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2.5 group">
                        <LogoIcon />
                        <span className="text-lg font-black tracking-tighter text-blue-950">brandeur</span>
                    </div>
                    <div className="flex gap-6 text-xs font-bold text-slate-400">
                       
                        <a href="/terms" className="hover:text-blue-600 transition-colors">Terms</a>
                        <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</a>
                    </div>
                </div>
            </footer>

        </div>
    );
}