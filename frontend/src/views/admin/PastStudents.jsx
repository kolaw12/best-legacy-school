import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { RotateCcw } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/Field';
import API_URL from '../../config/api';

const STATUS_TONE = { graduated: 'mint', withdrawn: 'warm' };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const PastStudents = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [restoreConfirm, setRestoreConfirm] = useState(null);
    const [restoring, setRestoring] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        const params = { status: 'graduated,withdrawn', page_size: 200 };
        axios.get(`${API_URL}/api/academics/students/`, { params })
            .then(r => {
                const data = r.data;
                setRows(Array.isArray(data) ? data : data.results || []);
            })
            .catch(() => {
                // Fallback: try with query param
                axios.get(`${API_URL}/api/academics/students/`, { params: { status: 'graduated' } })
                    .then(r1 => {
                        const gradRows = Array.isArray(r1.data) ? r1.data : r1.data.results || [];
                        return axios.get(`${API_URL}/api/academics/students/`, { params: { status: 'withdrawn' } })
                            .then(r2 => {
                                const withRows = Array.isArray(r2.data) ? r2.data : r2.data.results || [];
                                setRows([...gradRows, ...withRows]);
                            });
                    })
                    .catch(() => setRows([]));
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const filtered = useMemo(() => {
        let list = rows;
        if (statusFilter) list = list.filter(r => r.status === statusFilter);
        if (q) {
            const t = q.toLowerCase();
            list = list.filter(r =>
                r.full_name?.toLowerCase().includes(t) ||
                r.admission_no?.toLowerCase().includes(t) ||
                r.guardian_name?.toLowerCase().includes(t),
            );
        }
        return list;
    }, [rows, statusFilter, q]);

    const restoreStudent = async () => {
        if (!restoreConfirm) return;
        setRestoring(true);
        try {
            await axios.patch(`${API_URL}/api/academics/students/${restoreConfirm.id}/`, { status: 'active' });
            setRows(rs => rs.filter(r => r.id !== restoreConfirm.id));
            setRestoreConfirm(null);
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to restore student.');
        } finally {
            setRestoring(false);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Past Students"
                subtitle={`${rows.length} students with graduated or withdrawn status.`}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-3 flex-wrap">
                <Input placeholder="Search by name, admission no, or guardian…" value={q} onChange={e => setQ(e.target.value)} className="flex-1 max-w-md" />
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="max-w-xs">
                    <option value="">All statuses</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                </Select>
            </div>

            <DataTable
                loading={loading}
                rows={filtered}
                empty="No past students found."
                columns={[
                    { key: 'admission_no', label: 'Admission No.', render: r => <span className="font-mono text-xs">{r.admission_no}</span> },
                    {
                        key: 'name', label: 'Student',
                        render: r => (
                            <div className="flex items-center gap-3">
                                {r.photo ? (
                                    <img src={r.photo} alt={r.full_name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                        {(r.first_name?.[0] || '') + (r.last_name?.[0] || '')}
                                    </div>
                                )}
                                <div>
                                    <div className="font-semibold text-ink">{r.full_name}</div>
                                    <div className="text-xs text-gray-400">{r.class_name} · {r.gender === 'M' ? 'Boy' : 'Girl'}</div>
                                </div>
                            </div>
                        ),
                    },
                    { key: 'guardian_name', label: 'Guardian', render: r => r.guardian_name || <span className="text-gray-400">—</span> },
                    { key: 'guardian_phone', label: 'Contact', render: r => r.guardian_phone || <span className="text-gray-400">—</span> },
                    {
                        key: 'status', label: 'Status',
                        render: r => <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge>,
                    },
                    {
                        key: 'actions', label: '',
                        render: r => (
                            <button
                                onClick={() => setRestoreConfirm(r)}
                                title="Restore to active"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                                Restore
                            </button>
                        ),
                    },
                ]}
            />

            <ConfirmDialog
                open={!!restoreConfirm}
                onClose={() => setRestoreConfirm(null)}
                onConfirm={restoreStudent}
                busy={restoring}
                title={`Restore ${restoreConfirm?.full_name}?`}
                body={`This will set their status back to "active" and they'll appear in the Students list again.`}
                confirmLabel="Restore student"
                tone="default"
            />
        </>
    );
};

export default PastStudents;
