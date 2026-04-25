import { Link, useLocation } from 'react-router-dom';

/**
 * Derives a breadcrumb trail from the current pathname.
 * Maps slugs to friendly labels via BREADCRUMB_LABELS; falls back to titlecase.
 *
 * <Breadcrumbs />                              -> /admin/students/edit
 *  -> Admin / Students / Edit
 */
const BREADCRUMB_LABELS = {
    admin:        'Admin',
    teacher:      'Teacher',
    parent:       'Parent',
    dashboard:    'Dashboard',
    admissions:   'Admissions',
    students:     'Students',
    teachers:     'Teachers',
    classes:      'Classes',
    subjects:     'Subjects',
    attendance:   'Attendance',
    grades:       'Grades',
    finance:      'Finance',
    audit:        'Audit log',
    'report-cards': 'Report cards',
    assignments: 'Assignments',
    class:        'My class',
    fees:         'Fees',
    child:        'Child',
};

const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const Breadcrumbs = ({ rootHref, rootLabel, className = '' }) => {
    const { pathname } = useLocation();
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return null;

    // Suppress IDs/UUIDs (numbers, hex-like strings) from displaying as crumbs.
    const isId = (s) => /^\d+$/.test(s) || /^[0-9a-f]{8,}$/i.test(s);

    const crumbs = [];
    let acc = '';
    segments.forEach((seg, i) => {
        acc += '/' + seg;
        if (isId(seg)) return;
        const label = BREADCRUMB_LABELS[seg] || titleCase(seg);
        crumbs.push({ to: acc, label, isLast: i === segments.length - 1 });
    });

    if (rootHref && rootLabel) {
        crumbs.unshift({ to: rootHref, label: rootLabel });
    }

    return (
        <nav aria-label="Breadcrumb" className={`text-xs flex items-center gap-1.5 ${className}`}>
            {crumbs.map((c, i) => (
                <span key={c.to + i} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-gray-300">/</span>}
                    {c.isLast ? (
                        <span className="text-ink font-semibold">{c.label}</span>
                    ) : (
                        <Link to={c.to} className="text-gray-500 hover:text-ink transition-colors">{c.label}</Link>
                    )}
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
