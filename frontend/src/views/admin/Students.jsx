import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import StudentForm from '../../components/admin/forms/StudentForm';
import adminApi from '../../config/adminApi';
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

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3">
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
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="No students match your filters."
                onRowClick={(row) => { setEditing(row); setFormOpen(true); }}
                columns={[
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
                ]}
            />

            <StudentForm
                open={formOpen}
                initial={editing}
                onClose={() => setFormOpen(false)}
                onSaved={load}
            />
        </>
    );
};

export default StudentsPage;
