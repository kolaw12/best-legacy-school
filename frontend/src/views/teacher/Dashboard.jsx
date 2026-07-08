import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CheckSquare, NotebookPen, PencilLine, Users, TrendingUp, BookOpen, AlertTriangle } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import KpiCard from '../../components/admin/KpiCard';
import WelcomeCard from '../../components/ui/WelcomeCard';
import useTeacherClass from '../../context/useTeacherClass';
import ClassSwitcher from '../../components/teacher/ClassSwitcher';
import API_URL from '../../config/api';

const today = () => new Date().toISOString().slice(0, 10);

const TeacherDashboard = () => {
    const { teacher, classes, classLevel, setClassLevel, isClassTeacher, loading: tLoading } = useTeacherClass();
    const [roster, setRoster] = useState([]);
    const [todayRecords, setTodayRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classLevel) { setLoading(false); return; }
        setLoading(true);
        Promise.all([
            axios.get(`${API_URL}/api/academics/students/`, {
                params: { class_level: classLevel.id, status: 'active' },
            }),
            axios.get(`${API_URL}/api/academics/attendance/`, {
                params: { class_level: classLevel.id, date: today() },
            }),
        ])
            .then(([sRes, aRes]) => {
                setRoster(sRes.data || []);
                setTodayRecords(aRes.data || []);
            })
            .finally(() => setLoading(false));
    }, [classLevel]);

    const presentToday = todayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const rate = todayRecords.length ? Math.round((presentToday / todayRecords.length) * 100) : null;
    const attendanceMarked = todayRecords.length > 0;

    if (tLoading) {
        return <div className="py-16 text-center text-gray-400 text-sm">Loading your class…</div>;
    }

    if (!classLevel) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-soft text-secondary mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className="mt-4 text-xl font-black text-ink">No class assigned yet</h2>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    {teacher
                        ? `Hi ${teacher.first_name} — you're not listed as a class teacher yet. Ask an admin to assign you a class so your dashboard fills in.`
                        : "Your account isn't linked to a teacher record. Ask an admin to sort it out."}
                </p>
            </div>
        );
    }

    return (
        <>
            <WelcomeCard
                storageKey="bls.tour.teacher.v1"
                tone="warm"
                title={`Welcome, ${teacher?.first_name || 'teacher'}`}
                subtitle="Four things this portal does — once you've used each, this card disappears."
                steps={[
                    { icon: <CheckSquare className="w-4 h-4 text-secondary-dark" strokeWidth={2} />, label: 'Mark attendance for your class each morning' },
                    { icon: <NotebookPen className="w-4 h-4 text-secondary-dark" strokeWidth={2} />, label: 'Enter CA / exam scores; totals + grades compute for you' },
                    { icon: <PencilLine className="w-4 h-4 text-secondary-dark" strokeWidth={2} />, label: 'Set assignments and grade what comes back' },
                    { icon: <Users className="w-4 h-4 text-secondary-dark" strokeWidth={2} />, label: 'Class roster shows guardian phone numbers when you need them' },
                ]}
            />
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone="warm" dot>{classLevel.section === 'nursery' ? 'Nursery Section' : 'Basic Section'}</Badge>
                        <ClassSwitcher classes={classes} value={classLevel} onChange={setClassLevel} />
                    </div>
                    <h1 className="mt-3 text-2xl md:text-3xl font-black text-ink">Welcome, {teacher?.first_name}.</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isClassTeacher
                            ? <>You're the class teacher of <span className="font-semibold text-ink">{classLevel.name}</span>.</>
                            : <>You teach a subject in <span className="font-semibold text-ink">{classLevel.name}</span>{classes.length > 1 ? ` (and ${classes.length - 1} other class${classes.length > 2 ? 'es' : ''})` : ''}.</>}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button to="/teacher/attendance" size="sm">
                        {attendanceMarked ? 'Update attendance' : "Mark today's attendance"}
                    </Button>
                    <Button to="/teacher/grades" variant="outline" size="sm">Enter grades</Button>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard tone="primary" label="Class Size" value={loading ? '—' : roster.length} hint={classLevel.name}
                         icon={<Users className="w-5 h-5" strokeWidth={2} />}/>
                <KpiCard tone="warm" label="Present Today" value={loading ? '—' : presentToday} hint={attendanceMarked ? `of ${todayRecords.length} marked` : 'not marked yet'}
                         icon={<CheckSquare className="w-5 h-5" strokeWidth={2} />}/>
                <KpiCard tone="sage" label="Attendance Rate" value={loading ? '—' : (rate != null ? `${rate}%` : '—')} hint="Today"
                         icon={<TrendingUp className="w-5 h-5" strokeWidth={2} />}/>
                <KpiCard tone="ink" label={classLevel.section === 'nursery' ? 'Assessment Domains' : 'Subjects'} value={classLevel.section === 'nursery' ? 8 : '14'} hint="curriculum size"
                         icon={<BookOpen className="w-5 h-5" strokeWidth={2} />}/>
            </div>

            {/* Roster preview */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-ink">Your pupils</h3>
                    <Link to="/teacher/class" className="text-xs font-semibold text-primary hover:underline">Full roster →</Link>
                </div>
                {loading ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
                    </div>
                ) : roster.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No pupils enrolled in this class yet.</p>
                ) : (
                    <ul className="grid sm:grid-cols-2 gap-2">
                        {roster.slice(0, 8).map(s => (
                            <li key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50">
                                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                    {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-ink truncate">{s.full_name}</div>
                                    <div className="text-xs text-gray-400 font-mono">{s.admission_no}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default TeacherDashboard;
