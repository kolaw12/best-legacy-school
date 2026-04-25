import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Reveal from '../../components/ui/Reveal';
import Modal from '../../components/ui/Modal';
import Field, { Input, Select } from '../../components/ui/Field';
import CopyButton from '../../components/ui/CopyButton';
import { payInvoice, isPaystackConfigured } from '../../config/paystack';
import { useToast } from '../../components/ui/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

const naira = (v) => `₦${Number(v || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_TONE = { unpaid: 'warm', partial: 'neutral', paid: 'mint', cancelled: 'neutral' };

const ParentFees = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(null);
    const [success, setSuccess] = useState(null);
    const [paystackBusy, setPaystackBusy] = useState(null);
    const toast = useToast();
    const { profile } = useAuth();
    const paystackOn = isPaystackConfigured();

    const handlePaystack = async (invoice) => {
        setPaystackBusy(invoice.id);
        try {
            const result = await payInvoice({
                invoiceId: invoice.id,
                email: profile?.email || 'parent@example.com',
            });
            if (result.ok) {
                toast.success(`Paid · receipt ${result.receipt_no}`);
                setSuccess({ amount: result.amount, receipt_no: result.receipt_no });
                load();
            } else if (result.reason === 'cancelled') {
                toast.info('Payment cancelled.');
            } else if (result.reason === 'not-configured') {
                toast.info('Online card payment isn\'t live yet — use bank transfer + record-payment for now.');
            } else {
                toast.error(`Payment failed: ${result.detail || result.reason}`);
            }
        } finally {
            setPaystackBusy(null);
        }
    };

    const load = () => {
        setLoading(true);
        axios.get(`${API_URL}/api/finance/invoices/`)
            .then(r => setInvoices(r.data || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const totalDue   = invoices.reduce((acc, i) => acc + Number(i.amount_due || 0), 0);
    const totalPaid  = invoices.reduce((acc, i) => acc + Number(i.amount_paid || 0), 0);
    const outstanding = totalDue - totalPaid;

    return (
        <>
            <Reveal>
                <header className="mb-6">
                    <Badge tone="warm" dot>Fees & payments</Badge>
                    <h1 className="mt-3 text-3xl md:text-4xl font-black text-primary">Your invoices</h1>
                    <p className="mt-1 text-sm text-gray-500">All fees, all children. Self-report a payment after you transfer; the bursary verifies within 24 hours.</p>
                </header>
            </Reveal>

            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                <Tile label="Total billed"  value={naira(totalDue)} />
                <Tile label="Paid"          value={naira(totalPaid)}     tone="bg-mint" accent="text-primary-dark"/>
                <Tile label="Outstanding"   value={naira(outstanding)}   tone="bg-secondary-soft" accent="text-secondary-dark"/>
            </div>

            <AnimatePresence>
                {success && (
                    <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                        className="mb-4 rounded-xl bg-primary-soft border border-primary/30 px-4 py-3 text-sm text-primary-dark"
                    >
                        Payment of <strong>{naira(success.amount)}</strong> recorded · receipt <span className="font-mono">{success.receipt_no}</span>. The bursary will verify shortly.
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse"/>)}</div>
            ) : invoices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No invoices yet.</div>
            ) : (
                <ul className="space-y-3">
                    {invoices.map(i => (
                        <motion.li
                            key={i.id}
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-card p-5"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-gray-400">{i.invoice_no}</span>
                                        <CopyButton value={i.invoice_no} label="invoice number" size="xs" />
                                    </div>
                                    <div className="font-bold text-ink mt-0.5">{i.student_name} · {i.fee_name}</div>
                                    <div className="text-xs text-gray-500">{i.class_name} · {i.term_label} · issued {fmtDate(i.issued_on)}</div>
                                </div>
                                <div className="grid grid-cols-3 md:grid-cols-3 gap-3 text-center text-sm md:text-left">
                                    <div>
                                        <div className="text-xs text-gray-500">Due</div>
                                        <div className="font-bold tabular-nums text-ink">{naira(i.amount_due)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Paid</div>
                                        <div className="font-bold tabular-nums text-primary">{naira(i.amount_paid)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Balance</div>
                                        <div className={`font-black tabular-nums ${Number(i.balance) > 0 ? 'text-secondary' : 'text-primary'}`}>{naira(i.balance)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 justify-end flex-wrap">
                                    <Badge tone={STATUS_TONE[i.status] || 'neutral'}>{i.status}</Badge>
                                    {i.status !== 'paid' && i.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handlePaystack(i)}
                                            disabled={paystackBusy === i.id}
                                            title={paystackOn ? 'Pay online via Paystack (card / transfer / USSD)' : 'Online card payment will be enabled when the school finishes Paystack onboarding.'}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary-dark transition disabled:opacity-60 inline-flex items-center gap-1.5"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
                                            {paystackBusy === i.id
                                                ? 'Opening…'
                                                : <>Pay with card{!paystackOn && <span className="ml-1 text-[9px] uppercase tracking-widest font-bold opacity-70">soon</span>}</>}
                                        </button>
                                    )}
                                    {i.status !== 'paid' && i.status !== 'cancelled' && (
                                        <button
                                            onClick={() => { setPaying(i); setSuccess(null); }}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-ink hover:bg-secondary-dark transition"
                                        >
                                            Record payment
                                        </button>
                                    )}
                                </div>
                            </div>
                            {i.payments?.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-2">Receipts</div>
                                    <ul className="flex flex-wrap gap-2">
                                        {i.payments.map(p => (
                                            <li key={p.id}>
                                                <a
                                                    href={`${API_URL}/api/finance/payments/${p.id}/receipt/`}
                                                    target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                                    <span className="font-mono">{p.receipt_no}</span>
                                                    <span className="opacity-70">· {naira(p.amount)}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.li>
                    ))}
                </ul>
            )}

            <PaymentModal
                invoice={paying}
                onClose={() => setPaying(null)}
                onSaved={(p) => { setPaying(null); setSuccess(p); load(); }}
            />

            <Reveal>
                <div className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-card p-6 md:p-8">
                    <h3 className="font-bold text-ink">Bank details for transfer</h3>
                    <p className="text-sm text-gray-500 mt-1">Use your child's full name as the transfer reference, then click "Record payment" so we can match it quickly.</p>
                    <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                        <BankRow label="Bank"           value="Guaranty Trust Bank" />
                        <BankRow label="Account name"  value="Best Legacy Divine School" />
                        <BankRow label="Account no."    value="0123456789" mono />
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                        Online card payments via Paystack are coming next. For now, transfer + self-report works for every parent.
                    </p>
                </div>
            </Reveal>
        </>
    );
};

const Tile = ({ label, value, tone = 'bg-white border border-gray-100', accent = 'text-ink' }) => (
    <div className={`rounded-2xl p-4 md:p-5 ${tone}`}>
        <div className="text-xs font-semibold text-gray-500">{label}</div>
        <div className={`text-xl md:text-2xl font-black mt-1 tabular-nums ${accent}`}>{value}</div>
    </div>
);

const BankRow = ({ label, value, mono = false }) => (
    <div className="bg-gray-50 rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center justify-between">
            <span>{label}</span>
            {mono && <CopyButton value={value} label={label.toLowerCase()} size="xs" />}
        </div>
        <div className={`mt-1 font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
);

