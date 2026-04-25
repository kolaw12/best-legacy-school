import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminPageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Field';
import API_URL from '../../config/api';

const ACTION_TONE = { create: 'mint', update: 'neutral', delete: 'warm', login: 'mint', logout: 'neutral' };

const fmt = (iso) => new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const AdminAudit = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        const params = {};
        if (actionFilter) params.action = actionFilter;
        if (typeFilter)   params.object_type = typeFilter;
        setLoading(true);
        axios.get(`${API_URL}/api/auth/audit-log/`, { params })
            .then(r => setRows(r.data || []))
            .finally(() => setLoading(false));
    }, [actionFilter, typeFilter]);

    const filtered = useMemo(() => {
        if (!q) return rows;
        const t = q.toLowerCase();
        return rows.filter(r =>
            (r.username || '').toLowerCase().includes(t) ||
            (r.object_type || '').toLowerCase().includes(t) ||
            (r.object_repr || '').toLowerCase().includes(t),
        );
    }, [q, rows]);

    const types = useMemo(() => Array.from(new Set(rows.map(r => r.object_type).filter(Boolean))).sort(), [rows]);

    return (
        <>
            <AdminPageHeader
                title="Audit Log"
                subtitle="Latest 300 sensitive write events. Useful for tracking who changed what — and when."
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 grid md:grid-cols-3 gap-3">
                <Input placeholder="Search by user, object, or representation…" value={q} onChange={e => setQ(e.target.value)} />
                <Select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                    <option value="">All actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                </Select>
                <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="">All object types</option>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                {loading ? (
                    <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse"/>)}</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-gray-500">No matching events.</div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {filtered.map(e => (
                            <li key={e.id}>
                                <button
                                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-primary-soft/30 transition"
                                >
                                    <div className="text-xs text-gray-400 font-mono w-32 shrink-0">{fmt(e.created_at)}</div>
                                    <Badge tone={ACTION_TONE[e.action] || 'neutral'}>{e.action}</Badge>
                                    <div className="text-xs font-bold text-ink w-32 shrink-0">{e.object_type}#{e.object_id}</div>
                                    <div className="text-sm text-gray-600 flex-1 min-w-0 truncate">{e.object_repr}</div>
                                    <div className="text-xs text-gray-400 hidden md:block">{e.username || <span className="italic">system</span>}</div>
                                </button>
                                {expanded === e.id && Object.keys(e.changes || {}).length > 0 && (
                                    <pre className="px-4 pb-4 text-[11px] text-gray-600 font-mono bg-gray-50 overflow-x-auto">{JSON.stringify(e.changes, null, 2)}</pre>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default AdminAudit;
