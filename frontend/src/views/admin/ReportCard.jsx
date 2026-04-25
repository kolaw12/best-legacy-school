import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import API_URL from '../../config/api';

const ReportCardView = () => {
    const { studentId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/academics/report-card/${studentId}/`)
            .then(r => setData(r.data))
            .catch(e => setError(e.response?.data?.error || e.message))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading report card…</div>;
    if (error)   return <div className="py-16 text-center text-rose-600 text-sm">{error}</div>;
    if (!data)   return null;

    const { student, term, attendance, is_nursery, grades, assessments, summary } = data;

    return (
        <>
            {/* Toolbar — hidden on print */}
            <div className="no-print print:hidden flex items-center justify-between mb-6">
                <div>
                    <Link to="/admin/students" className="text-xs font-semibold text-primary hover:underline">← Back to students</Link>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="primary"
                        href={`${API_URL}/api/academics/report-card/${studentId}/pdf/`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Download PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.print()}>Print this page</Button>
                </div>
            </div>

            {/* Report card body */}
            <article className="bg-white rounded-3xl shadow-card-lg print:shadow-none print:rounded-none border border-gray-100 print:border-0 max-w-4xl mx-auto">
                <header className="p-8 pb-0 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl">BL</span>
                        <div>
                            <div className="font-black text-ink text-lg leading-tight">Best Legacy Divine School</div>
                            <div className="text-xs text-gray-500">8, Kolawole Street, Mowe, Ogun State</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge tone={is_nursery ? 'warm' : 'mint'}>
                            {is_nursery ? 'Nursery Report' : 'Basic Report'}
                        </Badge>
                        <div className="mt-2 text-xs text-gray-500">
                            {term.name} Term · {term.session}
                        </div>
                    </div>
                </header>

                <div className="px-8 pt-6 pb-4 border-b border-gray-100">
                    <h1 className="text-2xl md:text-3xl font-black text-ink">Report Card</h1>
                    <p className="text-xs text-gray-500">Issued for the {term.name.toLowerCase()} term of {term.session}.</p>
                </div>

                {/* Pupil info */}
                <section className="grid md:grid-cols-4 gap-4 p-8 border-b border-gray-100">
                    <InfoCell label="Pupil" value={student.full_name} />
                    <InfoCell label="Admission No." value={<span className="font-mono">{student.admission_no}</span>} />
                    <InfoCell label="Class" value={student.class_name} />
                    <InfoCell label="Gender" value={student.gender} />
                </section>

                {/* Attendance */}
                <section className="grid grid-cols-3 gap-4 p-8 border-b border-gray-100 bg-gray-50/50">
                    <InfoCell label="Days Marked"   value={attendance.total} />
                    <InfoCell label="Days Present"  value={attendance.present} />
                    <InfoCell label="Attendance %"  value={attendance.rate != null ? `${attendance.rate}%` : '—'} />
                </section>

                {/* Body */}
                {is_nursery ? (
                    <section className="p-8">
                        <h2 className="font-bold text-ink mb-4">Developmental assessment</h2>
                        {assessments?.length ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                        <th className="text-left py-2">Domain</th>
                                        <th className="text-center py-2 w-24">Rating</th>
                                        <th className="text-left py-2">Teacher's note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.map((a, i) => (
                                        <tr key={i} className="border-b border-gray-50">
                                            <td className="py-2.5 font-medium text-ink">{a.domain}</td>
                                            <td className="py-2.5 text-center"><Badge tone="mint">{a.rating_display}</Badge></td>
                                            <td className="py-2.5 text-sm text-gray-600">{a.remark || <span className="text-gray-300">—</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No assessments entered for this term yet.</p>
                        )}
                    </section>
                ) : (
                    <section className="p-8">
                        <h2 className="font-bold text-ink mb-4">Academic results</h2>
                        {grades?.length ? (
                            <>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                            <th className="text-left py-2">Subject</th>
                                            <th className="text-center py-2 w-16">CA1</th>
                                            <th className="text-center py-2 w-16">CA2</th>
                                            <th className="text-center py-2 w-16">Exam</th>
                                            <th className="text-center py-2 w-16">Total</th>
                                            <th className="text-center py-2 w-14">Grade</th>
                                            <th className="text-left py-2">Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.map((g, i) => (
                                            <tr key={i} className="border-b border-gray-50">
                                                <td className="py-2.5 font-medium text-ink">{g.subject}</td>
                                                <td className="py-2.5 text-center tabular-nums">{g.ca1}</td>
                                                <td className="py-2.5 text-center tabular-nums">{g.ca2}</td>
                                                <td className="py-2.5 text-center tabular-nums">{g.exam}</td>
                                                <td className="py-2.5 text-center font-bold">{g.total}</td>
                                                <td className="py-2.5 text-center"><Badge tone={['A','B'].includes(g.grade) ? 'mint' : ['C','D'].includes(g.grade) ? 'neutral' : 'warm'}>{g.grade}</Badge></td>
                                                <td className="py-2.5 text-sm text-gray-600">{g.remark || <span className="text-gray-300">—</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-6 grid md:grid-cols-3 gap-4">
                                    <InfoCell label="Subjects" value={summary.subjects} />
                                    <InfoCell label="Overall total" value={summary.overall_total} />
                                    <InfoCell label="Average" value={summary.average != null ? `${summary.average}/100` : '—'} />
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No grades entered for this term yet.</p>
                        )}
                    </section>
                )}

                {/* Signatures */}
                <footer className="p-8 pt-0 grid md:grid-cols-2 gap-10 text-xs">
                    <div>
                        <div className="h-10 border-b border-dashed border-gray-300"></div>
                        <div className="mt-2 text-gray-500">Class Teacher's signature</div>
                    </div>
                    <div>
                        <div className="h-10 border-b border-dashed border-gray-300"></div>
                        <div className="mt-2 text-gray-500">Head Teacher's signature</div>
                    </div>
                </footer>
            </article>

            <style>{`
                @media print {
                    body { background: white !important; }
                    .bg-bg, .bg-gray-50\\/50 { background: white !important; }
                }
            `}</style>
        </>
    );
};

const InfoCell = ({ label, value }) => (
    <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
        <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
);

export default ReportCardView;
