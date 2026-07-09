import { useNavigate } from 'react-router-dom';
import { LogoIcon } from '../components/Icons.jsx';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-6">
                <LogoIcon className="w-12 h-12 mx-auto" />
            </div>
            <h1 className="text-6xl font-black text-slate-950 mb-4">404</h1>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Page Not Found</h2>
            <p className="text-sm text-slate-500 max-w-md mb-8">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full text-sm hover:bg-blue-700 transition-all shadow-lg"
            >
                Back to Home
            </button>
        </div>
    );
}