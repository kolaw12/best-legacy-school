import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Megaphone, Pin } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import BulkActionBar from '../../components/admin/BulkActionBar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Field, { Input, Select, Textarea } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastProvider';
import useRowSelection from '../../hooks/useRowSelection';
import API_URL from '../../config/api';

const fmt = (iso) => iso ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const AUDIENCE_TONE = {
    all:      { tone: 'mint',    label: 'Everyone' },
    parents:  { tone: 'warm',    label: 'Parents' },
    teachers: { tone: 'neutral', label: 'Teachers' },
    admins:   { tone: 'ink',     label: 'Admins' },
};

const buildWaLink = (item) =>
    `https://wa.me/?text=${encodeURIComponent(`${item.title}\n\n${item.body}\n\n— Best Legacy Divine School`)}`;

const AdminAnnouncements = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [composeOpen, setComposeOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirm, setConfirm] = useState(null); // { items: [...] } | null
    const [busy, setBusy] = useState(false);
    const toast = useToast();

    const load = useCallback(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/auth/announcements/`)
            .then(r => setItems(Array.isArray(r.data) ? r.data : r.data.results || []))
            .catch(() => toast.error('Could not load announcements.'))
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(load, [load]);

    const togglePinned = async (item) => {
        try {
            const { data } = await axios.patch(`${API_URL}/api/auth/announcements/${item.id}/`, { pinned: !item.pinned });
            setItems(prev => prev.map(x => x.id === item.id ? data : x));
            toast.success(data.pinned ? 'Pinned to top' : 'Unpinned');
        } catch {
            toast.error('Could not update.');
        }
    };

    const selection = useRowSelection(items);

    const removeMany = async (toRemove) => {
        setBusy(true);
        const failed = [];
        for (const item of toRemove) {
            try {
                await axios.delete(`${API_URL}/api/auth/announcements/${item.id}/`);
                setItems(prev => prev.filter(x => x.id !== item.id));
            } catch {
                failed.push(item.title);
            }
        }
        selection.clear();
        setBusy(false);
        setConfirm(null);
        if (failed.length) toast.error(`Couldn't delete: ${failed.join(', ')}`);
        else toast.success(toRemove.length > 1 ? 'Announcements removed.' : 'Announcement removed.');
    };

    return (
        <>
            <AdminPageHeader
                title="Announcements"
                subtitle="Broadcast to parents, teachers or everyone. Pinned items show first; expired items hide automatically."
                actions={[
                    <BulkActionBar
                        key="bulk"
                        count={selection.selectedRows.length}
                        label="Delete"
                        onAction={() => setConfirm({ items: selection.selectedRows })}
                    />,
                    <Button key="new" size="sm" onClick={() => { setEditing(null); setComposeOpen(true); }}>
                        + New announcement
                    </Button>,
                ]}
            />

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    icon={<Megaphone className="w-6 h-6" strokeWidth={1.75} />}
                    title="No announcements yet"
                    body="Send the first one — a welcome note, a closure date, a reminder. Parents see them in the bell icon, top right."
                    action={<Button size="sm" onClick={() => setComposeOpen(true)}>Compose the first one</Button>}
                />
            ) : (
                <ul className="space-y-3">
                    {items.map(item => {
                        const tone = AUDIENCE_TONE[item.audience] || AUDIENCE_TONE.all;
                        return (
                            <motion.li
                                key={item.id}
                                whileHover={{ y: -2 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                                className={`bg-white rounded-2xl border p-5 shadow-card ${item.pinned ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-100'}`}
                            >
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={selection.isSelected(item)}
                                            onChange={() => selection.toggle(item)}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                {item.pinned && <Badge tone="mint"><Pin className="w-3 h-3" strokeWidth={2.5} /> Pinned</Badge>}
                                                <Badge tone={tone.tone}>{tone.label}</Badge>
                                                <span className="text-xs text-gray-400">posted {fmt(item.created_at)}{item.created_by_name && ` by ${item.created_by_name}`}</span>
                                                {item.expires_at && <span className="text-xs text-secondary-dark">expires {fmt(item.expires_at)}</span>}
                                            </div>
                                            <h3 className="font-bold text-ink">{item.title}</h3>
                                            <p className="mt-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                                    <a
                                        href={buildWaLink(item)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1ebe5b] transition shadow-sm"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.05 4.91A9.82 9.82 0 0012.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.93 9.93 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.21 8.21 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.4c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.25-8.25 8.25z"/></svg>
                                        Forward to WhatsApp
                                    </a>
                                    <button
                                        onClick={() => togglePinned(item)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition"
                                    >
                                        {item.pinned ? 'Unpin' : 'Pin to top'}
                                    </button>
                                    <button
                                        onClick={() => { setEditing(item); setComposeOpen(true); }}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setConfirm({ items: [item] })}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-600 transition ml-auto"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.li>
                        );
                    })}
                </ul>
            )}

            <ComposeModal
                open={composeOpen}
                initial={editing}
                onClose={() => setComposeOpen(false)}
                onSaved={(saved) => {
                    setComposeOpen(false);
                    setItems(prev => {
                        const without = prev.filter(x => x.id !== saved.id);
                        return [saved, ...without];
                    });
                    toast.success(editing ? 'Announcement updated.' : 'Announcement published.');
                }}
            />

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => removeMany(confirm.items)}
                busy={busy}
                title={confirm?.items.length > 1 ? `Delete ${confirm.items.length} announcements?` : `Delete "${confirm?.items[0]?.title}"?`}
                body="This cannot be undone."
                confirmLabel={confirm?.items.length > 1 ? `Delete ${confirm.items.length}` : 'Delete'}
                tone="danger"
            />
        </>
    );
};

