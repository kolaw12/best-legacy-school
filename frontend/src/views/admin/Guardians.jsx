import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import BulkActionBar from '../../components/admin/BulkActionBar';
import { selectionColumn } from '../../components/admin/selectionColumn';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Field';
import GuardianForm from '../../components/admin/forms/GuardianForm';
import useRowSelection from '../../hooks/useRowSelection';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';

const RELATIONSHIP_LABEL = { father: 'Father', mother: 'Mother', guardian: 'Guardian', other: 'Other' };

const GuardiansPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirm, setConfirm] = useState(null); // { rows: [...] } | null
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        adminApi.guardians()
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const filtered = useMemo(() => {
        if (!q) return rows;
        const t = q.toLowerCase();
        return rows.filter(r =>
            r.full_name?.toLowerCase().includes(t) ||
            r.phone?.toLowerCase().includes(t) ||
            r.email?.toLowerCase().includes(t),
        );
    }, [q, rows]);

    const selection = useRowSelection(filtered);

    const removeMany = async (toRemove) => {
        setBusy(true);
        const failed = [];
        for (const row of toRemove) {
            try {
                await axios.delete(`${API_URL}/api/academics/guardians/${row.id}/`);
                setRows(rs => rs.filter(r => r.id !== row.id));
            } catch (e) {
                failed.push(`${row.full_name}: ${e.response?.data?.error || 'failed'}`);
            }
        }
        selection.clear();
        setBusy(false);
        setConfirm(null);
        if (failed.length) alert(`Some records couldn't be moved to the trash:\n\n${failed.join('\n')}`);
    };

    return (
        <>
            <AdminPageHeader
                title="Guardians"
                subtitle={`${rows.length} parent/guardian records. Adding one here also creates their parent-portal login if you give an email.`}
                actions={[
                    <Button key="add" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                        + New Guardian
                    </Button>,
                ]}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
                <Input placeholder="Search by name, phone, or email…" value={q} onChange={e => setQ(e.target.value)} className="max-w-md" />
                <BulkActionBar
                    count={selection.selectedRows.length}
                    label="Move to trash"
                    onAction={() => setConfirm({ rows: selection.selectedRows })}
                />
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="No guardians on record yet."
                onRowClick={(row) => { setEditing(row); setFormOpen(true); }}
                columns={[
                    selectionColumn(selection),
                    {
                        key: 'guardian', label: 'Guardian',
                        render: r => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                    {(r.first_name?.[0] || '') + (r.last_name?.[0] || '')}
                                </div>
                                <div>
                                    <div className="font-semibold text-ink">{r.full_name}</div>
                                    <div className="text-xs text-gray-400">{RELATIONSHIP_LABEL[r.relationship] || r.relationship}</div>
                                </div>
                            </div>
                        ),
                    },
                    { key: 'phone', label: 'Phone' },
                    { key: 'email', label: 'Email', render: r => r.email || <span className="text-gray-400">—</span> },
                    { key: 'children_count', label: 'Children', render: r => <Badge tone={r.children_count ? 'mint' : 'neutral'}>{r.children_count}</Badge> },
                    { key: 'occupation', label: 'Occupation', render: r => r.occupation || <span className="text-gray-400">—</span> },
                    {
                        key: 'actions', label: '',
                        render: r => (
                            <button
                                onClick={(e) => { e.stopPropagation(); setConfirm({ rows: [r] }); }}
                                title="Move to trash"
                                className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                                <Trash2 className="w-4 h-4" strokeWidth={2} />
                            </button>
                        ),
                    },
                ]}
            />

            <GuardianForm
                open={formOpen}
                initial={editing}
                onClose={() => setFormOpen(false)}
                onSaved={load}
            />

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => removeMany(confirm.rows)}
                busy={busy}
                title={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} guardians to the trash?` : `Move ${confirm?.rows[0]?.full_name} to the trash?`}
                body="This does not remove their children's records. You can restore them later from Trash."
                confirmLabel={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} to trash` : 'Move to trash'}
                tone="danger"
            />
        </>
    );
};

export default GuardiansPage;