const PaymentModal = ({ invoice, onClose, onSaved }) => {
    const [form, setForm] = useState({ amount: '', method: 'transfer', reference: '', note: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (invoice) {
            setForm({ amount: invoice.balance, method: 'transfer', reference: '', note: '' });
            setError(null);
        }
    }, [invoice]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/api/finance/payments/`, {
                invoice: invoice.id,
                amount: form.amount,
                method: form.method,
                reference: form.reference,
                note: form.note,
            });
            onSaved?.(data);
        } catch (err) {
            const d = err.response?.data;
            setError(d && typeof d === 'object'
                ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
                : err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!invoice) return null;

    return (
        <Modal
            open={!!invoice} onClose={onClose}
            title={`Pay ${invoice.fee_name}`}
            subtitle={`${invoice.student_name} · ${invoice.invoice_no} · Balance ${naira(invoice.balance)}`}
            size="md"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>{saving ? 'Recording…' : 'Record payment'}</Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
            <div className="mb-4 rounded-xl bg-mint p-3 text-xs text-primary-dark">
                <strong>How this works:</strong> transfer the amount via your bank app to the school account on the previous page,
                then fill this form. Your payment shows as "Partial / Paid" immediately and the bursary verifies within 24 hours.
            </div>
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
                <Field label="Amount transferred (₦)" required>
                    <Input type="number" min={1} step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </Field>
                <Field label="Method" required>
                    <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                        <option value="transfer">Bank Transfer</option>
                        <option value="card">Card</option>
                        <option value="pos">POS</option>
                        <option value="cash">Cash (in person)</option>
                    </Select>
                </Field>
                <Field label="Bank transaction reference" className="md:col-span-2">
                    <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g. GTB / 12345678 / 2026-04-24" required />
                </Field>
                <Field label="Note (optional)" className="md:col-span-2">
                    <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Anything we should know" />
                </Field>
            </form>
        </Modal>
    );
};

export default ParentFees;
