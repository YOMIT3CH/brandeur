import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800'
    };

    const iconColors = {
        success: 'text-emerald-600',
        error: 'text-red-600',
        info: 'text-blue-600',
        warning: 'text-amber-600'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-sm ${bgColors[type]} border rounded-xl p-4 shadow-lg animate-slideInRight`}>
            <div className="flex items-start gap-3">
                <div className={`text-lg ${iconColors[type]}`}>
                    {type === 'success' && '✓'}
                    {type === 'error' && '✕'}
                    {type === 'info' && 'ℹ'}
                    {type === 'warning' && '⚠'}
                </div>
                <p className="text-sm font-medium flex-1">{message}</p>
                <button
                    onClick={onClose}
                    className="text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                    ×
                </button>
            </div>
        </div>
    );
}