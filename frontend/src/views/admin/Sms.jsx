import { useEffect, useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';

const SmsPage = () => {
    const [guardians, setGuardians] = useState([]);
    const [selected, setSelected] = useState([]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        adminApi.guardians().then(r => setGuardians(r.data || []));
    }, []);

    const withPhone = guardians.filter(g => g.phone);

    const toggle = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAll = () => setSelected(withPhone.map(g => g.id));
    const clearAll = () => setSelected([]);

    const send = async () => {
        if (!message.trim() || !selected.length) return;
        setSending(true);
        setResult(null);
        try {
            const phones = guardians
                .filter(g => selected.includes(g.id) && g.phone)
                .map(g => g.phone);
            const { data } = await axios.post(`${API_URL}/api/auth/send-sms/`, { phones, message: message.trim() });
            setResult({ ok: true, sent: data.sent, total: data.total });
            setMessage('');
            setSelected([]);
        } catch (e) {
            setResult({ ok: false, error: e.response?.data?.error || e.message });
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="SMS Notifications"
                subtitle="Send SMS messages to parents/guardians. Configure SMS_PROVIDER in your .env to use a live gateway."
            />

            {result && (
                <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {result.ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    {result.ok
                        ? `Sent to ${result.sent} of ${result.total} recipient${result.total !== 1 ? 's' : ''}.`
                        : `Failed: ${result.error}`}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recipient list */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-ink">Recipients ({selected.length}/{withPhone.length})</h3>
                        <div className="flex gap-2">
                            <button onClick={selectAll} className="text-xs text-primary hover:underline">Select all</button>
                            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-1">
                        {withPhone.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">No guardians with phone numbers.</p>}
                        {withPhone.map(g => (
                            <label key={g.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition text-sm ${selected.includes(g.id) ? 'bg-primary-soft' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(g.id)}
                                    onChange={() => toggle(g.id)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-ink truncate">{g.full_name}</div>
                                    <div className="text-xs text-gray-400">{g.phone}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Compose */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="text-sm font-bold text-ink mb-3">Compose Message</h3>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type your SMS message here..."
                        rows={8}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400">{message.length} characters</span>
                        <button
                            onClick={send}
                            disabled={sending || !message.trim() || !selected.length}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            {sending ? 'Sending...' : `Send to ${selected.length || 0}`}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SmsPage;
