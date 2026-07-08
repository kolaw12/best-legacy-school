import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
    Home, Inbox, Users, Upload, ArrowUp, Briefcase, Layers, BookOpen,
    CheckCircle2, Car, Clock, GraduationCap, Banknote, Bell, Shield, LogOut,
    Menu, X, Trash2, CalendarRange,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Breadcrumbs from '../ui/Breadcrumbs';
import NotificationBell from '../ui/NotificationBell';
import Logo from '../ui/Logo';

const NAV = [
    { to: '/admin/dashboard',  label: 'Dashboard',   icon: 'home' },
    { to: '/admin/admissions', label: 'Admissions',  icon: 'inbox' },
    { to: '/admin/students',   label: 'Students',    icon: 'users' },
    { to: '/admin/bulk-import', label: 'Bulk Import', icon: 'upload' },
    { to: '/admin/promotion',  label: 'Promotion',   icon: 'arrow-up' },
    { to: '/admin/teachers',   label: 'Teachers',    icon: 'briefcase' },
    { to: '/admin/guardians',  label: 'Guardians',   icon: 'users' },
    { to: '/admin/classes',    label: 'Classes',     icon: 'layers' },
    { to: '/admin/subjects',   label: 'Subjects',    icon: 'book' },
    { to: '/admin/terms',      label: 'Sessions & Terms', icon: 'calendar' },
    { to: '/admin/attendance', label: 'Attendance',  icon: 'check' },
    { to: '/admin/pickups',    label: 'Pickups',     icon: 'pickup' },
    { to: '/admin/late-pickup', label: 'Late pickup', icon: 'clock' },
    { to: '/admin/grades',     label: 'Grades',      icon: 'grade' },
    { to: '/admin/finance',    label: 'Finance',     icon: 'cash' },
    { to: '/admin/announcements', label: 'Announcements', icon: 'bell' },
    { to: '/admin/audit',         label: 'Audit Log',     icon: 'shield' },
    { to: '/admin/trash',         label: 'Trash',         icon: 'trash' },
];

const LEGACY = [
    { to: '/admin-dashboard', label: 'Legacy Console', hint: 'Inquiries • Gallery • Results' },
];

const ICONS = {
    home: Home, inbox: Inbox, users: Users, briefcase: Briefcase, layers: Layers,
    book: BookOpen, check: CheckCircle2, grade: GraduationCap, cash: Banknote,
    shield: Shield, bell: Bell, upload: Upload, 'arrow-up': ArrowUp, pickup: Car,
    clock: Clock, logout: LogOut, trash: Trash2, calendar: CalendarRange,
};

const Icon = ({ name }) => {
    const Cmp = ICONS[name] || Home;
    return <Cmp className="w-5 h-5 shrink-0" strokeWidth={2} />;
};

const AdminLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { profile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin-login');
    };

    const initials = (profile?.full_name || profile?.username || 'A')
        .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    const NavList = ({ onClickLink }) => (
        <nav className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Workspace</div>
            {NAV.map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClickLink}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                            isActive
                                ? 'bg-primary-soft text-primary-dark'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-ink'
                        }`
                    }
                >
                    <Icon name={item.icon} />
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-bg">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col z-30">
                <div className="px-5 py-5 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2.5">
                        <Logo size="md" />
                        <div className="leading-tight">
                            <div className="font-extrabold text-ink text-sm">BLDS</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Console</div>
                        </div>
                    </Link>
                </div>
                <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain" data-lenis-prevent>
                    <NavList />
                </div>
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {profile && (
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary-soft/60">
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">{initials}</div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-ink truncate">{profile.full_name || profile.username}</div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">{profile.role_display}</div>
                            </div>
                        </div>
                    )}
                    <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-ink rounded-xl hover:bg-gray-50">
                        <Icon name="logout" />
                        Back to Website
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-rose-600 rounded-xl hover:bg-gray-50">
                        <Icon name="logout" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile sheet */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <Link to="/" className="flex items-center gap-2.5">
                                <Logo size="md" />
                                <span className="font-extrabold text-ink text-sm">BLDS</span>
                            </Link>
                            <button onClick={() => setMobileOpen(false)} className="text-gray-400 p-2 -mr-2">
                                <X className="w-6 h-6" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain" data-lenis-prevent>
                            <NavList onClickLink={() => setMobileOpen(false)} />
                        </div>
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-ink">
                                <Menu className="w-6 h-6" strokeWidth={2} />
                            </button>
                            <Breadcrumbs />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:block text-xs text-gray-500">
                                {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <NotificationBell />
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm" title={profile?.full_name}>{initials}</div>
                        </div>
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
