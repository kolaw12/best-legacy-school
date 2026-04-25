import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import TeacherForm from '../../components/admin/forms/TeacherForm';
import adminApi from '../../config/adminApi';

const TeachersPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);

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

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                <Input placeholder="Search staff by name, email, or staff ID…" value={q} onChange={e => setQ(e.target.value)} />
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="No teachers on record yet."
                onRowClick={(row) => { setEditing(row); setFormOpen(true); }}
                columns={[
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
                ]}
            />

            <TeacherForm
                open={formOpen}
                initial={editing}
                onClose={() => setFormOpen(false)}
                onSaved={load}
            />
        </>
    );
};

export default TeachersPage;
