import { Link } from 'react-router-dom';
import { Inbox, GraduationCap, BookOpen, CalendarRange, ClipboardList, Shield, Trash2, ChevronRight, Users, UserCircle } from 'lucide-react';

const SECTIONS = [
    {
        title: 'Account',
        items: [
            { to: '/admin/profile',      label: 'My Profile', icon: UserCircle, desc: 'Account settings' },
        ],
    },
    {
        title: 'People',
        items: [
            { to: '/admin/admissions',   label: 'Admissions', icon: Inbox, desc: 'Review applications' },
            { to: '/admin/teachers',     label: 'Teachers', icon: GraduationCap, desc: 'Manage staff' },
            { to: '/admin/guardians',    label: 'Guardians', icon: Users, desc: 'Parent accounts' },
        ],
    },
    {
        title: 'Academics',
        items: [
            { to: '/admin/classes',  label: 'Classes', icon: BookOpen, desc: 'Manage class levels' },
            { to: '/admin/subjects', label: 'Subjects', icon: BookOpen, desc: 'Subject catalogue' },
            { to: '/admin/terms',    label: 'Sessions & Terms', icon: CalendarRange, desc: 'Academic calendar' },
            { to: '/admin/grades',   label: 'Grades', icon: ClipboardList, desc: 'View all grades' },
        ],
    },
    {
        title: 'System',
        items: [
            { to: '/admin/audit',       label: 'Audit Log', icon: Shield, desc: 'Activity history' },
            { to: '/admin/trash',       label: 'Trash', icon: Trash2, desc: 'Deleted records' },
            { to: '/admin/bulk-import', label: 'Bulk Import', icon: ClipboardList, desc: 'CSV upload' },
        ],
    },
];

const AdminMore = () => (
    <>
        <h1 className="text-2xl font-black text-ink">More</h1>
        <p className="mt-1 text-sm text-gray-500">All admin pages organized by category.</p>

        <div className="mt-6 space-y-6">
            {SECTIONS.map(section => (
                <div key={section.title}>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{section.title}</h2>
                    <div className="space-y-2">
                        {section.items.map(item => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.to} to={item.to}
                                    className="flex items-center justify-between bg-white dark:bg-[#1A1D2B] rounded-2xl border border-gray-100 dark:border-[#2D3348] px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#22253A] transition">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 text-gray-400" strokeWidth={2} />
                                        <div>
                                            <div className="text-sm font-semibold text-ink">{item.label}</div>
                                            <div className="text-xs text-gray-400">{item.desc}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </>
);

export default AdminMore;
