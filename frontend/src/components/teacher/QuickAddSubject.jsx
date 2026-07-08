import { useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import API_URL from '../../config/api';

/**
 * Inline "+ Add subject" dropped next to a subject <Select> wherever a
 * teacher picks one (Grades, Assignments). Subjects are shared across every
 * teacher's dropdown, so this only ever creates — editing/removing an
 * existing one stays admin-only.
 */
const QuickAddSubject = ({ section, onAdded }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const close = () => {
        setOpen(false);
        setName('');
        setCode('');
        setError(null);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/api/academics/subjects/`, {
                name: name.trim(), code: code.trim(), section,
            });
            onAdded(data);
            close();
        } catch (err) {
            const d = err.response?.data;
            setError(
                d && typeof d === 'object'
                    ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
                    : 'Could not add subject.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
            >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add subject
            </button>

            <Modal
                open={open}
                onClose={close}
                title="Add a new subject"
                subtitle={`Added to the shared ${section === 'nursery' ? 'Nursery' : 'Basic'} subject list — every teacher will see it in their dropdown.`}
                size="sm"
                footer={[
                    <Button key="cancel" variant="outline" size="sm" onClick={close} type="button">Cancel</Button>,
                    <Button key="save" size="sm" onClick={submit} disabled={saving || !name.trim()}>
                        {saving ? 'Adding…' : 'Add subject'}
                    </Button>,
                ]}
            >
                {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Subject name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yoruba" required autoFocus />
                    </Field>
                    <Field label="Code" hint="Short code shown on report cards, e.g. YOR">
                        <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
                    </Field>
                </form>
            </Modal>
        </>
    );
};

export default QuickAddSubject;
