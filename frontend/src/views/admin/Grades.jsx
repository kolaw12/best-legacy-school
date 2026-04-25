import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';

const AdminGrades = () => {
    const [classes, setClasses] = useState([]);
    const [classId, setClassId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [terms, setTerms] = useState([]);
    const [termId, setTermId] = useState('');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        adminApi.classes().then(r => setClasses(r.data || []));
        adminApi.terms().then(r => {
            const ts = r.data || [];
            setTerms(ts);
            const current = ts.find(t => t.is_current) || ts[0];
            if (current) setTermId(String(current.id));
        });
    }, []);

    const selectedClass = classes.find(c => String(c.id) === String(classId));
    const isNursery = selectedClass?.section === 'nursery';

    useEffect(() => {
        if (!selectedClass) return;
        adminApi.subjects({ section: selectedClass.section }).then(r => {
            const subs = r.data || [];
            setSubjects(subs);
            if (subs.length && !isNursery) setSubjectId(String(subs[0].id));
        });
    }, [classId, selectedClass?.section]);

    useEffect(() => {
        if (!classId || !termId) return;
        setLoading(true);
        const url = isNursery
            ? `${API_URL}/api/academics/assessments/`
            : `${API_URL}/api/academics/grades/`;
        const params = { class_level: classId, term: termId };
        if (!isNursery && subjectId) params.subject = subjectId;
        axios.get(url, { params })
            .then(r => setRows(r.data || []))
            .finally(() => setLoading(false));
    }, [classId, subjectId, termId, isNursery]);

    return (
        <>
            <AdminPageHeader
                title="Grades & Assessments"
                subtitle="Browse entries across classes. Teachers edit from their portal; admins can edit via Django admin."
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 grid md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Class</label>
                    <Select value={classId} onChange={e => setClassId(e.target.value)}>
                        <option value="">Select class…</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Term</label>
                    <Select value={termId} onChange={e => setTermId(e.target.value)}>
                        {terms.map(t => <option key={t.id} value={t.id}>{t.name} — {t.session_name}{t.is_current ? ' (current)' : ''}</option>)}
                    </Select>
                </div>
                {!isNursery && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject</label>
                        <Select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                            <option value="">All subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                )}
            </div>

            {!classId ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">Pick a class to view entries.</div>
            ) : isNursery ? (
                <DataTable
                    loading={loading} rows={rows} empty="No assessments entered for this term yet."
                    columns={[
                        { key: 'student_name', label: 'Pupil', render: r => <Link to={`/admin/report-cards/${r.student}`} className="font-semibold text-ink hover:text-primary">{r.student_name}</Link> },
                        { key: 'admission_no', label: 'Admission #', render: r => <span className="font-mono text-xs">{r.admission_no}</span> },
                        { key: 'domain_display', label: 'Domain' },
                        { key: 'rating_display', label: 'Rating', render: r => <Badge tone="mint">{r.rating_display}</Badge> },
                        { key: 'remark', label: 'Remark', render: r => <span className="text-xs text-gray-600">{r.remark}</span> },
                    ]}
                />
            ) : (
                <DataTable
                    loading={loading} rows={rows} empty="No grades entered for this selection yet."
                    columns={[
                        { key: 'student_name', label: 'Pupil', render: r => <Link to={`/admin/report-cards/${r.student}`} className="font-semibold text-ink hover:text-primary">{r.student_name}</Link> },
                        { key: 'admission_no', label: 'Admission #', render: r => <span className="font-mono text-xs">{r.admission_no}</span> },
                        { key: 'subject_name', label: 'Subject' },
                        { key: 'ca1', label: 'CA1', className: 'text-center tabular-nums' },
                        { key: 'ca2', label: 'CA2', className: 'text-center tabular-nums' },
                        { key: 'exam', label: 'Exam', className: 'text-center tabular-nums' },
                        { key: 'total', label: 'Total', className: 'text-center font-bold tabular-nums' },
                        { key: 'grade', label: 'Grade', render: r => <Badge tone={['A','B'].includes(r.grade) ? 'mint' : ['C','D'].includes(r.grade) ? 'neutral' : 'warm'}>{r.grade}</Badge> },
                    ]}
                />
            )}
        </>
    );
};

export default AdminGrades;
