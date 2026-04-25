import { useState } from 'react';
import axios from 'axios';
import AdminPageHeader from '../../components/admin/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { FileInput } from '../../components/ui/Field';
import { useToast } from '../../components/ui/ToastProvider';
import API_URL from '../../config/api';

const TEMPLATE_HEADERS = [
    'first_name', 'last_name', 'date_of_birth', 'gender', 'class_level',
    'guardian_first_name', 'guardian_last_name', 'guardian_phone',
    'guardian_email', 'relationship', 'address',
];

const TEMPLATE_ROW = [
    'Tomi', 'Adebayo', '2021-04-12', 'F', 'Nursery 1',
    'Kolade', 'Adebayo', '+2348031112200',
    'kolade@example.com', 'father', 'Mowe, Ogun State',
];

const downloadTemplate = () => {
    const csv = [
        TEMPLATE_HEADERS.join(','),
        TEMPLATE_ROW.join(','),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'best-legacy-students-template.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

const BulkImport = () => {
    const [file, setFile] = useState(null);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Pick a CSV file first.');
        setRunning(true);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data } = await axios.post(
                `${API_URL}/api/academics/students/bulk-import/`,
                fd,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );
            setResult(data);
            const s = data.summary || {};
            toast.success(`Created ${s.created || 0} · skipped ${s.skipped || 0} · ${s.errors || 0} errors.`);
        } catch (err) {
            const data = err.response?.data;
            const msg = typeof data === 'object' ? JSON.stringify(data) : err.message;
            toast.error(msg.slice(0, 160));
        } finally {
            setRunning(false);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Bulk Import Students"
                subtitle="Upload a CSV to create dozens of pupils at once. The system de-duplicates on first name + last name + date of birth, so re-running the same file is safe."
                actions={[
                    <Button key="tpl" size="sm" variant="outline" onClick={downloadTemplate}>
                        Download CSV template
                    </Button>,
                ]}
            />

            <div className="grid lg:grid-cols-3 gap-6">
                {/* LEFT: form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-ink">Upload CSV</h3>
                    <FileInput accept=".csv,text/csv" onChange={(e) => setFile(e.target.files[0])} />
                    {file && (
                        <div className="text-xs text-gray-500">
                            <span className="font-mono text-ink">{file.name}</span> · {(file.size / 1024).toFixed(1)} KB
                        </div>
                    )}
                    <Button type="submit" disabled={!file || running}>
                        {running ? 'Importing…' : 'Import students'}
                    </Button>
                </form>

                {/* RIGHT: format hint */}
                <aside className="bg-mint-soft rounded-2xl p-6 border border-primary-soft">
                    <h4 className="font-bold text-primary-dark text-sm mb-3">Required columns</h4>
                    <ul className="space-y-1.5 text-xs">
                        {['first_name', 'last_name', 'date_of_birth', 'gender (M/F)', 'class_level'].map(c => (
                            <li key={c} className="flex items-center gap-2 text-ink">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                <span className="font-mono">{c}</span>
                            </li>
                        ))}
                    </ul>
                    <h4 className="mt-5 font-bold text-primary-dark text-sm mb-3">Optional</h4>
                    <ul className="space-y-1.5 text-xs">
                        {['guardian_first_name', 'guardian_last_name', 'guardian_phone', 'guardian_email', 'relationship', 'address'].map(c => (
                            <li key={c} className="flex items-center gap-2 text-gray-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                <span className="font-mono">{c}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-5 text-xs text-gray-600 leading-relaxed">
                        <strong>class_level</strong> must match exactly: <span className="font-mono">Nursery 1</span>, <span className="font-mono">Nursery 2</span>, <span className="font-mono">Basic 1</span> … <span className="font-mono">Basic 6</span>.
                        Date format: <span className="font-mono">YYYY-MM-DD</span>.
                    </p>
                </aside>
            </div>

            {result && (
                <div className="mt-8">
                    <h3 className="font-bold text-ink mb-4">Import result</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <Tile label="Created" value={result.summary?.created || 0} tone="bg-primary-soft text-primary-dark" />
                        <Tile label="Skipped (duplicates)" value={result.summary?.skipped || 0} tone="bg-gray-100 text-gray-700" />
                        <Tile label="Errors" value={result.summary?.errors || 0} tone={(result.summary?.errors || 0) > 0 ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-700'} />
                    </div>

                    {result.errors?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-rose-200 p-5 mb-4">
                            <h4 className="font-bold text-rose-700 mb-2">Errors</h4>
                            <ul className="space-y-1 text-xs font-mono text-rose-700">
                                {result.errors.map((e, i) => (
                                    <li key={i}>row {e.row}: {e.error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {result.created?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h4 className="font-bold text-ink mb-3">Newly created ({result.created.length})</h4>
                            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {result.created.map((c, i) => (
                                    <li key={i} className="text-xs flex items-center gap-2">
                                        <Badge tone="mint">{c.class}</Badge>
                                        <span className="font-mono text-gray-400">{c.admission_no}</span>
                                        <span className="text-ink truncate">{c.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

const Tile = ({ label, value, tone }) => (
    <div className={`rounded-xl p-4 ${tone}`}>
        <div className="text-xs font-semibold opacity-80">{label}</div>
        <div className="text-2xl font-black mt-1">{value}</div>
    </div>
);

export default BulkImport;
