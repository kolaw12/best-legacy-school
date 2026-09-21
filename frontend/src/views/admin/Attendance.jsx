import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Select, Input } from '../../components/ui/Field';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';
import { exportCsv } from '../../utils/exportCsv';

const STATUS_OPTIONS = [
    { code: 'present', label: 'Present', tone: 'mint',    color: 'bg-primary text-white' },
    { code: 'absent',  label: 'Absent',  tone: 'warm',    color: 'bg-secondary text-ink' },
    { code: 'late',    label: 'Late',    tone: 'neutral', color: 'bg-amber-400 text-white' },
    { code: 'excused', label: 'Excused', tone: 'neutral', color: 'bg-gray-300 text-ink' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const today = () => new Date().toISOString().slice(0, 10);

/** Get Monday of the week containing a date string */
const getMonday = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
};

/** Generate Mon–Sun dates for a week starting at `monday` */
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

const AttendancePage = () => {
    const [classes, setClasses] = useState([]);
    const [classId, setClassId] = useState('');
    const [date, setDate] = useState(today());
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(null);
    const [markedDates, setMarkedDates] = useState([]);
    const [weekStart, setWeekStart] = useState(() => getMonday(today()));
    const [showAddStudent, setShowAddStudent] = useState(false);

    useEffect(() => {
        adminApi.classes().then(r => {
            const data = r.data || [];
            setClasses(data);
            if (data.length && !classId) setClassId(String(data[0].id));
        });
    }, []);

    // Fetch marked dates when class changes
    useEffect(() => {
        if (!classId) return;
        axios.get(`${API_URL}/api/academics/attendance/marked-dates/`, { params: { class_level: classId } })
            .then(r => setMarkedDates(r.data || []))
            .catch(() => setMarkedDates([]));
    }, [classId]);

    const load = useCallback(() => {
        if (!classId) return;
        setLoading(true);
        setSaved(null);
        Promise.all([
            adminApi.students({ class_level: classId, status: 'active' }),
            axios.get(`${API_URL}/api/academics/attendance/`, { params: { class_level: classId, date } }),
        ])
            .then(([sRes, aRes]) => {
                const roster = sRes.data || [];
                const existing = aRes.data || [];
                const map = {};
                roster.forEach(s => {
                    const found = existing.find(r => r.student === s.id);
                    map[s.id] = {
                        status: found?.status || 'present',
                        note: found?.note || '',
                        _fromRoster: true,
                    };
                });
                setStudents(roster);
                setMarks(map);
            })
            .finally(() => setLoading(false));
    }, [classId, date]);

    useEffect(load, [load]);

    // Sync week view when date changes
    useEffect(() => {
        const newMonday = getMonday(date);
        setWeekStart(prev => prev === newMonday ? prev : newMonday);
    }, [date]);

    const setStatus = (studentId, status) => {
        setMarks(m => ({ ...m, [studentId]: { ...(m[studentId] || {}), status } }));
    };
    const setNote = (studentId, note) => {
        setMarks(m => ({ ...m, [studentId]: { ...(m[studentId] || {}), note } }));
    };
    const removeStudent = (studentId) => {
        setStudents(s => s.filter(st => st.id !== studentId));
        setMarks(m => {
            const next = { ...m };
            delete next[studentId];
            return next;
        });
    };
    const setAllTo = (status) => {
        const fresh = {};
        students.forEach(s => { fresh[s.id] = { status, note: marks[s.id]?.note || '' }; });
        setMarks(fresh);
    };

    const save = async () => {
        setSaving(true);
        setSaved(null);
        try {
            const payload = {
                class_level: Number(classId),
                date,
                records: students.map(s => ({
                    student: s.id,
                    status: marks[s.id]?.status || 'present',
                    note: marks[s.id]?.note || '',
                })),
            };
            const { data } = await axios.post(`${API_URL}/api/academics/attendance/bulk/`, payload);
            setSaved({ ok: true, ...data });
            axios.get(`${API_URL}/api/academics/attendance/marked-dates/`, { params: { class_level: classId } })
                .then(r => setMarkedDates(r.data || []));
        } catch (e) {
            setSaved({ ok: false, error: e.response?.data?.error || e.message });
        } finally {
            setSaving(false);
        }
    };

    const counts = useMemo(() => {
        const c = { present: 0, absent: 0, late: 0, excused: 0 };
        Object.values(marks).forEach(m => { c[m.status] = (c[m.status] || 0) + 1; });
        return c;
    }, [marks]);

    const total = students.length;
    const rate = total ? Math.round(((counts.present + counts.late) / total) * 100) : 0;

    return (
        <>
            <AdminPageHeader
                title="Attendance"
                subtitle="Mark attendance for any class on any date. Saved records overwrite previous entries for the same day."
                actions={[
                    <button key="export" onClick={() => exportCsv(students.map(s => ({
                        name: s.full_name,
                        admission_no: s.admission_no,
                        status: marks[s.id]?.status || 'unmarked',
                        note: marks[s.id]?.note || '',
                    })), [
                        { key: 'name', label: 'Student' },
                        { key: 'admission_no', label: 'Admission No' },
                        { key: 'status', label: 'Status' },
                        { key: 'note', label: 'Note' },
                    ], `attendance-${date}`)}
                        className="text-xs font-semibold px-3 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition inline-flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>,
                    <Button key="save" size="sm" onClick={save} disabled={saving || !students.length}>
                        {saving ? 'Saving…' : 'Save attendance'}
                    </Button>,
                ]}
            />

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                <div className="grid md:grid-cols-4 gap-3 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Class</label>
                        <Select value={classId} onChange={e => setClassId(e.target.value)}>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="md:col-span-2 flex items-end gap-2 justify-end">
                        <button onClick={() => setAllTo('present')} className="text-xs font-semibold px-3 py-2 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition">
                            Mark all present
                        </button>
                        <button onClick={() => setAllTo('absent')} className="text-xs font-semibold px-3 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                            Mark all absent
                        </button>
                    </div>
                </div>

                {/* Week calendar */}
                <WeekCalendar
                    date={date}
                    setDate={setDate}
                    markedDates={markedDates}
                    weekStart={weekStart}
                    setWeekStart={setWeekStart}
                />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <SummaryTile label="Roster" value={total} tone="bg-white border border-gray-100" />
                <SummaryTile label="Present" value={counts.present} tone="bg-primary-soft" accent="text-primary-dark" />
                <SummaryTile label="Absent" value={counts.absent} tone="bg-secondary-soft" accent="text-secondary-dark" />
                <SummaryTile label="Late" value={counts.late} tone="bg-amber-50" accent="text-amber-700" />
                <SummaryTile label="Attendance Rate" value={`${rate}%`} tone="bg-ink" accent="text-white" whiteLabel />
            </div>

            {saved && (
                <div className={`rounded-xl p-3 mb-4 text-sm ${saved.ok ? 'bg-primary-soft text-primary-dark' : 'bg-rose-50 text-rose-700'}`}>
                    {saved.ok ? `Saved ${saved.saved} records for ${saved.class_level} on ${saved.date}.` : `Save failed: ${saved.error}`}
                </div>
            )}

            {/* Add student button */}
            <div className="mb-3">
                <button
                    onClick={() => setShowAddStudent(true)}
                    className="text-xs font-semibold px-3 py-2 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition inline-flex items-center gap-1.5"
                >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Add student
                </button>
            </div>

            {/* Roster */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
                    </div>
                ) : students.length === 0 ? (
                    <div className="p-16 text-center text-sm text-gray-500">No active students in this class.</div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {students.map(s => {
                            const cur = marks[s.id]?.status || 'present';
                            return (
                                <li key={s.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-primary-soft/20 transition">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs shrink-0">
                                            {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-ink truncate">{s.full_name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{s.admission_no}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {STATUS_OPTIONS.map(opt => (
                                            <button
                                                key={opt.code}
                                                onClick={() => setStatus(s.id, opt.code)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                                    cur === opt.code
                                                        ? opt.color + ' shadow-sm'
                                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                        {!marks[s.id]?._fromRoster && (
                                            <button
                                                onClick={() => removeStudent(s.id)}
                                                className="text-[10px] font-semibold text-gray-400 hover:text-rose-600 transition ml-1"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    {(cur === 'absent' || cur === 'late' || cur === 'excused') && (
                                        <input
                                            placeholder="note (optional)"
                                            value={marks[s.id]?.note || ''}
                                            onChange={e => setNote(s.id, e.target.value)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary w-full md:w-48"
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Add student modal */}
            {showAddStudent && (
                <AddStudentModal
                    open={showAddStudent}
                    onClose={() => setShowAddStudent(false)}
                    classId={classId}
                    date={date}
                    existingIds={students.map(s => s.id)}
                    onAdded={(student) => {
                        setStudents(prev => [...prev, student]);
                        setMarks(prev => ({ ...prev, [student.id]: { status: 'present', note: '', _fromRoster: false } }));
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
    const [marking, setMarking] = useState(null); // studentId being added

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
            <Input
                value={query}
                onChange={e => search(e.target.value)}
                placeholder="Search student name or admission no…"
                autoFocus
            />
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
                            <button
                                onClick={() => addStudent(s)}
                                disabled={marking === s.id}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50"
                            >
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

const SummaryTile = ({ label, value, tone = 'bg-white', accent = 'text-ink', whiteLabel = false }) => (
    <div className={`rounded-xl p-4 ${tone}`}>
        <div className={`text-xs font-semibold ${whiteLabel ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
        <div className={`text-2xl font-black mt-1 ${accent}`}>{value}</div>
    </div>
);

export default AttendancePage;
