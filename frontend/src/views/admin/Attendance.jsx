import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminPageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/Field';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';

const STATUS_OPTIONS = [
    { code: 'present', label: 'Present', tone: 'mint',    color: 'bg-primary text-white' },
    { code: 'absent',  label: 'Absent',  tone: 'warm',    color: 'bg-secondary text-ink' },
    { code: 'late',    label: 'Late',    tone: 'neutral', color: 'bg-amber-400 text-white' },
    { code: 'excused', label: 'Excused', tone: 'neutral', color: 'bg-gray-300 text-ink' },
];

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
    const [classes, setClasses] = useState([]);
    const [classId, setClassId] = useState('');
    const [date, setDate] = useState(today());
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({}); // studentId -> { status, note }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(null);

    useEffect(() => {
        adminApi.classes().then(r => {
            const data = r.data || [];
            setClasses(data);
            if (data.length && !classId) setClassId(String(data[0].id));
        });
    }, []);

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
                    };
                });
                setStudents(roster);
                setMarks(map);
            })
            .finally(() => setLoading(false));
    }, [classId, date]);

    useEffect(load, [load]);

    const setStatus = (studentId, status) => {
        setMarks(m => ({ ...m, [studentId]: { ...(m[studentId] || {}), status } }));
    };
    const setNote = (studentId, note) => {
        setMarks(m => ({ ...m, [studentId]: { ...(m[studentId] || {}), note } }));
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
                    <Button key="save" size="sm" onClick={save} disabled={saving || !students.length}>
                        {saving ? 'Saving…' : 'Save attendance'}
                    </Button>,
                ]}
            />

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 grid md:grid-cols-4 gap-3 items-end">
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
        </>
    );
};

const SummaryTile = ({ label, value, tone = 'bg-white', accent = 'text-ink', whiteLabel = false }) => (
    <div className={`rounded-xl p-4 ${tone}`}>
        <div className={`text-xs font-semibold ${whiteLabel ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
        <div className={`text-2xl font-black mt-1 ${accent}`}>{value}</div>
    </div>
);

export default AttendancePage;
