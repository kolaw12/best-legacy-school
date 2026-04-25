import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Reveal from '../../components/ui/Reveal';
import API_URL from '../../config/api';

const naira = (v) => `₦${Number(v || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const TABS = [
    { id: 'overview',    label: 'Overview' },
    { id: 'report',      label: 'Report card' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'fees',        label: 'Fees' },
    { id: 'wellbeing',   label: 'Wellbeing' },
    { id: 'safety',      label: 'Safety & pickup' },
];

const Child = () => {
    const { childId } = useParams();
    const [child, setChild] = useState(null);
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [pickups, setPickups] = useState([]);
    const [healthLogs, setHealthLogs] = useState([]);
    const [behaviour, setBehaviour] = useState([]);
    const [badges, setBadges] = useState([]);

    const reloadPickups = () =>
        axios.get(`${API_URL}/api/academics/pickup-auths/?student=${childId}`)
            .then(r => setPickups(r.data || []));

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API_URL}/api/academics/students/${childId}/`),
            axios.get(`${API_URL}/api/academics/report-card/${childId}/`),
            axios.get(`${API_URL}/api/assignments/`),
            axios.get(`${API_URL}/api/submissions/?student=${childId}`),
            axios.get(`${API_URL}/api/finance/invoices/?student=${childId}`),
            axios.get(`${API_URL}/api/academics/attendance/?student=${childId}`),
            axios.get(`${API_URL}/api/academics/pickup-auths/?student=${childId}`),
            axios.get(`${API_URL}/api/wellbeing/health-logs/?student=${childId}`).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/api/wellbeing/behaviour-entries/?student=${childId}`).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/api/wellbeing/badges/?student=${childId}`).catch(() => ({ data: [] })),
        ])
            .then(([s, rc, a, sub, inv, att, pk, hl, bh, bd]) => {
                setChild(s.data);
                setReport(rc.data);
                setAssignments((a.data || []).filter(x => x.class_level === s.data.class_level));
                setSubmissions(sub.data || []);
                setInvoices(inv.data || []);
                setAttendance(att.data || []);
                setPickups(pk.data || []);
                setHealthLogs(hl.data || []);
                setBehaviour(bh.data || []);
                setBadges(bd.data || []);
            })
            .finally(() => setLoading(false));
    }, [childId]);

    const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = attendance.length ? Math.round((presentDays / attendance.length) * 100) : null;

    if (loading || !child) {
        return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
    }

    return (
        <>
            <Reveal>
                <header className="bg-white rounded-3xl shadow-card p-6 md:p-8 mb-6 flex items-center gap-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center font-black text-2xl">
                        {(child.first_name?.[0] || '') + (child.last_name?.[0] || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Badge tone={child.class_section === 'nursery' ? 'warm' : 'mint'}>{child.class_name}</Badge>
                        <h1 className="mt-2 text-2xl md:text-3xl font-black text-primary truncate">{child.full_name}</h1>
                        <div className="text-xs text-gray-500 font-mono">{child.admission_no} · {child.gender === 'M' ? 'Boy' : 'Girl'}</div>
                    </div>
                    <div className="hidden md:block">
                        <Link to="/parent/dashboard" className="text-sm text-gray-500 hover:text-primary">← All children</Link>
                    </div>
                </header>
            </Reveal>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition ${
                            tab === t.id ? 'text-primary' : 'text-gray-500 hover:text-ink'
                        }`}
                    >
                        {t.label}
                        {tab === t.id && (
                            <motion.span layoutId="parent-tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"/>
                        )}
                    </button>
                ))}
            </div>

            {tab === 'overview' && (
                <Reveal>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <Tile label="Term" value={report?.term?.name || '—'} hint={report?.term?.session} />
                        <Tile label="Days marked" value={attendance.length} hint={`${presentDays} present`} tone="bg-mint" />
                        <Tile label="Attendance" value={attendanceRate != null ? `${attendanceRate}%` : '—'} hint="this term" tone="bg-secondary-soft" />
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                        <h3 className="font-bold text-ink mb-4">Recent attendance</h3>
                        {attendance.length === 0 ? (
                            <p className="text-sm text-gray-400">No attendance yet — your child's class teacher will start marking from the first day.</p>
                        ) : (
                            <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                {attendance.slice(0, 14).map(a => (
                                    <li key={a.id} className={`p-2 rounded-xl text-center text-xs ${
                                        a.status === 'present' ? 'bg-primary-soft text-primary-dark' :
                                        a.status === 'absent' ? 'bg-rose-50 text-rose-700' :
                                        a.status === 'late' ? 'bg-amber-50 text-amber-700' :
                                        'bg-gray-50 text-gray-600'
                                    }`}>
                                        <div className="font-bold">{new Date(a.date).getDate()}</div>
                                        <div className="text-[10px] uppercase">{a.status}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Reveal>
            )}

            {tab === 'report' && (
                <Reveal>
                    <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
                        {report?.is_nursery ? (
                            <NurseryReport data={report} />
                        ) : (
                            <BasicReport data={report} />
                        )}
                        <div className="mt-6 flex justify-end">
                            <Link to={`/admin/report-cards/${child.id}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline">
                                Open printable view →
                            </Link>
                        </div>
                    </div>
                </Reveal>
            )}

            {tab === 'assignments' && (
                <Reveal>
                    <Assignments assignments={assignments} submissions={submissions} child={child} onSaved={(s) => setSubmissions(prev => [...prev.filter(x => x.id !== s.id), s])} />
                </Reveal>
            )}

            {tab === 'fees' && (
                <Reveal>
                    <ChildFees invoices={invoices} child={child} />
                </Reveal>
            )}

            {tab === 'wellbeing' && (
                <Reveal>
                    <Wellbeing health={healthLogs} behaviour={behaviour} badges={badges} child={child} />
                </Reveal>
            )}

            {tab === 'safety' && (
                <Reveal>
                    <SafetyAndPickup child={child} pickups={pickups} onReload={reloadPickups} />
                </Reveal>
            )}
        </>
    );
};

