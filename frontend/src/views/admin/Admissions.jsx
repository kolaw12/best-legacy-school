import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import API_URL from '../../config/api';
import { CLASS_LEVELS } from '../../config/school';

const STATUS_TONE = { pending: 'neutral', accepted: 'mint', rejected: 'warm' };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const AdmissionsPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [updating, setUpdating] = useState(null);

    const load = () => {
        setLoading(true);
        const params = {};
        if (classFilter) params.class = classFilter;
        axios.get(`${API_URL}/api/admissions/`, { params })
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, [classFilter]);

    const filtered = useMemo(() => {
        let list = rows;
        if (status) list = list.filter(r => r.status === status);
        if (q) {
            const t = q.toLowerCase();
            list = list.filter(r =>
                r.student_name?.toLowerCase().includes(t) ||
                r.parent_name?.toLowerCase().includes(t) ||
                r.student_id?.toLowerCase().includes(t) ||
                r.email?.toLowerCase().includes(t),
            );
        }
        return list;
    }, [rows, status, q]);

    const updateStatus = async (row, newStatus) => {
        setUpdating(row.id);
        try {
            await axios.patch(`${API_URL}/api/admissions/${row.id}/`, { status: newStatus });
            setRows(rs => rs.map(r => r.id === row.id ? { ...r, status: newStatus } : r));
        } catch (e) {
            console.error(e);
            alert('Failed to update — see console.');
        } finally {
            setUpdating(null);
        }
    };

    const enroll = async (row) => {
        const ok = confirm(
            `Enrol ${row.student_name} into ${row.class_applying_for}?\n\n` +
            `This creates a permanent student record with admission number, links the guardian, and sends a welcome email. ` +
            `It cannot be undone here — only via the Django admin.`
        );
        if (!ok) return;
        setUpdating(row.id);
        try {
            const { data } = await axios.post(`${API_URL}/api/admissions/${row.id}/enroll/`);
            if (data?.student?.admission_no) {
                alert(`Enrolled as ${data.student.admission_no}.`);
            } else {
                alert('Enrolled.');
            }
            setRows(rs => rs.map(r => r.id === row.id ? { ...r, enrolled: true } : r));
        } catch (e) {
            const msg = e.response?.data?.error || e.message || 'Failed';
            alert(`Could not enrol: ${msg}`);
        } finally {
            setUpdating(null);
        }
    };

    const counts = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

    return (
        <>
            <AdminPageHeader
                title="Admissions Pipeline"
                subtitle="All incoming applications. Accepting a pupil sends the parent an email automatically."
                actions={[
                    <span key="total" className="text-xs text-gray-500 px-3 py-2">
                        {rows.length} total · {counts.pending || 0} pending · {counts.accepted || 0} accepted · {counts.rejected || 0} rejected
                    </span>,
                ]}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                    <Input placeholder="Search by student, parent, email, or App ID…" value={q} onChange={e => setQ(e.target.value)} />
                </div>
                <Select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                </Select>
                <Select value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                    <option value="">All classes</option>
                    {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="No applications match your filters."
                columns={[
                    { key: 'student_id', label: 'App ID', render: r => <span className="font-mono text-xs">{r.student_id}</span> },
                    {
                        key: 'student_name', label: 'Student',
                        render: r => (
                            <div>
                                <div className="font-semibold text-ink">{r.student_name}</div>
                                <div className="text-xs text-gray-400">{r.gender === 'M' ? 'Boy' : 'Girl'} · DOB {fmtDate(r.date_of_birth)}</div>
                            </div>
                        ),
                    },
                    { key: 'class_applying_for', label: 'Class', render: r => <Badge tone="mint">{r.class_applying_for}</Badge> },
                    {
                        key: 'parent', label: 'Parent / Contact',
                        render: r => (
                            <div>
                                <div className="text-ink">{r.parent_name}</div>
                                <div className="text-xs text-gray-400">{r.email} · {r.phone_number}</div>
                            </div>
                        ),
                    },
                    { key: 'created_at', label: 'Applied', render: r => fmtDate(r.created_at) },
                    { key: 'status', label: 'Status', render: r => <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge> },
                    {
                        key: 'actions', label: '',
                        render: r => {
                            if (r.status === 'pending') {
                                return (
                                    <div className="flex gap-2">
                                        <button
                                            disabled={updating === r.id}
                                            onClick={() => updateStatus(r, 'accepted')}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                                        >Accept</button>
                                        <button
                                            disabled={updating === r.id}
                                            onClick={() => updateStatus(r, 'rejected')}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                                        >Reject</button>
                                    </div>
                                );
                            }
                            if (r.status === 'accepted') {
                                return (
                                    <button
                                        disabled={updating === r.id}
                                        onClick={() => enroll(r)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-ink hover:bg-secondary-dark disabled:opacity-50"
                                    >Enrol as Student</button>
                                );
                            }
                            return <span className="text-xs text-gray-400">—</span>;
                        },
                    },
                ]}
            />
        </>
    );
};

export default AdmissionsPage;
