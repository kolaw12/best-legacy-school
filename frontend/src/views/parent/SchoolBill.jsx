import { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, BookOpen, Receipt } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Reveal from '../../components/ui/Reveal';
import useMyChildren from '../../context/useMyChildren';
import API_URL from '../../config/api';

const naira = (v) => `₦${Number(v || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const SchoolBill = () => {
    const { children } = useMyChildren();
    const [selected, setSelected] = useState(null);
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (children.length && !selected) {
            setSelected(children[0]);
        }
    }, [children]);

    useEffect(() => {
        if (!selected) return;
        setLoading(true);
        axios.get(`${API_URL}/api/finance/child/${selected.id}/bill/`)
            .then(r => setBill(r.data))
            .catch(() => setBill(null))
            .finally(() => setLoading(false));
    }, [selected]);

    return (
        <>
            <Reveal>
                <Badge tone="mint" dot>School Bill</Badge>
                <h1 className="mt-3 text-2xl md:text-3xl font-black text-ink">School Fees & Book List</h1>
                <p className="mt-1 text-sm text-gray-500">
                    View the itemized fee breakdown and required books for your child's class.
                </p>
            </Reveal>

            {/* Child selector */}
            {children.length > 1 && (
                <div className="mt-6 flex gap-2 flex-wrap">
                    {children.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelected(c)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                selected?.id === c.id
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {c.full_name}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="mt-8 grid gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : bill ? (
                <div className="mt-8 grid lg:grid-cols-2 gap-6">
                    {/* Bill Items */}
                    <Reveal>
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Receipt className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-bold text-ink">School Bill — {bill.student.class}</h2>
                            </div>
                            <div className="space-y-0">
                                {bill.bill_items.map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between py-2.5 ${i < bill.bill_items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                                            <span className="text-sm text-ink">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-ink tabular-nums">
                                            {item.amount > 0 ? naira(item.amount) : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                                <span className="text-sm font-bold text-ink">Total Bill</span>
                                <span className="text-lg font-black text-primary">{naira(bill.total_bill)}</span>
                            </div>
                            <p className="mt-3 text-xs text-gray-400">
                                Discount: 5% sibling discount on tuition for parents with 2+ children.
                            </p>
                        </div>
                    </Reveal>

                    {/* Book List */}
                    <Reveal delay={0.1}>
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="w-5 h-5 text-secondary" />
                                <h2 className="text-lg font-bold text-ink">Required Books</h2>
                            </div>
                            <div className="space-y-0">
                                {bill.book_items.map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between py-2.5 ${i < bill.book_items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-sm text-ink">{item.name}</span>
                                            {item.note && <span className="text-xs text-gray-400 ml-1">({item.note})</span>}
                                        </div>
                                        <span className="text-sm font-semibold text-ink tabular-nums shrink-0 ml-3">
                                            {item.price > 0 ? naira(item.price) : 'Buy separately'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                                <span className="text-sm font-bold text-ink">Total Books</span>
                                <span className="text-lg font-black text-secondary">{naira(bill.total_books)}</span>
                            </div>
                        </div>
                    </Reveal>

                    {/* Grand Total */}
                    <Reveal delay={0.2} className="lg:col-span-2">
                        <div className="bg-gradient-to-br from-primary-soft via-white to-primary-soft/40 border border-primary/20 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-ink">Grand Total</h3>
                                    <p className="text-sm text-gray-500">School bill + books combined</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-primary">{naira(bill.grand_total)}</div>
                                    <p className="text-xs text-gray-400 mt-1">per term</p>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            ) : selected ? (
                <div className="mt-8 bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
                    No bill data available for this class yet.
                </div>
            ) : null}
        </>
    );
};

export default SchoolBill;
