import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import BulkActionBar from '../../components/admin/BulkActionBar';
import { selectionColumn } from '../../components/admin/selectionColumn';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Field, { Input, Select } from '../../components/ui/Field';
import CopyButton from '../../components/ui/CopyButton';
import useRowSelection from '../../hooks/useRowSelection';
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
    const [confirm, setConfirm] = useState(null); // trash confirm
    const [enrollConfirm, setEnrollConfirm] = useState(null); // enrollment confirm
    const [enrollPassword, setEnrollPassword] = useState('');
    const [enrollResult, setEnrollResult] = useState(null); // enrollment success
    const [busy, setBusy] = useState(false);

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
        } finally {
            setUpdating(null);
        }
    };

    const doEnroll = async (row) => {
        const hasEmail = !!row.email;
        const password = enrollPassword.trim();

        // If no email and no password provided, warn
        if (!hasEmail && !password) {
            return; // don't proceed — password field is required
        }

        setEnrollConfirm(null);
        setUpdating(row.id);
        try {
            const payload = {};
            if (!hasEmail && password) payload.temp_password = password;
            const { data } = await axios.post(`${API_URL}/api/admissions/${row.id}/enroll/`, payload);
            setEnrollResult({
                name: row.student_name,
                admissionNo: data?.student?.admission_no || null,
                alreadyEnrolled: data?.detail === 'already enrolled',
                credentials: data?.login_credentials || null,
                hasEmail,
            });
            setRows(rs => rs.map(r => r.id === row.id ? { ...r, enrolled: true } : r));
        } catch (e) {
            const msg = e.response?.data?.error || e.message || 'Failed';
            setEnrollResult({ name: row.student_name, error: msg });
        } finally {
            setUpdating(null);
            setEnrollPassword('');
        }
    };

    const selection = useRowSelection(filtered);

    const removeMany = async (toRemove) => {
        setBusy(true);
        const failed = [];
        for (const row of toRemove) {
            try {
                await axios.delete(`${API_URL}/api/admissions/${row.id}/`);
                setRows(rs => rs.filter(r => r.id !== row.id));
            } catch (e) {
                failed.push(`${row.student_name}: ${e.response?.data?.error || 'failed'}`);
            }
        }
        selection.clear();
        setBusy(false);
        setConfirm(null);
        if (failed.length) alert(`Some applications couldn't be moved to the trash:\n\n${failed.join('\n')}`);
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
                <Select value={status} onChange={e => setStatus(e.target.value)} className="max-w-xs">
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                </Select>
                <Select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="max-w-xs">
                    <option value="">All classes</option>
                    {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
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
                empty="No applications match your filters."
                columns={[
                    selectionColumn(selection),
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
                            let statusAction;
                            if (r.status === 'pending') {
                                statusAction = (
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
                            } else if (r.enrolled) {
                                statusAction = <Badge tone="mint">Enrolled</Badge>;
                            } else if (r.status === 'accepted') {
                                statusAction = (
                                    <button
                                        disabled={updating === r.id}
                                        onClick={() => setEnrollConfirm(r)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-ink hover:bg-secondary-dark disabled:opacity-50"
                                    >{updating === r.id ? 'Enrolling…' : 'Enrol as Student'}</button>
                                );
                            } else {
                                statusAction = <span className="text-xs text-gray-400">—</span>;
                            }
                            return (
                                <div className="flex items-center gap-2">
                                    {statusAction}
                                    <button
                                        onClick={() => setConfirm({ rows: [r] })}
                                        title="Move to trash"
                                        className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                    >
                                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                                    </button>
                                </div>
                            );
                        },
                    },
                ]}
            />

            {/* Trash confirm */}
            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => removeMany(confirm.rows)}
                busy={busy}
                title={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} applications to the trash?` : `Move "${confirm?.rows[0]?.student_name}"'s application to the trash?`}
                body="You can restore it later from Trash."
                confirmLabel={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} to trash` : 'Move to trash'}
                tone="danger"
            />

            {/* Enrol confirm */}
            <Modal
                open={!!enrollConfirm}
                onClose={() => { setEnrollConfirm(null); setEnrollPassword(''); }}
                title={`Enrol ${enrollConfirm?.student_name}?`}
                size="sm"
                footer={[
                    <Button key="cancel" variant="outline" size="sm" onClick={() => { setEnrollConfirm(null); setEnrollPassword(''); }}>Cancel</Button>,
                    <Button
                        key="enrol" size="sm"
                        disabled={updating === enrollConfirm?.id || (!enrollConfirm?.email && !enrollPassword.trim())}
                        onClick={() => doEnroll(enrollConfirm)}
                    >
                        {updating === enrollConfirm?.id ? 'Enrolling…' : 'Enrol as Student'}
                    </Button>,
                ]}
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="shrink-0 w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="text-sm text-gray-600">
                            This creates a student record for <strong>{enrollConfirm?.student_name}</strong> in <strong>{enrollConfirm?.class_applying_for}</strong> and links the guardian.
                        </div>
                    </div>

                    {enrollConfirm?.email ? (
                        <div className="bg-primary-soft/40 border border-primary/20 rounded-xl p-3 text-sm text-primary-dark">
                            An invite link will be emailed to <strong>{enrollConfirm.email}</strong>. The parent will set their own password.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    This parent has no email address. Set a temporary password they can use to log in at the Parent Portal. Tell them to change it after logging in.
                                </p>
                            </div>
                            <Field label="Temporary password for parent" required>
                                <Input
                                    type="text"
                                    value={enrollPassword}
                                    onChange={e => setEnrollPassword(e.target.value)}
                                    placeholder="e.g. Welcome2026!"
                                    autoFocus
                                />
                            </Field>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Enrol result */}
            <Modal
                open={!!enrollResult}
                onClose={() => setEnrollResult(null)}
                title={enrollResult?.error ? 'Enrollment failed' : 'Enrolled successfully'}
                size="sm"
                footer={[<Button key="done" size="sm" onClick={() => setEnrollResult(null)}>Done</Button>]}
            >
                {enrollResult?.error ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
                        {enrollResult.error}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                                <CheckCircle className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-sm text-ink">
                                    <strong>{enrollResult?.name}</strong> has been enrolled as a student.
                                </p>
                                {enrollResult?.admissionNo && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Admission number: <span className="font-mono font-semibold">{enrollResult.admissionNo}</span>
                                    </p>
                                )}
                                {enrollResult?.alreadyEnrolled && (
                                    <p className="text-sm text-amber-600 mt-1">This admission was already enrolled.</p>
                                )}
                            </div>
                        </div>

                        {enrollResult?.credentials ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
                                    <p className="text-xs text-amber-800 font-semibold">
                                        Share these login details with the parent securely. They won't be shown again.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Username</div>
                                            <div className="font-mono text-sm text-ink">{enrollResult.credentials.username}</div>
                                        </div>
                                        <CopyButton value={enrollResult.credentials.username} label="username" />
                                    </div>
                                    <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Password</div>
                                            <div className="font-mono text-sm text-ink">{enrollResult.credentials.password}</div>
                                        </div>
                                        <CopyButton value={enrollResult.credentials.password} label="password" />
                                    </div>
                                </div>
                                <p className="text-[11px] text-amber-700 mt-2">
                                    Parent portal: <span className="font-mono">/parent-login</span>
                                </p>
                            </div>
                        ) : enrollResult?.hasEmail ? (
                            <div className="bg-primary-soft/40 border border-primary/20 rounded-xl p-3 text-sm text-primary-dark">
                                An invite email has been sent to the parent. They'll set their own password.
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default AdmissionsPage;
