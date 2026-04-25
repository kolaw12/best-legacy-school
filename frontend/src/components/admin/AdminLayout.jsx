import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
    { to: '/admin/classes',    label: 'Classes',     icon: 'layers' },
    { to: '/admin/subjects',   label: 'Subjects',    icon: 'book' },
    { to: '/admin/attendance', label: 'Attendance',  icon: 'check' },
    { to: '/admin/pickups',    label: 'Pickups',     icon: 'pickup' },
    { to: '/admin/late-pickup', label: 'Late pickup', icon: 'clock' },
    { to: '/admin/grades',     label: 'Grades',      icon: 'grade' },
    { to: '/admin/finance',    label: 'Finance',     icon: 'cash' },
    { to: '/admin/announcements', label: 'Announcements', icon: 'bell' },
    { to: '/admin/audit',         label: 'Audit Log',     icon: 'shield' },
];

const LEGACY = [
    { to: '/admin-dashboard', label: 'Legacy Console', hint: 'Inquiries • Gallery • Results' },
];

const Icon = ({ name }) => {
    const paths = {
        home: "M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9",
        inbox: "M3 8l4-5h10l4 5M3 8v11a1 1 0 001 1h16a1 1 0 001-1V8M3 8h18M8 14h8",
        users: "M9 11a4 4 0 100-8 4 4 0 000 8zM15 14a3 3 0 100-6 3 3 0 000 6zM2 20v-2a5 5 0 015-5h4a5 5 0 015 5v2M17 20v-1a4 4 0 00-3-3.87",
        briefcase: "M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2m-12 0h12m-12 0a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2",
        layers: "M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 13.5l9 4.5 9-4.5M3 18l9 4.5L21 18",
        book: "M4 19V5a2 2 0 012-2h12v14H6a2 2 0 00-2 2zM4 19a2 2 0 002 2h12M10 7h4",
        check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        grade: "M9 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z",
        cash: "M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.83 1M12 4v2m0 10v2m9-6a9 9 0 11-18 0 9 9 0 0118 0z",
        shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        bell: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
        upload: "M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12",
        'arrow-up': "M5 10l7-7 7 7M12 3v18",
        pickup: "M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM12 14v3m-2-1.5h4",
        clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.5-2.3.9a7 7 0 00-2-1.2L14 3h-4l-.6 2.5a7 7 0 00-2 1.2L5 5.8l-2 3.5 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.3-.9a7 7 0 002 1.2L10 21h4l.6-2.5a7 7 0 002-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z",
        logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    };
    return (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={paths[name] || paths.home}/>
        </svg>
    );
};

const AdminLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
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
                <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain">
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
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain">
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
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
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
