import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import BulkActionBar from '../../components/admin/BulkActionBar';
import { selectionColumn } from '../../components/admin/selectionColumn';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/Field';
import StudentForm from '../../components/admin/forms/StudentForm';
import useRowSelection from '../../hooks/useRowSelection';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';
import { CLASS_LEVELS } from '../../config/school';

const statusTone = { active: 'mint', graduated: 'neutral', withdrawn: 'warm', suspended: 'warm' };

const StudentsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [classFilter, setClassFilter] = useState(searchParams.get('class') || '');
    const [sectionFilter, setSectionFilter] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirm, setConfirm] = useState(null); // { rows: [...] } | null
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (classFilter) next.set('class', classFilter); else next.delete('class');
        setSearchParams(next, { replace: true });
    }, [classFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const load = useCallback(() => {
        setLoading(true);
        const params = {};
        if (classFilter) params.class_level = classFilter;
        if (sectionFilter) params.section = sectionFilter;
        adminApi.students(params)
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    }, [classFilter, sectionFilter]);

    useEffect(load, [load]);

    const filtered = useMemo(() => {
        if (!q) return rows;
        const t = q.toLowerCase();
        return rows.filter(r =>
            r.full_name?.toLowerCase().includes(t) ||
            r.admission_no?.toLowerCase().includes(t) ||
            r.guardian_name?.toLowerCase().includes(t),
        );
    }, [q, rows]);

    const selection = useRowSelection(filtered);

    const removeMany = async (toRemove) => {
        setBusy(true);
        const failed = [];
        for (const row of toRemove) {
            try {
                await axios.delete(`${API_URL}/api/academics/students/${row.id}/`);
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
                title="Students"
                subtitle={`${rows.length} active learners across Nursery 1 – Basic 6.`}
                actions={[
                    <Button key="add" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                        + New Student
                    </Button>,
                ]}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
                <div className="flex-1">
                    <Input placeholder="Search by name, admission no, or guardian…" value={q} onChange={e => setQ(e.target.value)} />
                </div>
                <Select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                    <option value="">All sections</option>
                    <option value="nursery">Nursery</option>
                    <option value="basic">Basic</option>
                </Select>
                <Select value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                    <option value="">All classes</option>
                    {CLASS_LEVELS.map((_, i) => (
                        <option key={i + 1} value={i + 1}>{CLASS_LEVELS[i]}</option>
                    ))}
                </Select>
                <BulkActionBar
                    count={selection.selectedRows.length}
                    label="Move to trash"
                    onAction={() => setConfirm({ rows: selection.selectedRows })}
                />
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="No students match your filters."
                onRowClick={(row) => { setEditing(row); setFormOpen(true); }}
                columns={[
                    selectionColumn(selection),
                    {
                        key: 'student', label: 'Student',
                        render: r => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                    {(r.first_name?.[0] || '') + (r.last_name?.[0] || '')}
                                </div>
                                <div>
                                    <div className="font-semibold text-ink">{r.full_name}</div>
                                    <div className="text-xs text-gray-400 font-mono">{r.admission_no}</div>
                                </div>
                            </div>
                        ),
                    },
                    { key: 'class_name', label: 'Class', render: r => <Badge tone={r.class_section === 'nursery' ? 'warm' : 'mint'}>{r.class_name}</Badge> },
                    { key: 'gender', label: 'Gender', render: r => r.gender === 'M' ? 'Boy' : 'Girl' },
                    { key: 'guardian_name', label: 'Guardian', render: r => r.guardian_name || <span className="text-gray-400">—</span> },
                    { key: 'guardian_phone', label: 'Phone', render: r => r.guardian_phone || <span className="text-gray-400">—</span> },
                    { key: 'status', label: 'Status', render: r => <Badge tone={statusTone[r.status] || 'neutral'}>{r.status}</Badge> },
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

            <StudentForm
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
                title={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} students to the trash?` : `Move ${confirm?.rows[0]?.full_name} to the trash?`}
                body="You can restore them later from Trash."
                confirmLabel={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} to trash` : 'Move to trash'}
                tone="danger"
            />
        </>
    );
};

export default StudentsPage;
