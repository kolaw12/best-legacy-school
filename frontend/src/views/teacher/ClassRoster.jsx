import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/admin/DataTable';
import useTeacherClass from '../../context/useTeacherClass';
import ClassSwitcher from '../../components/teacher/ClassSwitcher';
import API_URL from '../../config/api';

const ClassRoster = () => {
    const { classes, classLevel, setClassLevel, loading: tLoading } = useTeacherClass();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classLevel?.id) { setLoading(false); return; }
        axios.get(`${API_URL}/api/academics/students/`, { params: { class_level: classLevel.id } })
            .then(r => setRows(r.data || []))
            .finally(() => setLoading(false));
    }, [classLevel?.id]);

    if (tLoading) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
    if (!classLevel) return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No class assigned.</div>;

    return (
        <>
            <header className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="mint" dot>{classLevel.name}</Badge>
                    <ClassSwitcher classes={classes} value={classLevel} onChange={setClassLevel} />
                </div>
                <h1 className="mt-3 text-2xl md:text-3xl font-black text-ink">Your class</h1>
                <p className="mt-1 text-sm text-gray-500">{rows.length} pupils in {classLevel.name}. Use "Enter results" to fill in a pupil's subjects one at a time.</p>
            </header>

            <DataTable
                loading={loading}
                rows={rows}
                empty="No pupils enrolled yet."
                columns={[
                    {
                        key: 'student', label: 'Pupil',
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
                    { key: 'gender', label: 'Gender', render: r => r.gender === 'M' ? 'Boy' : 'Girl' },
                    { key: 'guardian_name', label: 'Guardian', render: r => r.guardian_name || <span className="text-gray-400">—</span> },
                    { key: 'guardian_phone', label: 'Contact', render: r => r.guardian_phone || <span className="text-gray-400">—</span> },
                    { key: 'status', label: 'Status', render: r => <Badge tone={r.status === 'active' ? 'mint' : 'neutral'}>{r.status}</Badge> },
                    {
                        key: 'action', label: '',
                        render: r => (
                            <div className="flex items-center gap-3 whitespace-nowrap">
                                <Link to={`/teacher/students/${r.id}/results`} className="text-xs font-semibold text-primary hover:underline">Enter results →</Link>
                                <Link to={`/teacher/report-cards/${r.id}`} className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline">View report</Link>
                            </div>
                        ),
                    },
                ]}
            />
        </>
    );
};

export default ClassRoster;
