import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Reveal from './ui/Reveal';
import API_URL from '../config/api';
import { useAuth } from '../context/AuthContext';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
}) : '';

const Messaging = ({ title = 'Messages', allowNew = true }) => {
    const [threads, setThreads] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [composing, setComposing] = useState(false);

    const reload = () => axios.get(`${API_URL}/api/auth/threads/`).then(r => setThreads(r.data || []));

    useEffect(() => {
        setLoading(true);
        reload().finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!activeId) return;
        axios.get(`${API_URL}/api/auth/threads/${activeId}/messages/`)
            .then(r => setMessages(r.data || []));
    }, [activeId]);

    const active = threads.find(t => t.id === activeId);

    return (
        <>
            <Reveal>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <Badge tone="mint" dot>Direct messages</Badge>
                        <h1 className="mt-3 text-3xl md:text-4xl font-black text-primary">{title}</h1>
                        <p className="mt-1 text-sm text-gray-500">Talk directly with the people who teach and care for the children.</p>
                    </div>
                    {allowNew && (
                        <Button size="sm" onClick={() => setComposing(true)}>+ New conversation</Button>
                    )}
                </header>
            </Reveal>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Thread list */}
                <div className="lg:col-span-1 bg-white rounded-3xl shadow-card overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
                    ) : threads.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">
                            No conversations yet.
                            {allowNew && <div className="mt-2">Start one with the button above.</div>}
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 max-h-[640px] overflow-auto">
                            {threads.map(t => (
                                <li key={t.id}>
                                    <button
                                        onClick={() => setActiveId(t.id)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition ${activeId === t.id ? 'bg-primary-soft' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-semibold text-ink truncate text-sm">
                                                {t.subject || (t.student_name ? `About ${t.student_name}` : 'Conversation')}
                                            </div>
                                            {t.unread > 0 && (
                                                <span className="shrink-0 bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-5 h-5 flex items-center justify-center">{t.unread}</span>
                                            )}
                                        </div>
                                        {t.last_message && (
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                <span className="font-semibold">{t.last_message.author}:</span> {t.last_message.body}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-gray-400 mt-1">{fmtTime(t.last_message_at || t.created_at)}</div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Active thread */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-card flex flex-col h-[640px]">
                    {!active ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                            Pick a conversation, or start a new one.
                        </div>
                    ) : (
                        <ThreadView thread={active} messages={messages}
                                    onSent={() => {
                                        axios.get(`${API_URL}/api/auth/threads/${activeId}/messages/`)
                                            .then(r => setMessages(r.data || []));
                                        reload();
                                    }} />
                    )}
                </div>
            </div>

            {composing && (
                <ComposeModal onClose={() => setComposing(false)}
                              onCreated={(t) => { setComposing(false); reload(); setActiveId(t.id); }} />
            )}
        </>
    );
};


const ThreadView = ({ thread, messages, onSent }) => {
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const { profile } = useAuth();
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [messages.length]);

    const send = async () => {
        if (!body.trim()) return;
        setSending(true);
        try {
            await axios.post(`${API_URL}/api/auth/threads/${thread.id}/messages/`, { body });
            setBody('');
            onSent?.();
        } catch (e) {
            alert(`Could not send: ${e.response?.data?.error || e.message}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <div className="px-5 py-4 border-b border-gray-100">
                <div className="font-bold text-ink">
                    {thread.subject || (thread.student_name ? `About ${thread.student_name}` : 'Conversation')}
                </div>
                <div className="text-xs text-gray-500">
                    With: {thread.participant_names?.join(', ') || '—'}
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center pt-8">No messages yet — say hello below.</p>
                ) : messages.map(m => {
                    const mine = m.author === profile?.id;
                    return (
                        <motion.div key={m.id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className={`max-w-[80%] ${mine ? 'ml-auto' : ''}`}
                        >
                            <div className={`rounded-2xl px-4 py-2.5 ${mine ? 'bg-primary text-white' : 'bg-gray-100 text-ink'}`}>
                                {!mine && <div className="text-[11px] font-semibold opacity-70 mb-0.5">{m.author_name}</div>}
                                <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</div>
                            </div>
                            <div className={`text-[10px] text-gray-400 mt-0.5 ${mine ? 'text-right' : ''}`}>{fmtTime(m.sent_at)}</div>
                        </motion.div>
                    );
                })}
            </div>
            <div className="border-t border-gray-100 p-3 flex gap-2">
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
                    placeholder="Type a message… (Ctrl/Cmd + Enter to send)"
                    rows={2}
                    className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <Button onClick={send} size="sm" disabled={sending || !body.trim()}>
                    {sending ? 'Sending…' : 'Send'}
                </Button>
            </div>
        </>
    );
};


const ComposeModal = ({ onClose, onCreated }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [participants, setParticipants] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentId, setStudentId] = useState('');
    const [saving, setSaving] = useState(false);
    const { profile } = useAuth();

    useEffect(() => {
        // Load suitable contacts. For parents, that's typically teachers; for teachers, parents.
        axios.get(`${API_URL}/api/academics/teachers/`).then(r => setAllUsers(r.data || []));
        if (profile?.role === 'parent') {
            axios.get(`${API_URL}/api/auth/me/children/`).then(r => setStudents(r.data || []));
        }
    }, [profile?.role]);

    const create = async () => {
        if (!body.trim()) return;
        setSaving(true);
        try {
            const { data: thread } = await axios.post(`${API_URL}/api/auth/threads/`, {
                subject,
                student: studentId || null,
                participants: participants,
            });
            await axios.post(`${API_URL}/api/auth/threads/${thread.id}/messages/`, { body });
            onCreated?.(thread);
        } catch (e) {
            alert(`Could not start conversation: ${e.response?.data?.error || e.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-card-lg" onClick={e => e.stopPropagation()}>
                <h3 className="font-black text-ink text-lg mb-4">Start a new conversation</h3>
                <div className="space-y-3">
                    <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Subject (optional)"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                    {students.length > 0 && (
                        <select value={studentId} onChange={e => setStudentId(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                            <option value="">— choose which child this is about (optional) —</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                        </select>
                    )}
                    <select multiple value={participants} onChange={e => setParticipants(
                            Array.from(e.target.selectedOptions).map(o => Number(o.value))
                        )}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            style={{ minHeight: 120 }}>
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} {u.staff_id ? `· ${u.staff_id}` : ''}</option>)}
                    </select>
                    <p className="text-[11px] text-gray-400">Hold Ctrl/Cmd to add multiple people. Teachers only for now.</p>
                    <textarea
                        rows={4} value={body} onChange={e => setBody(e.target.value)}
                        placeholder="Type your message…"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                        <button onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-gray-300">Cancel</button>
                        <Button onClick={create} size="sm" disabled={saving || !body.trim()}>
                            {saving ? 'Starting…' : 'Send'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messaging;