const Tile = ({ label, value, hint, tone = 'bg-white border border-gray-100' }) => (
    <div className={`rounded-2xl p-5 ${tone}`}>
        <div className="text-xs font-semibold text-gray-500">{label}</div>
        <div className="text-2xl font-black text-ink mt-1">{value}</div>
        {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
);

const BasicReport = ({ data }) => {
    if (!data?.grades?.length) {
        return <p className="text-sm text-gray-400 text-center py-8">No grades entered for this term yet — check back after CA1.</p>;
    }
    return (
        <>
            <h3 className="font-bold text-ink mb-1">Academic results</h3>
            <p className="text-xs text-gray-500 mb-4">{data.term.name} Term — {data.term.session}</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            <th className="text-left py-2">Subject</th>
                            <th className="text-center py-2 w-16">CA1</th>
                            <th className="text-center py-2 w-16">CA2</th>
                            <th className="text-center py-2 w-16">Exam</th>
                            <th className="text-center py-2 w-16">Total</th>
                            <th className="text-center py-2 w-14">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.grades.map((g, i) => (
                            <tr key={i} className="border-b border-gray-50">
                                <td className="py-2.5 font-medium text-ink">{g.subject}</td>
                                <td className="py-2.5 text-center tabular-nums">{g.ca1}</td>
                                <td className="py-2.5 text-center tabular-nums">{g.ca2}</td>
                                <td className="py-2.5 text-center tabular-nums">{g.exam}</td>
                                <td className="py-2.5 text-center font-bold">{g.total}</td>
                                <td className="py-2.5 text-center"><Badge tone={['A','B'].includes(g.grade) ? 'mint' : 'warm'}>{g.grade}</Badge></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.summary && (
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <Tile label="Subjects" value={data.summary.subjects} />
                    <Tile label="Total" value={data.summary.overall_total} />
                    <Tile label="Average" value={data.summary.average != null ? `${data.summary.average}/100` : '—'} />
                </div>
            )}
        </>
    );
};

const NurseryReport = ({ data }) => (
    <>
        <h3 className="font-bold text-ink mb-1">Developmental assessment</h3>
        <p className="text-xs text-gray-500 mb-4">{data.term.name} Term — {data.term.session}</p>
        {!data.assessments?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No assessments entered for this term yet.</p>
        ) : (
            <ul className="divide-y divide-gray-100">
                {data.assessments.map((a, i) => (
                    <li key={i} className="py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-ink">{a.domain}</div>
                            {a.remark && <div className="text-xs text-gray-500 mt-0.5">{a.remark}</div>}
                        </div>
                        <Badge tone="mint">{a.rating_display}</Badge>
                    </li>
                ))}
            </ul>
        )}
    </>
);

const Assignments = ({ assignments, submissions, child, onSaved }) => {
    const [active, setActive] = useState(null);
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);

    const submissionFor = (a) => submissions.find(s => s.assignment === a.id);

    const submit = async () => {
        if (!active) return;
        setSaving(true);
        try {
            const existing = submissionFor(active);
            if (existing) {
                const { data } = await axios.patch(`${API_URL}/api/submissions/${existing.id}/`, { text });
                onSaved(data);
            } else {
                const { data } = await axios.post(`${API_URL}/api/submissions/`, {
                    assignment: active.id, student: child.id, text,
                });
                onSaved(data);
            }
            setActive(null);
            setText('');
        } catch (e) {
            alert(`Could not submit: ${e.response?.data?.detail || e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!assignments.length) {
        return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No open assignments for {child.class_name} this term.</div>;
    }

    return (
        <>
            <ul className="space-y-3">
                {assignments.map(a => {
                    const sub = submissionFor(a);
                    return (
                        <motion.li
                            key={a.id}
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-card p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500">{a.subject_name || 'Class activity'} · Due {fmtDate(a.due_date)}</div>
                                    <h4 className="mt-1 font-bold text-ink">{a.title}</h4>
                                    {a.description && <p className="mt-2 text-sm text-gray-600 leading-relaxed">{a.description}</p>}
                                </div>
                                {sub?.status === 'graded' ? (
                                    <Badge tone="mint">Graded · {sub.score}/{a.max_score}</Badge>
                                ) : sub ? (
                                    <Badge tone="neutral">Submitted</Badge>
                                ) : (
                                    <Badge tone="warm">Not submitted</Badge>
                                )}
                            </div>

                            {sub?.feedback && (
                                <div className="mt-4 rounded-xl bg-mint p-3 text-sm text-primary-dark">
                                    <div className="text-xs font-bold uppercase tracking-widest mb-1">Teacher's note</div>
                                    {sub.feedback}
                                </div>
                            )}

                            {sub?.status !== 'graded' && (
                                <button
                                    onClick={() => { setActive(a); setText(sub?.text || ''); }}
                                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                                >
                                    {sub ? 'Update submission →' : 'Submit work →'}
                                </button>
                            )}
                        </motion.li>
                    );
                })}
            </ul>

            {active && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActive(null)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-card-lg"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="font-black text-ink text-lg">{active.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">Note what was done at home, or paste a brief response.</p>
                        <textarea
                            rows={5} value={text} onChange={e => setText(e.target.value)}
                            placeholder="e.g. Completed the alphabet practice three times in the new exercise book…"
                            className="mt-4 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                        />
                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={() => setActive(null)} className="text-sm font-semibold px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-gray-300">Cancel</button>
                            <Button onClick={submit} size="sm" disabled={saving}>{saving ? 'Submitting…' : 'Submit'}</Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
};

const ChildFees = ({ invoices, child }) => {
    if (!invoices.length) {
        return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No invoices for {child.first_name} yet.</div>;
    }

    return (
        <ul className="space-y-3">
            {invoices.map(i => (
                <motion.li
                    key={i.id}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-card p-5"
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-mono text-gray-400">{i.invoice_no}</div>
                            <div className="font-bold text-ink mt-0.5">{i.fee_name}</div>
                            <div className="text-xs text-gray-500">{i.term_label} · issued {fmtDate(i.issued_on)}</div>
                        </div>
                        <div className="text-right md:text-left">
                            <div className="text-xs text-gray-500">Balance</div>
                            <div className={`font-black ${Number(i.balance) > 0 ? 'text-secondary' : 'text-primary'}`}>{naira(i.balance)}</div>
                        </div>
                        <div>
                            {i.status === 'paid' ? (
                                <Badge tone="mint">Paid in full</Badge>
                            ) : (
                                <Link to="/parent/fees" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-ink font-semibold text-sm hover:bg-secondary-dark transition">
                                    Pay
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                                </Link>
                            )}
                        </div>
                    </div>
                    {i.payments?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-2">Receipts</div>
                            <ul className="flex flex-wrap gap-2">
                                {i.payments.map(p => (
                                    <li key={p.id}>
                                        <a href={`${API_URL}/api/finance/payments/${p.id}/receipt/`} target="_blank" rel="noreferrer"
                                           className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition">
                                            <span className="font-mono">{p.receipt_no}</span>
                                            <span className="opacity-70">· {naira(p.amount)}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </motion.li>
            ))}
        </ul>
    );
};

const Wellbeing = ({ health, behaviour, badges, child }) => {
    const merits = behaviour.filter(b => b.kind === 'merit');
    const demerits = behaviour.filter(b => b.kind === 'demerit');
    const meritPoints = merits.reduce((acc, b) => acc + (b.points || 0), 0);

    return (
        <div className="space-y-6">
            {/* Skills passport */}
            <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-black text-ink">Skills passport</h3>
                        <p className="text-xs text-gray-500">{child.first_name}'s badges so far</p>
                    </div>
                    <Badge tone="mint">{badges.length} badges</Badge>
                </div>
                {badges.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No badges yet — they're coming!</p>
                ) : (
                    <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {badges.map(b => (
                            <li key={b.id} className="bg-primary-soft rounded-2xl p-3 text-center">
                                <div className="text-3xl mb-1">{b.icon || '🏅'}</div>
                                <div className="text-[10px] font-bold text-primary-dark uppercase tracking-widest leading-tight">{b.label}</div>
                                <div className="text-[9px] text-gray-500 mt-1">{fmtDate(b.awarded_on)}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Behaviour log */}
            <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                        <h3 className="font-black text-ink">Behaviour log</h3>
                        <p className="text-xs text-gray-500">Merits and gentle corrections from teachers</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge tone="mint">+{meritPoints} merit pts</Badge>
                        <Badge tone={demerits.length ? 'warm' : 'neutral'}>{demerits.length} demerit{demerits.length === 1 ? '' : 's'}</Badge>
                    </div>
                </div>
                {behaviour.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nothing logged yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {behaviour.slice(0, 20).map(b => (
                            <li key={b.id} className="py-3 flex items-start gap-3">
                                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                                    b.kind === 'merit' ? 'bg-emerald-50 text-emerald-700'
                                  : b.kind === 'demerit' ? 'bg-rose-50 text-rose-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {b.kind === 'merit' ? '★' : b.kind === 'demerit' ? '⚠' : '·'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-ink text-sm">{b.title}</span>
                                        <Badge tone={b.kind === 'merit' ? 'mint' : b.kind === 'demerit' ? 'warm' : 'neutral'}>
                                            {b.kind_label}
                                        </Badge>
                                    </div>
                                    {b.detail && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{b.detail}</p>}
                                    <div className="text-[11px] text-gray-400 mt-1">
                                        {b.teacher_name || 'Class teacher'} · {fmtDate(b.created_at)}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Health / sickbay */}
            <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-black text-ink">Sickbay visits</h3>
                        <p className="text-xs text-gray-500">Anything logged by the school nurse</p>
                    </div>
                    <Badge tone={health.length ? 'warm' : 'mint'}>{health.length} visit{health.length === 1 ? '' : 's'}</Badge>
                </div>
                {health.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No sickbay visits — healthy term so far.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {health.map(h => (
                            <li key={h.id} className="py-3">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-semibold text-ink text-sm">{h.complaint}</span>
                                    <Badge tone={
                                        h.severity === 'serious' ? 'warm' :
                                        h.severity === 'moderate' ? 'neutral' : 'mint'
                                    }>{h.severity_label}</Badge>
                                    {h.sent_home && <Badge tone="warm">Sent home</Badge>}
                                </div>
                                {h.action_taken && <p className="text-xs text-gray-600">Action: {h.action_taken}</p>}
                                {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                                <div className="text-[11px] text-gray-400 mt-1">
                                    {new Date(h.visited_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    {h.nurse_name && ` · ${h.nurse_name}`}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};


const RELATIONSHIPS = [
    { value: 'parent',        label: 'Parent' },
    { value: 'guardian',      label: 'Guardian' },
    { value: 'relative',      label: 'Relative' },
    { value: 'driver',        label: 'Driver' },
    { value: 'nanny',         label: 'Nanny / minder' },
    { value: 'family_friend', label: 'Family friend' },
    { value: 'other',         label: 'Other' },
];

const SafetyAndPickup = ({ child, pickups, onReload }) => {
    const hasNotes = !!(child.allergies?.trim() || child.medical_notes?.trim() || child.dietary_notes?.trim());
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', relationship: 'parent', phone: '', id_note: '', valid_until: '', note: '' });
    const [saving, setSaving] = useState(false);

    const addPickup = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            await axios.post(`${API_URL}/api/academics/pickup-auths/`, {
                ...form,
                student: child.id,
                valid_until: form.valid_until || null,
            });
            setForm({ name: '', relationship: 'parent', phone: '', id_note: '', valid_until: '', note: '' });
            setAdding(false);
            await onReload();
        } catch (e) {
            alert(`Could not save: ${e.response?.data?.detail || e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const deactivate = async (id) => {
        if (!confirm('Remove this person from the pickup list?')) return;
        try {
            await axios.patch(`${API_URL}/api/academics/pickup-auths/${id}/`, { is_active: false });
            await onReload();
        } catch (e) {
            alert(`Could not remove: ${e.message}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Safety notes */}
            <div className={`rounded-3xl shadow-card p-6 md:p-8 ${hasNotes ? 'bg-amber-50 border border-amber-200' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasNotes ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z"/></svg>
                    </div>
                    <div>
                        <h3 className="font-black text-ink">Safety & dietary notes</h3>
                        <p className="text-xs text-gray-500">What our kitchen, nurse, and class teacher must know</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <NotePanel label="Allergies"     value={child.allergies}     emptyText="None recorded" tone="rose" />
                    <NotePanel label="Medical notes" value={child.medical_notes} emptyText="None recorded" tone="indigo" />
                    <NotePanel label="Dietary"       value={child.dietary_notes} emptyText="No restrictions noted" tone="emerald" />
                </div>
                <p className="text-xs text-gray-500 mt-4">
                    To update these, please call the office or send a message — the school nurse needs to log the change.
                </p>
            </div>

            {/* Pickup authorisations */}
            <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
                <div className="flex items-center justify-between mb-4 gap-3">
                    <div>
                        <h3 className="font-black text-ink">Pickup authorisations</h3>
                        <p className="text-xs text-gray-500">People allowed to collect {child.first_name} from school</p>
                    </div>
                    {!adding && (
                        <Button size="sm" onClick={() => setAdding(true)}>+ Authorise someone</Button>
                    )}
                </div>

                {adding && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-2xl p-4 mb-4 grid md:grid-cols-2 gap-3"
                    >
                        <Input label="Full name"      value={form.name}        onChange={v => setForm(f => ({ ...f, name: v }))} required />
                        <SelectInput label="Relationship" value={form.relationship} onChange={v => setForm(f => ({ ...f, relationship: v }))} options={RELATIONSHIPS} />
                        <Input label="Phone"          value={form.phone}       onChange={v => setForm(f => ({ ...f, phone: v }))} />
                        <Input label="ID hint"        value={form.id_note}     onChange={v => setForm(f => ({ ...f, id_note: v }))} placeholder="e.g. NIN ending 4421" />
                        <Input label="Valid until"    type="date" value={form.valid_until} onChange={v => setForm(f => ({ ...f, valid_until: v }))} />
                        <Input label="Note"           value={form.note}        onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="e.g. uncle from Lekki" />
                        <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                            <button onClick={() => setAdding(false)} className="text-sm font-semibold px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-gray-300">Cancel</button>
                            <Button onClick={addPickup} size="sm" disabled={saving || !form.name.trim()}>
                                {saving ? 'Saving…' : 'Add to list'}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {pickups.filter(p => p.is_active).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                        No-one authorised yet. Add at least one pickup person before the next school day.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {pickups.filter(p => p.is_active).map(p => (
                            <li key={p.id} className="py-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-sm">
                                    {p.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-ink truncate">{p.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {p.relationship_label}{p.phone ? ` · ${p.phone}` : ''}{p.id_note ? ` · ${p.id_note}` : ''}
                                    </div>
                                    {(p.valid_until || p.note) && (
                                        <div className="text-[11px] text-gray-400 mt-0.5">
                                            {p.valid_until && `Until ${fmtDate(p.valid_until)}`}{p.valid_until && p.note ? ' · ' : ''}{p.note}
                                        </div>
                                    )}
                                </div>
                                {p.valid_today ? (
                                    <Badge tone="mint">OK today</Badge>
                                ) : (
                                    <Badge tone="warm">Expired</Badge>
                                )}
                                <button onClick={() => deactivate(p.id)} className="text-xs font-semibold text-rose-600 hover:underline ml-2">
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const NotePanel = ({ label, value, emptyText, tone }) => {
    const filled = !!value?.trim();
    const tones = {
        rose:    'bg-rose-50 border-rose-200 text-rose-900',
        indigo:  'bg-indigo-50 border-indigo-200 text-indigo-900',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    };
    return (
        <div className={`rounded-2xl p-4 border ${filled ? tones[tone] : 'bg-white border-gray-100'}`}>
            <div className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${filled ? 'opacity-80' : 'text-gray-500'}`}>{label}</div>
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${filled ? 'font-medium' : 'text-gray-400 italic'}`}>
                {filled ? value : emptyText}
            </div>
        </div>
    );
};

const Input = ({ label, value, onChange, type = 'text', required, placeholder }) => (
    <label className="block">
        <span className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
    </label>
);

const SelectInput = ({ label, value, onChange, options }) => (
    <label className="block">
        <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </label>
);

export default Child;
