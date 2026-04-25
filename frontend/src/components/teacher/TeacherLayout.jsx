import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Breadcrumbs from '../ui/Breadcrumbs';
import NotificationBell from '../ui/NotificationBell';
import Logo from '../ui/Logo';

const NAV = [
    { to: '/teacher/dashboard',   label: 'Dashboard',   icon: 'home' },
    { to: '/teacher/class',       label: 'My Class',    icon: 'users' },
    { to: '/teacher/attendance',  label: 'Attendance',  icon: 'check' },
    { to: '/teacher/grades',      label: 'Grades',      icon: 'book' },
    { to: '/teacher/assignments', label: 'Assignments', icon: 'clipboard' },
    { to: '/teacher/messages',    label: 'Messages',    icon: 'chat' },
];

const PATHS = {
    home: "M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9",
    users: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 014-4h4a4 4 0 014 4v2M12 12a4 4 0 100-8 4 4 0 000 8z",
    check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    book: "M4 19V5a2 2 0 012-2h12v14H6a2 2 0 00-2 2zM4 19a2 2 0 002 2h12M10 7h4",
    clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    chat: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

const Icon = ({ name }) => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={PATHS[name]}/>
    </svg>
);

const TeacherLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { profile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/admin-login');
    };

    const initials = (profile?.full_name || profile?.username || 'T')
        .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    const classLabel = profile?.teacher_name ? 'Teacher' : 'Staff';

    const NavList = ({ onClickLink }) => (
        <nav className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Workspace</div>
            {NAV.map(item => (
                <NavLink key={item.to} to={item.to} onClick={onClickLink}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                            isActive ? 'bg-secondary-soft text-secondary-dark' : 'text-gray-600 hover:bg-gray-50 hover:text-ink'
                        }`
                    }>
                    <Icon name={item.icon} />
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-bg">
            <aside className="fixed inset-y-0 left-0 hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col z-30">
                <div className="px-5 py-5 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2">
                        <Logo size="md" />
                    </Link>
                </div>
                <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain">
                    <NavList />
                </div>
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {profile && (
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary-soft/60">
                            <div className="w-9 h-9 rounded-full bg-secondary text-ink flex items-center justify-center font-bold text-xs">{initials}</div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-ink truncate">{profile.full_name || profile.username}</div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">{classLabel}</div>
                            </div>
                        </div>
                    )}
                    <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-ink rounded-xl hover:bg-gray-50">
                        <Icon name="logout" /> Back to Website
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-rose-600 rounded-xl hover:bg-gray-50">
                        <Icon name="logout" /> Sign out
                    </button>
                </div>
            </aside>

            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Logo size="md" />
                            </div>
                            <button onClick={() => setMobileOpen(false)} className="text-gray-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain">
                            <NavList onClickLink={() => setMobileOpen(false)} />
                        </div>
                    </aside>
                </div>
            )}

            <div className="lg:pl-64">
                <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-ink">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                            </button>
                            <Breadcrumbs />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500 hidden md:block">
                                {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <NotificationBell />
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

export default TeacherLayout;
