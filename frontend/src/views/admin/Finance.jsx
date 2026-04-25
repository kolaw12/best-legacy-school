import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import KpiCard from '../../components/admin/KpiCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Field, { Input, Select } from '../../components/ui/Field';
import CopyButton from '../../components/ui/CopyButton';
import API_URL from '../../config/api';

const naira = (v) => `₦${Number(v || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const STATUS_TONE = { unpaid: 'warm', partial: 'neutral', paid: 'mint', cancelled: 'neutral' };

const AdminFinance = () => {
    const [tab, setTab] = useState('invoices');
    const [summary, setSummary] = useState(null);
    const [fees, setFees] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentFor, setPaymentFor] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API_URL}/api/finance/summary/`),
            axios.get(`${API_URL}/api/finance/fees/`),
            axios.get(`${API_URL}/api/finance/invoices/`, { params: statusFilter ? { status: statusFilter } : {} }),
        ]).then(([s, f, i]) => {
            setSummary(s.data);
            setFees(f.data || []);
            setInvoices(i.data || []);
        }).finally(() => setLoading(false));
    }, [statusFilter]);

    useEffect(load, [load]);

    const generate = async (feeId) => {
        try {
            const { data } = await axios.post(`${API_URL}/api/finance/fees/${feeId}/generate-invoices/`);
            alert(`${data.invoices_created} new invoice(s) created for ${data.class_level}.`);
            load();
        } catch (e) {
            alert(`Failed: ${e.response?.data?.detail || e.message}`);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Finance"
                subtitle="Set termly fees, generate invoices, and record payments. All amounts are in Naira (₦)."
            />

            {/* Summary row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard tone="primary" label="Total Invoiced" value={loading ? '—' : naira(summary?.totals.due)} hint="this session" icon={<span>₦</span>} />
                <KpiCard tone="sage"    label="Collected"      value={loading ? '—' : naira(summary?.totals.paid)} hint={summary?.totals.paid > 0 ? 'kudos' : 'nothing recorded yet'} icon={<span>✓</span>} />
                <KpiCard tone="warm"    label="Outstanding"    value={loading ? '—' : naira(summary?.totals.outstanding)} hint={`${summary?.invoices?.unpaid || 0} unpaid invoices`} icon={<span>!</span>} />
                <KpiCard tone="ink"     label="Invoices"       value={loading ? '—' : summary?.invoices?.total || 0} hint="all statuses" icon={<span>#</span>} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-100 mb-6">
                {[
                    { id: 'invoices', label: 'Invoices' },
                    { id: 'fees', label: 'Fee Schedules' },
                    { id: 'payments', label: 'Recent Payments' },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                            tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-ink'
                        }`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'invoices' && (
                <>
                    <div className="mb-4 flex justify-end">
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-48">
                            <option value="">All statuses</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                        </Select>
                    </div>
                    <DataTable
                        loading={loading}
                        rows={invoices}
                        empty="No invoices yet. Generate them from a fee schedule."
                        columns={[
                            { key: 'invoice_no', label: 'Invoice #', render: r => (
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="font-mono text-xs">{r.invoice_no}</span>
                                    <CopyButton value={r.invoice_no} label="invoice number" size="xs" />
                                </span>
                            ) },
                            { key: 'student_name', label: 'Pupil', render: r => (
                                <div>
                                    <div className="font-semibold text-ink">{r.student_name}</div>
                                    <div className="text-xs text-gray-400 font-mono">{r.admission_no}</div>
                                </div>
                            )},
                            { key: 'class_name', label: 'Class', render: r => <Badge tone="mint">{r.class_name}</Badge> },
                            { key: 'fee_name', label: 'Fee' },
                            { key: 'amount_due', label: 'Due', className: 'text-right tabular-nums', render: r => naira(r.amount_due) },
                            { key: 'amount_paid', label: 'Paid', className: 'text-right tabular-nums', render: r => naira(r.amount_paid) },
                            { key: 'balance', label: 'Balance', className: 'text-right tabular-nums font-semibold', render: r => naira(r.balance) },
                            { key: 'status', label: 'Status', render: r => <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge> },
                            {
                                key: 'action', label: '',
                                render: r => (r.status === 'paid' || r.status === 'cancelled')
                                    ? <span className="text-xs text-gray-400">—</span>
                                    : <button onClick={() => setPaymentFor(r)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary-dark">Record payment</button>,
                            },
                        ]}
                    />
                </>
            )}

            {tab === 'fees' && (
                <DataTable
                    loading={loading}
                    rows={fees}
                    empty="No fee schedules. Run `python manage.py seed_fees` or add in Django admin."
                    columns={[
                        { key: 'class_name', label: 'Class', render: r => <Badge tone={r.section === 'nursery' ? 'warm' : 'mint'}>{r.class_name}</Badge> },
                        { key: 'name', label: 'Fee name' },
                        { key: 'term_label', label: 'Term' },
                        { key: 'amount', label: 'Amount', className: 'text-right tabular-nums', render: r => naira(r.amount) },
                        { key: 'invoice_count', label: 'Invoices', className: 'text-center' },
                        {
                            key: 'action', label: '',
                            render: r => <button onClick={() => generate(r.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-ink hover:bg-secondary-dark">Generate invoices</button>,
                        },
                    ]}
                />
            )}

            {tab === 'payments' && (
                <DataTable
                    loading={loading}
                    rows={summary?.recent_payments || []}
                    empty="No payments recorded yet."
                    columns={[
                        { key: 'receipt_no', label: 'Receipt #', render: r => (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="font-mono text-xs">{r.receipt_no}</span>
                                <CopyButton value={r.receipt_no} label="receipt number" size="xs" />
                            </span>
                        ) },
                        { key: 'invoice_no', label: 'Invoice', render: r => <span className="font-mono text-xs">{r.invoice_no}</span> },
                        { key: 'student_name', label: 'Pupil' },
                        { key: 'amount', label: 'Amount', className: 'text-right tabular-nums', render: r => naira(r.amount) },
                        { key: 'method', label: 'Method', render: r => <Badge tone="neutral">{r.method}</Badge> },
                        { key: 'received_on', label: 'Received' },
                        { key: 'actions', label: '', render: r => (
                            <a href={`${API_URL}/api/finance/payments/${r.id}/receipt/`} target="_blank" rel="noreferrer"
                               className="text-xs font-semibold text-primary hover:underline">Receipt PDF →</a>
                        ) },
                    ]}
                />
            )}

            <PaymentModal
                invoice={paymentFor}
                onClose={() => setPaymentFor(null)}
                onSaved={() => { setPaymentFor(null); load(); }}
            />
        </>
    );
};

const PaymentModal = ({ invoice, onClose, onSaved }) => {
    const [form, setForm] = useState({ amount: '', method: 'transfer', reference: '', received_by: '', note: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (invoice) {
            setForm({ amount: invoice.balance, method: 'transfer', reference: '', received_by: '', note: '' });
            setError(null);
        }
    }, [invoice]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/api/finance/payments/`, {
                invoice: invoice.id,
                amount: form.amount,
                method: form.method,
                reference: form.reference,
                received_by: form.received_by,
                note: form.note,
            });
            onSaved?.();
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
            title={`Record payment for ${invoice.student_name}`}
            subtitle={`Invoice ${invoice.invoice_no} · Balance ${naira(invoice.balance)}`}
            size="md"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
                <Field label="Amount (₦)" required>
                    <Input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </Field>
                <Field label="Method" required>
                    <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                        <option value="transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="pos">POS</option>
                        <option value="cheque">Cheque</option>
                    </Select>
                </Field>
                <Field label="Reference" className="md:col-span-2">
                    <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Transaction ID / bank ref" />
                </Field>
                <Field label="Received by" className="md:col-span-2">
                    <Input value={form.received_by} onChange={e => setForm(f => ({ ...f, received_by: e.target.value }))} placeholder="Cashier name" />
                </Field>
                <Field label="Note" className="md:col-span-2">
                    <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </Field>
            </form>
        </Modal>
    );
};

export default AdminFinance;
