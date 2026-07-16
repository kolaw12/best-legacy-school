import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, Users, CheckCircle2, BookOpen, ClipboardList, MessageCircle, LogOut, Menu, X } from 'lucide-react';
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

const ICONS = {
    home: Home, users: Users, check: CheckCircle2, book: BookOpen,
    clipboard: ClipboardList, chat: MessageCircle, logout: LogOut,
};

const Icon = ({ name }) => {
    const Cmp = ICONS[name] || Home;
    return <Cmp className="w-5 h-5 shrink-0" strokeWidth={2} />;
};

const TeacherLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { profile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin-login');
    };

    const initials = (profile?.full_name || profile?.username || 'T')
        .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    const classLabel = profile?.teacher_name ? 'Teacher' : 'Staff';

    const NavList = ({ onClickLink }) => (
        <nav className="px-3 py-4 space-y-0.5">
            <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Workspace</div>
            {NAV.map(item => (
                <NavLink key={item.to} to={item.to} onClick={onClickLink}
                    className={({ isActive }) =>
                        `relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium transition ${
                            isActive ? 'bg-primary-soft text-primary-dark' : 'text-gray-600 hover:bg-gray-50 hover:text-ink'
                        }`
                    }>
                    {({ isActive }) => (
                        <>
                            {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-primary" />}
                            <Icon name={item.icon} />
                            {item.label}
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-bg">
            <aside className="print:hidden fixed inset-y-0 left-0 hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col z-30">
                <div className="px-5 py-5 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2">
                        <Logo size="md" />
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
                                <X className="w-6 h-6" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain" data-lenis-prevent>
                            <NavList onClickLink={() => setMobileOpen(false)} />
                        </div>
                    </aside>
                </div>
            )}

            <div className="lg:pl-64 print:pl-0">
                <div className="print:hidden sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-ink">
                                <Menu className="w-6 h-6" strokeWidth={2} />
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

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TeacherLayout;
