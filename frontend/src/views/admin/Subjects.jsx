import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import BulkActionBar from '../../components/admin/BulkActionBar';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useRowSelection from '../../hooks/useRowSelection';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';

const SubjectsPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState(null); // { rows: [...] } | null
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        adminApi.subjects()
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    }, []);

    const selection = useRowSelection(rows);

    const removeMany = async (toRemove) => {
        setBusy(true);
        const failed = [];
        for (const row of toRemove) {
            try {
                await axios.delete(`${API_URL}/api/academics/subjects/${row.id}/`);
                setRows(rs => rs.filter(r => r.id !== row.id));
            } catch (e) {
                failed.push(`${row.name}: ${e.response?.data?.error || 'failed'}`);
            }
        }
        selection.clear();
        setBusy(false);
        setConfirm(null);
        if (failed.length) alert(`Some subjects couldn't be moved to the trash:\n\n${failed.join('\n')}`);
    };

    const nursery = rows.filter(r => r.section === 'nursery');
    const basic = rows.filter(r => r.section === 'basic');

    return (
        <>
            <AdminPageHeader
                title="Subjects"
                subtitle="Nursery focuses on developmental skills. Basic follows the Nigerian primary curriculum."
                actions={[
                    <BulkActionBar
                        key="bulk"
                        count={selection.selectedRows.length}
                        label="Move to trash"
                        onAction={() => setConfirm({ rows: selection.selectedRows })}
                    />,
                ]}
            />

            <div className="grid lg:grid-cols-2 gap-6">
                <Panel title="Nursery subjects" rows={nursery} loading={loading} tone="warm"
                       hint="Teacher-led, play-based, graded E / VG / G / F / NI."
                       selection={selection} onDelete={(row) => setConfirm({ rows: [row] })} />
                <Panel title="Basic subjects" rows={basic} loading={loading} tone="mint"
                       hint="CA1 + CA2 + Exam out of 100. Graded A–F."
                       selection={selection} onDelete={(row) => setConfirm({ rows: [row] })} />
            </div>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => removeMany(confirm.rows)}
                busy={busy}
                title={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} subjects to the trash?` : `Move "${confirm?.rows[0]?.name}" to the trash?`}
                body="You can restore it later from Trash."
                confirmLabel={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} to trash` : 'Move to trash'}
                tone="danger"
            />
        </>
    );
};

const Panel = ({ title, rows, loading, tone, hint, selection, onDelete }) => (
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
                    <li key={s.id} className="flex items-center justify-between py-2.5 group">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selection.isSelected(s)}
                                onChange={() => selection.toggle(s)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
                            />
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${tone === 'warm' ? 'bg-secondary-soft text-secondary-dark' : 'bg-primary-soft text-primary-dark'}`}>
                                {s.code || s.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-ink">{s.name}</span>
                        </div>
                        <button
                            onClick={() => onDelete(s)}
                            title="Move to trash"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                        >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

export default SubjectsPage;
