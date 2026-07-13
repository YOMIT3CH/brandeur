import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { TagIcon, TrashIcon, PlusIcon, XIcon } from './Icons.jsx';
import Toast from './Toast.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';

export default function DiscountManager({ vendorId }) {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [discountForm, setDiscountForm] = useState({
        code: '',
        type: 'percentage',
        value: '',
        min_order: '',
        expires_at: '',
        max_uses: ''
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

    useEffect(() => {
        async function loadDiscounts() {
            try {
                const { data, error } = await supabase
                    .from('discounts')
                    .select('*')
                    .eq('vendor_id', vendorId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setDiscounts(data || []);
            } catch (err) {
                setToast({ show: true, message: `Error loading discounts: ${err.message}`, type: 'error' });
            } finally {
                setLoading(false);
            }
        }
        loadDiscounts();
    }, [vendorId]);

    const handleSaveDiscount = async (e) => {
        e.preventDefault();
        try {
            const discountData = {
                vendor_id: vendorId,
                code: discountForm.code.toUpperCase(),
                type: discountForm.type,
                value: parseFloat(discountForm.value),
                min_order: discountForm.min_order ? parseFloat(discountForm.min_order) : 0,
                expires_at: discountForm.expires_at || null,
                max_uses: discountForm.max_uses ? parseInt(discountForm.max_uses) : null,
                uses: 0
            };

            if (editingDiscount) {
                const { error } = await supabase
                    .from('discounts')
                    .update(discountData)
                    .eq('id', editingDiscount.id);
                if (error) throw error;
                setToast({ show: true, message: 'Discount updated!', type: 'success' });
            } else {
                const { error } = await supabase
                    .from('discounts')
                    .insert([discountData]);
                if (error) throw error;
                setToast({ show: true, message: 'Discount created!', type: 'success' });
            }

            const { data } = await supabase
                .from('discounts')
                .select('*')
                .eq('vendor_id', vendorId)
                .order('created_at', { ascending: false });
            setDiscounts(data || []);
            setShowModal(false);
            setEditingDiscount(null);
            setDiscountForm({ code: '', type: 'percentage', value: '', min_order: '', expires_at: '', max_uses: '' });
        } catch (err) {
            setToast({ show: true, message: `Error saving discount: ${err.message}`, type: 'error' });
        }
    };

    const handleDeleteDiscount = (discount) => {
        setConfirmModal({
            show: true,
            message: `Delete discount code "${discount.code}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('discounts')
                        .delete()
                        .eq('id', discount.id);
                    if (error) throw error;
                    setDiscounts(prev => prev.filter(d => d.id !== discount.id));
                    setToast({ show: true, message: 'Discount deleted!', type: 'success' });
                } catch (err) {
                    setToast({ show: true, message: `Error deleting discount: ${err.message}`, type: 'error' });
                }
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No expiry';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) return <div className="p-4 text-center">Loading discounts...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900">Discount Codes</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-3 h-3" />
                    Add Discount
                </button>
            </div>

            {discounts.length === 0 ? (
                <p className="text-xs text-slate-400">No discount codes created yet</p>
            ) : (
                <div className="space-y-2">
                    {discounts.map((discount) => (
                        <div key={discount.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                                <span className="text-xs font-bold text-blue-600">{discount.code}</span>
                                <p className="text-[10px] text-slate-500">
                                    {discount.type === 'percentage' ? `${discount.value}% off` : `₦${discount.value} off`}
                                    {discount.min_order > 0 && ` • Min: ₦${discount.min_order}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">Expires: {formatDate(discount.expires_at)}</span>
                                <button
                                    onClick={() => {
                                        setEditingDiscount(discount);
                                        setDiscountForm({
                                            code: discount.code,
                                            type: discount.type,
                                            value: discount.value.toString(),
                                            min_order: discount.min_order?.toString() || '',
                                            expires_at: discount.expires_at?.split('T')[0] || '',
                                            max_uses: discount.max_uses?.toString() || ''
                                        });
                                        setShowModal(true);
                                    }}
                                    className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-100"
                                >
                                    <TagIcon className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => handleDeleteDiscount(discount)}
                                    className="p-1 text-red-600 hover:text-red-700"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Discount Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[400px] rounded-2xl p-6 border border-blue-50 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-black text-slate-950">
                                {editingDiscount ? 'Edit Discount' : 'New Discount'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-950">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDiscount} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Code</label>
                                <input
                                    type="text"
                                    required
                                    value={discountForm.code}
                                    onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    placeholder="SAVE20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                                <select
                                    value={discountForm.type}
                                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Value</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={discountForm.value}
                                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    placeholder={discountForm.type === 'percentage' ? '20' : '500'}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min Order (₦)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={discountForm.min_order}
                                    onChange={(e) => setDiscountForm({ ...discountForm, min_order: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expires At</label>
                                <input
                                    type="date"
                                    value={discountForm.expires_at}
                                    onChange={(e) => setDiscountForm({ ...discountForm, expires_at: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            <ConfirmationModal
                isOpen={confirmModal.show}
                title="Delete Discount"
                message={confirmModal.message}
                onConfirm={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal({ show: false, message: '', onConfirm: null });
                }}
                onCancel={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
            />
        </div>
    );
}