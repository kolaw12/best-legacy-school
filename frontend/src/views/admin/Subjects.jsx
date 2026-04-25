import { useEffect, useState } from 'react';
import AdminPageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/ui/Badge';
import adminApi from '../../config/adminApi';

const SubjectsPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.subjects()
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    }, []);

    const nursery = rows.filter(r => r.section === 'nursery');
    const basic = rows.filter(r => r.section === 'basic');

    return (
        <>
            <AdminPageHeader
                title="Subjects"
                subtitle="Nursery focuses on developmental skills. Basic follows the Nigerian primary curriculum."
            />

            <div className="grid lg:grid-cols-2 gap-6">
                <Panel title="Nursery subjects" rows={nursery} loading={loading} tone="warm"
                       hint="Teacher-led, play-based, graded E / VG / G / F / NI." />
                <Panel title="Basic subjects" rows={basic} loading={loading} tone="mint"
                       hint="CA1 + CA2 + Exam out of 100. Graded A–F." />
            </div>
        </>
    );
};

const Panel = ({ title, rows, loading, tone, hint }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
        <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-ink">{title}</h3>
            <Badge tone={tone}>{loading ? '—' : `${rows.length}`}</Badge>
        </div>
        <p className="text-xs text-gray-500 mb-5">{hint}</p>

        {loading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse"/>)}</div>
        ) : (
            <ul className="divide-y divide-gray-50">
                {rows.map(s => (
                    <li key={s.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${tone === 'warm' ? 'bg-secondary-soft text-secondary-dark' : 'bg-primary-soft text-primary-dark'}`}>
                                {s.code || s.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-ink">{s.name}</span>
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

export default SubjectsPage;
