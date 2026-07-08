import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Trash2, RotateCcw } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Select } from '../../components/ui/Field';
import API_URL from '../../config/api';

const TYPE_LABEL = { student: 'Student', guardian: 'Guardian', teacher: 'Teacher', class: 'Class', subject: 'Subject', admission: 'Admission', grade: 'Grade', assessment: 'Assessment', fee_schedule: 'Fee schedule', invoice: 'Invoice', payment: 'Payment' };
const TYPE_TONE = { student: 'mint', guardian: 'warm', teacher: 'warm', class: 'ink', subject: 'neutral', admission: 'white', grade: 'mint', assessment: 'warm', fee_schedule: 'neutral', invoice: 'ink', payment: 'mint' };

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

const TrashPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [selected, setSelected] = useState(() => new Set());
    const [confirm, setConfirm] = useState(null); // { rows: [...], bulk: bool } | null
    const [purging, setPurging] = useState(false);

    const load = () => {
        setLoading(true);
        axios.get(`${API_URL}/api/trash/`)
            .then(r => setRows(r.data || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const filtered = useMemo(() => {
        if (!typeFilter) return rows;
        return rows.filter(r => r.type === typeFilter);
    }, [rows, typeFilter]);

    const rowKey = (r) => `${r.type}-${r.id}`;

    const restore = async (row) => {
        setBusyId(rowKey(row));
        try {
            await axios.post(`${API_URL}${row.restore_url}`);
            setRows(rs => rs.filter(r => rowKey(r) !== rowKey(row)));
        } catch (e) {
            alert(e.response?.data?.error || e.response?.data?.detail || 'Could not restore.');
        } finally {
            setBusyId(null);
        }
    };

    const toggleSelected = (row) => {
        setSelected(s => {
            const next = new Set(s);
            const key = rowKey(row);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const allSelected = filtered.length > 0 && filtered.every(r => selected.has(rowKey(r)));
    const toggleSelectAll = () => {
        setSelected(allSelected ? new Set() : new Set(filtered.map(rowKey)));
    };

    const runPurge = async (rowsToPurge) => {
        setPurging(true);
        const failed = [];
        for (const row of rowsToPurge) {
            try {
                await axios.post(`${API_URL}${row.purge_url}`);
                setRows(rs => rs.filter(r => rowKey(r) !== rowKey(row)));
                setSelected(s => { const next = new Set(s); next.delete(rowKey(row)); return next; });
            } catch (e) {
                failed.push(`${row.label}: ${e.response?.data?.error || 'failed'}`);
            }
        }
        setPurging(false);
        setConfirm(null);
        if (failed.length) alert(`Some records couldn't be permanently deleted:\n\n${failed.join('\n')}`);
    };

    const selectedRows = useMemo(() => filtered.filter(r => selected.has(rowKey(r))), [filtered, selected]);

    return (
        <>
            <AdminPageHeader
                title="Trash"
                subtitle="Deleted students, teachers, subjects, and admissions land here first. Restore them, or delete permanently — nothing else in the app removes a record outright."
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
                <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="max-w-xs">
                    <option value="">All types ({rows.length})</option>
                    {Object.entries(TYPE_LABEL).map(([key, label]) => (
                        <option key={key} value={key}>{label}s ({rows.filter(r => r.type === key).length})</option>
                    ))}
                </Select>

                {selectedRows.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{selectedRows.length} selected</span>
                        <button
                            onClick={() => setConfirm({ rows: selectedRows, bulk: true })}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                        >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> Delete permanently ({selectedRows.length})
                        </button>
                    </div>
                )}
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="Trash is empty."
                emptyIcon={<Trash2 className="w-6 h-6" strokeWidth={1.75} />}
                columns={[
                    {
                        key: 'select',
                        label: (
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
                            />
                        ),
                        render: r => (
                            <input
                                type="checkbox"
                                checked={selected.has(rowKey(r))}
                                onChange={() => toggleSelected(r)}
                                onClick={e => e.stopPropagation()}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
                            />
                        ),
                    },
                    { key: 'type', label: 'Type', render: r => <Badge tone={TYPE_TONE[r.type] || 'neutral'}>{TYPE_LABEL[r.type] || r.type}</Badge> },
                    {
                        key: 'label', label: 'Record',
                        render: r => (
                            <div>
                                <div className="font-semibold text-ink">{r.label}</div>
                                <div className="text-xs text-gray-400">{r.detail}</div>
                            </div>
                        ),
                    },
                    { key: 'deleted_at', label: 'Deleted', render: r => fmtDate(r.deleted_at) },
                    {
                        key: 'actions', label: '',
                        render: r => (
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={busyId === rowKey(r)}
                                    onClick={() => restore(r)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition disabled:opacity-50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} /> Restore
                                </button>
                                <button
                                    disabled={busyId === rowKey(r)}
                                    onClick={() => setConfirm({ rows: [r], bulk: false })}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-600 transition disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> Delete permanently
                                </button>
                            </div>
                        ),
                    },
                ]}
            />

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => runPurge(confirm.rows)}
                busy={purging}
                title={confirm?.bulk ? `Permanently delete ${confirm.rows.length} records?` : `Permanently delete "${confirm?.rows[0]?.label}"?`}
                body="This cannot be undone — there is no trash after this."
                confirmLabel={confirm?.bulk ? `Delete ${confirm.rows.length} permanently` : 'Delete permanently'}
            />
        </>
    );
};

export default TrashPage;
