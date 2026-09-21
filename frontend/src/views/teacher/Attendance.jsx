import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { exportCsv } from '../../utils/exportCsv';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Field';
import useTeacherClass from '../../context/useTeacherClass';
import ClassSwitcher from '../../components/teacher/ClassSwitcher';
import API_URL from '../../config/api';

const STATUS_OPTIONS = [
    { code: 'present', label: 'Present', color: 'bg-primary text-white' },
    { code: 'absent',  label: 'Absent',  color: 'bg-secondary text-ink' },
    { code: 'late',    label: 'Late',    color: 'bg-amber-400 text-white' },
    { code: 'excused', label: 'Excused', color: 'bg-gray-300 text-ink' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const today = () => new Date().toISOString().slice(0, 10);
const yesterdayOf = (d) => {
    const x = new Date(d);
    x.setDate(x.getDate() - 1);
    return x.toISOString().slice(0, 10);
};
const getMonday = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
};
const weekDates = (monday) => {
    const dates = [];
    const d = new Date(monday + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
        dates.push(new Date(d).toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
    }
    return dates;
};

const WeekCalendar = ({ date, setDate, markedDates, weekStart, setWeekStart }) => {
    const dates = weekDates(weekStart);
    const markedSet = useMemo(() => new Set(markedDates), [markedDates]);
    const monthLabel = new Date(weekStart + 'T00:00:00').toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

    const prevWeek = () => {
        const d = new Date(weekStart + 'T00:00:00');
        d.setDate(d.getDate() - 7);
        setWeekStart(d.toISOString().slice(0, 10));
    };
    const nextWeek = () => {
        const d = new Date(weekStart + 'T00:00:00');
        d.setDate(d.getDate() + 7);
        setWeekStart(d.toISOString().slice(0, 10));
    };

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
                <button onClick={prevWeek} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-ink transition">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-gray-500 w-32 text-center">{monthLabel}</span>
                <button onClick={nextWeek} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-ink transition">
                    <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex-1 grid grid-cols-7 gap-1">
                    {dates.map((d, i) => {
                        const isMarked = markedSet.has(d);
                        const isSelected = d === date;
                        const isToday = d === today();
                        const dayNum = new Date(d + 'T00:00:00').getDate();
                        return (
                            <button
                                key={d}
                                onClick={() => setDate(d)}
                                className={`flex flex-col items-center gap-1 py-1.5 rounded-lg transition text-center ${
                                    isSelected
                                        ? 'bg-primary text-white shadow-sm'
                                        : isToday
                                            ? 'bg-primary-soft/40 text-primary-dark'
                                            : 'hover:bg-gray-50 text-ink'
                                }`}
                            >
                                <span className={`text-[9px] font-semibold uppercase ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                                    {DAYS[i]}
                                </span>
                                <span className="text-sm font-bold">{dayNum}</span>
                                {isMarked && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TeacherAttendance = () => {
    const { classes, classLevel, setClassLevel, loading: tLoading } = useTeacherClass();
    const [date, setDate] = useState(today());
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});
    const [yesterdayMarks, setYesterdayMarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [markedDates, setMarkedDates] = useState([]);
    const [weekStart, setWeekStart] = useState(() => getMonday(today()));
    const [showAddStudent, setShowAddStudent] = useState(false);

    const load = useCallback(() => {
        if (!classLevel?.id) return;
        setLoading(true);
        setSaved(null);
        setDirty(false);
        Promise.all([
            axios.get(`${API_URL}/api/academics/students/`, { params: { class_level: classLevel.id, status: 'active' } }),
            axios.get(`${API_URL}/api/academics/attendance/`, { params: { class_level: classLevel.id, date } }),
            axios.get(`${API_URL}/api/academics/attendance/`, { params: { class_level: classLevel.id, date: yesterdayOf(date) } }),
        ])
            .then(([sRes, aRes, yRes]) => {
                const roster = sRes.data || [];
                const existing = aRes.data || [];
                const yesterday = yRes.data || [];
                const m = {};
                const ym = {};
                roster.forEach(s => {
                    const rec = existing.find(r => r.student === s.id);
                    m[s.id] = rec ? { status: rec.status, note: rec.note || '', _fromRoster: true } : { status: null, note: '', _fromRoster: true };
                    const yrec = yesterday.find(r => r.student === s.id);
                    if (yrec) ym[s.id] = yrec.status;
                });
                setStudents(roster);
                setMarks(m);
                setYesterdayMarks(ym);
            })
            .finally(() => setLoading(false));
    }, [classLevel?.id, date]);

    useEffect(load, [load]);

    useEffect(() => {
        if (!classLevel?.id) return;
        axios.get(`${API_URL}/api/academics/attendance/marked-dates/`, { params: { class_level: classLevel.id } })
            .then(r => setMarkedDates(r.data || []))
            .catch(() => setMarkedDates([]));
    }, [classLevel?.id]);

    useEffect(() => {
        const newMonday = getMonday(date);
        setWeekStart(prev => prev === newMonday ? prev : newMonday);
    }, [date]);

    const setStatus = (id, status) => {
        setDirty(true);
        setMarks(m => {
            const current = m[id]?.status;
            // Toggle off if clicking the same status again
            const newStatus = current === status ? null : status;
            return { ...m, [id]: { ...(m[id] || {}), status: newStatus } };
        });
    };
    const setNote = (id, note) => { setDirty(true); setMarks(m => ({ ...m, [id]: { ...(m[id] || {}), note } })); };
    const removeStudent = (id) => {
        setDirty(true);
        setStudents(s => s.filter(st => st.id !== id));
        setMarks(m => { const next = { ...m }; delete next[id]; return next; });
    };
    const setAllTo = (status) => {
        setDirty(true);
        const fresh = {};
        students.forEach(s => { fresh[s.id] = { status, note: marks[s.id]?.note || '' }; });
        setMarks(fresh);
    };
    const yesterdayCounts = Object.values(yesterdayMarks).reduce((acc, st) => {
        acc[st] = (acc[st] || 0) + 1;
        return acc;
    }, {});
    const yesterdayHasData = Object.keys(yesterdayMarks).length > 0;

    const counts = useMemo(() => {
        const c = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
        Object.values(marks).forEach(m => {
            if (m.status === null) c.unmarked++;
            else c[m.status] = (c[m.status] || 0) + 1;
        });
        return c;
    }, [marks]);

    const markedTotal = counts.present + counts.absent + counts.late + counts.excused;
    const rate = markedTotal ? Math.round(((counts.present + counts.late) / markedTotal) * 100) : 0;

    const save = async () => {
        const todayISO = today();
        const daysAgo = Math.round((new Date(todayISO) - new Date(date)) / 86400000);
        if (daysAgo > 1) {
            const ok = confirm(
                `You are saving attendance for ${new Date(date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })} ` +
                `(${daysAgo} days ago). This will overwrite any existing records for that day. Continue?`
            );
            if (!ok) return;
        }
        setSaving(true);
        try {
            // Only save students that have been explicitly marked (status != null)
            const markedRecords = students
                .filter(s => marks[s.id]?.status !== null && marks[s.id]?.status !== undefined)
                .map(s => ({
                    student: s.id,
                    status: marks[s.id].status,
                    note: marks[s.id].note || '',
                }));
            const { data } = await axios.post(`${API_URL}/api/academics/attendance/bulk/`, {
                class_level: classLevel.id,
                date,
                records: markedRecords,
            });
            setSaved({ ok: true, ...data });
            setDirty(false);
            axios.get(`${API_URL}/api/academics/attendance/marked-dates/`, { params: { class_level: classLevel.id } })
                .then(r => setMarkedDates(r.data || []));
        } catch (e) {
            setSaved({ ok: false, error: e.response?.data?.error || e.message });
        } finally {
            setSaving(false);
        }
    };

    if (tLoading) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
    if (!classLevel) {
        return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No class assigned. Ask an admin to assign you a class.</div>;
    }

    return (
        <>
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone="mint" dot>{classLevel.name}</Badge>
                        <ClassSwitcher classes={classes} value={classLevel} onChange={setClassLevel} />
                    </div>
                    <h1 className="mt-3 text-2xl md:text-3xl font-black text-ink">Attendance</h1>
                    <p className="mt-1 text-sm text-gray-500">Mark your class for {new Date(date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
                </div>
                <div className="flex gap-2">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
                    <button onClick={() => exportCsv(students.map(s => ({
                        name: s.full_name,
                        admission_no: s.admission_no,
                        status: marks[s.id]?.status || 'unmarked',
                        note: marks[s.id]?.note || '',
                    })), [
                        { key: 'name', label: 'Student' },
                        { key: 'admission_no', label: 'Admission No' },
                        { key: 'status', label: 'Status' },
                        { key: 'note', label: 'Note' },
                    ], `attendance-${classLevel?.name}-${date}`)}
                        className="text-xs font-semibold px-3 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition inline-flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
                    <Button size="sm" onClick={save} disabled={saving || !students.length}>{saving ? 'Saving…' : 'Save'}</Button>
                </div>
            </header>

            {/* Week calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4">
                <WeekCalendar date={date} setDate={setDate} markedDates={markedDates} weekStart={weekStart} setWeekStart={setWeekStart} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <Tile label="Roster" value={students.length} />
                <Tile label="Marked" value={markedTotal} tone="bg-gray-100" accent="text-ink" />
                <Tile label="Present" value={counts.present} tone="bg-primary-soft" accent="text-primary-dark" />
                <Tile label="Absent" value={counts.absent} tone="bg-secondary-soft" accent="text-secondary-dark" />
                <Tile label="Late" value={counts.late} tone="bg-amber-50" accent="text-amber-700" />
                <Tile label="Rate" value={`${rate}%`} tone="bg-ink" accent="text-white" whiteLabel />
            </div>

            {yesterdayHasData && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold uppercase tracking-widest text-indigo-700">Yesterday</span>
                    <span className="text-indigo-900">
                        {yesterdayCounts.present || 0} present · {yesterdayCounts.absent || 0} absent
                        {yesterdayCounts.late ? ` · ${yesterdayCounts.late} late` : ''}
                        {yesterdayCounts.excused ? ` · ${yesterdayCounts.excused} excused` : ''}
                    </span>
                    <span className="text-indigo-500/70 ml-auto">For context — chronic absentees show below</span>
                </div>
            )}

            <div className="flex gap-2 mb-3">
                <button onClick={() => setAllTo('present')} className="text-xs font-semibold px-4 py-2 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition">
                    Mark all present
                </button>
                <button onClick={() => setAllTo('absent')} className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                    Mark all absent
                </button>
                <button onClick={() => setShowAddStudent(true)} className="text-xs font-semibold px-3 py-2 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition inline-flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Add student
                </button>
            </div>

            {saved && (
                <div className={`rounded-xl p-3 mb-4 text-sm ${saved.ok ? 'bg-primary-soft text-primary-dark' : 'bg-rose-50 text-rose-700'}`}>
                    {saved.ok ? `Saved ${saved.saved} records.` : `Save failed: ${saved.error}`}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                {loading ? (
                    <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}</div>
                ) : students.length === 0 ? (
                    <div className="p-16 text-center text-sm text-gray-500">No pupils in this class yet.</div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {students.map(s => {
                            const cur = marks[s.id]?.status;
                            const isUnmarked = cur === null || cur === undefined;
                            return (
                                <li key={s.id} className={`flex flex-col md:flex-row md:items-center gap-3 p-4 transition ${isUnmarked ? 'bg-gray-50/60 opacity-75' : 'hover:bg-primary-soft/20'}`}>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${isUnmarked ? 'bg-gray-100 text-gray-400' : 'bg-primary-soft text-primary-dark'}`}>
                                            {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-ink truncate flex items-center gap-2">
                                                {s.full_name}
                                                {yesterdayMarks[s.id] === 'absent' && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Absent yest.</span>
                                                )}
                                                {yesterdayMarks[s.id] === 'late' && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Late yest.</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">{s.admission_no}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {STATUS_OPTIONS.map(opt => (
                                            <button key={opt.code} onClick={() => setStatus(s.id, opt.code)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                                    cur === opt.code ? opt.color + ' shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                }`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                        {!marks[s.id]?._fromRoster && (
                                            <button onClick={() => removeStudent(s.id)}
                                                className="text-[10px] font-semibold text-gray-400 hover:text-rose-600 transition ml-1">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    {cur && cur !== 'present' && (
                                        <input placeholder="note (optional)" value={marks[s.id]?.note || ''} onChange={e => setNote(s.id, e.target.value)}
                                               className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary w-full md:w-44" />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Sticky bottom save bar — visible on mobile */}
            {students.length > 0 && (
                <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-lg">
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">{students.length} pupils · {rate}% rate</div>
                        <div className="text-xs text-ink font-medium">
                            {dirty ? 'Unsaved changes' : (saved?.ok ? `Saved ${saved.saved} records` : 'All up to date')}
                        </div>
                    </div>
                    <Button size="sm" onClick={save} disabled={saving || !students.length}>
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            )}
            {students.length > 0 && <div className="md:hidden h-20" aria-hidden />}

            {showAddStudent && (
                <AddStudentModal
                    open={showAddStudent}
                    onClose={() => setShowAddStudent(false)}
                    classId={classLevel.id}
                    date={date}
                    existingIds={students.map(s => s.id)}
                    onAdded={(student) => {
                        setStudents(prev => [...prev, student]);
                        setMarks(prev => ({ ...prev, [student.id]: { status: 'present', note: '', _fromRoster: false } }));
                        setDirty(true);
                        setShowAddStudent(false);
                    }}
                />
            )}
        </>
    );
};

const AddStudentModal = ({ open, onClose, classId, date, existingIds, onAdded }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [marking, setMarking] = useState(null);

    const search = async (q) => {
        setQuery(q);
        if (q.length < 2) { setResults([]); return; }
        setSearching(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/academics/students/`, {
                params: { search: q, status: 'active' },
            });
            setResults((Array.isArray(data) ? data : data.results || []).filter(s => !existingIds.includes(s.id)));
        } catch { setResults([]); }
        finally { setSearching(false); }
    };

    const addStudent = async (student) => {
        setMarking(student.id);
        try {
            await axios.post(`${API_URL}/api/academics/attendance/single/`, {
                class_level: Number(classId),
                student: student.id,
                date,
                status: 'present',
            });
            onAdded(student);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add student.');
        } finally {
            setMarking(null);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Add student to attendance" size="md"
               footer={[<Button key="close" variant="outline" size="sm" onClick={onClose}>Close</Button>]}>
            <p className="text-sm text-gray-500 mb-4">Search for a student by name or admission number to add them to today's attendance.</p>
            <Input value={query} onChange={e => search(e.target.value)} placeholder="Search student name or admission no…" autoFocus />
            {searching && <div className="mt-3 text-xs text-gray-400">Searching…</div>}
            {results.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {results.map(s => (
                        <li key={s.id} className="flex items-center justify-between py-2.5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-[10px]">
                                    {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-ink">{s.full_name}</div>
                                    <div className="text-[11px] text-gray-400 font-mono">{s.admission_no} · {s.class_name}</div>
                                </div>
                            </div>
                            <button onClick={() => addStudent(s)} disabled={marking === s.id}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50">
                                {marking === s.id ? 'Adding…' : 'Add'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {query.length >= 2 && !searching && results.length === 0 && (
                <div className="mt-4 text-sm text-gray-500 text-center">No students found.</div>
            )}
        </Modal>
    );
};

const Tile = ({ label, value, tone = 'bg-white border border-gray-100', accent = 'text-ink', whiteLabel = false }) => (
    <div className={`rounded-xl p-4 ${tone}`}>
        <div className={`text-xs font-semibold ${whiteLabel ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
        <div className={`text-2xl font-black mt-1 ${accent}`}>{value}</div>
    </div>
);

export default TeacherAttendance;
