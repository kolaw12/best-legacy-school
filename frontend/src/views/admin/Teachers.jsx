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
import TeacherForm from '../../components/admin/forms/TeacherForm';
import useRowSelection from '../../hooks/useRowSelection';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';

const TeachersPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirm, setConfirm] = useState(null); // { rows: [...] } | null
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        adminApi.teachers()
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const filtered = useMemo(() => {
        if (!q) return rows;
        const t = q.toLowerCase();
        return rows.filter(r =>
            r.full_name?.toLowerCase().includes(t) ||
            r.email?.toLowerCase().includes(t) ||
            r.staff_id?.toLowerCase().includes(t),
        );
    }, [q, rows]);

    const selection = useRowSelection(filtered);

    const removeMany = async (toRemove) => {
        setBusy(true);
        const failed = [];
        for (const row of toRemove) {
            try {
                await axios.delete(`${API_URL}/api/academics/teachers/${row.id}/`);
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
                title="Teaching Staff"
                subtitle={`${rows.length} staff members. Class teachers are bound to a class; subject teachers float across.`}
                actions={[
                    <Button key="add" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                        + New Teacher
                    </Button>,
                ]}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
                <Input placeholder="Search staff by name, email, or staff ID…" value={q} onChange={e => setQ(e.target.value)} className="max-w-md" />
                <BulkActionBar
                    count={selection.selectedRows.length}
                    label="Move to trash"
                    onAction={() => setConfirm({ rows: selection.selectedRows })}
                />
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="No teachers on record yet."
                onRowClick={(row) => { setEditing(row); setFormOpen(true); }}
                columns={[
                    selectionColumn(selection),
                    {
                        key: 'teacher', label: 'Staff',
                        render: r => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-secondary-soft text-secondary-dark flex items-center justify-center font-bold text-xs">
                                    {(r.first_name?.[0] || '') + (r.last_name?.[0] || '')}
                                </div>
                                <div>
                                    <div className="font-semibold text-ink">{r.full_name}</div>
                                    <div className="text-xs text-gray-400 font-mono">{r.staff_id}</div>
                                </div>
                            </div>
                        ),
                    },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone', render: r => r.phone || <span className="text-gray-400">—</span> },
                    { key: 'class_teacher_of_name', label: 'Class Teacher Of',
                      render: r => r.class_teacher_of_name ? <Badge tone="mint">{r.class_teacher_of_name}</Badge> : <span className="text-gray-400 text-xs">Subject only</span> },
                    { key: 'qualification', label: 'Qualification', render: r => <span className="text-xs text-gray-600">{r.qualification}</span> },
                    { key: 'is_active', label: 'Status',
                      render: r => r.is_active ? <Badge tone="mint">Active</Badge> : <Badge tone="neutral">Inactive</Badge> },
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

            <TeacherForm
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
                title={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} teachers to the trash?` : `Move ${confirm?.rows[0]?.full_name} to the trash?`}
                body="You can restore them later from Trash."
                confirmLabel={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} to trash` : 'Move to trash'}
                tone="danger"
            />
        </>
    );
};

export default TeachersPage;