const EMPTY = {
    title: '', body: '', audience: 'all', pinned: false,
    starts_at: '', expires_at: '',
};

const ComposeModal = ({ open, onClose, onSaved, initial }) => {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const toast = useToast();

    useEffect(() => {
        if (!open) return;
        if (initial) {
            setForm({
                title: initial.title || '',
                body: initial.body || '',
                audience: initial.audience || 'all',
                pinned: !!initial.pinned,
                starts_at: initial.starts_at ? initial.starts_at.slice(0, 16) : '',
                expires_at: initial.expires_at ? initial.expires_at.slice(0, 16) : '',
            });
        } else {
            setForm(EMPTY);
        }
        setError(null);
    }, [open, initial]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = {
                title: form.title,
                body: form.body,
                audience: form.audience,
                pinned: form.pinned,
                starts_at: form.starts_at || null,
                expires_at: form.expires_at || null,
            };
            const url = `${API_URL}/api/auth/announcements/${initial ? initial.id + '/' : ''}`;
            const method = initial ? 'patch' : 'post';
            const { data } = await axios[method](url, payload);
            onSaved(data);
        } catch (err) {
            const d = err.response?.data;
            const msg = d && typeof d === 'object'
                ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
                : err.message;
            setError(msg);
            toast.error('Could not save — see details.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={initial ? 'Edit announcement' : 'Compose announcement'}
            subtitle="Parents and teachers see this in the bell icon, top-right of their portals."
            size="md"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>{saving ? 'Saving…' : (initial ? 'Save changes' : 'Publish')}</Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}

            <form onSubmit={submit} className="space-y-4">
                <Field label="Title" required>
                    <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. School closed Monday for holiday" required />
                </Field>
                <Field label="Body" required>
                    <Textarea rows={4} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Two sentences max — the bell preview is short. Use the WhatsApp forward for richer detail." required />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Audience" required>
                        <Select value={form.audience} onChange={e => set('audience', e.target.value)}>
                            <option value="all">Everyone (signed-in)</option>
                            <option value="parents">Parents only</option>
                            <option value="teachers">Teachers only</option>
                            <option value="admins">Admins only</option>
                        </Select>
                    </Field>
                    <Field label="Pin to top">
                        <label className="flex items-center gap-2 mt-2 text-sm text-ink">
                            <input
                                type="checkbox"
                                checked={form.pinned}
                                onChange={e => set('pinned', e.target.checked)}
                                className="w-4 h-4 accent-primary"
                            />
                            Show this above all others
                        </label>
                    </Field>
                    <Field label="Show from (optional)" hint="Leave blank to publish immediately">
                        <Input type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} />
                    </Field>
                    <Field label="Expires at (optional)" hint="Auto-hides after this time">
                        <Input type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
                    </Field>
                </div>
            </form>
        </Modal>
    );
};

export default AdminAnnouncements;
