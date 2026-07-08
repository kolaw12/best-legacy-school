/**
 * Shown whenever a teacher has more than one class to act on — homeroom plus
 * any classes they teach a subject in. Kept out of the way (single small
 * select) when there's only one class, since that's still the common case.
 */
const ClassSwitcher = ({ classes, value, onChange }) => {
    if (!classes || classes.length < 2) return null;
    return (
        <select
            value={value?.id || ''}
            onChange={e => onChange(classes.find(c => String(c.id) === e.target.value))}
            className="text-sm font-semibold text-ink bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236B7280%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center] pr-9"
        >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
    );
};

export default ClassSwitcher;
