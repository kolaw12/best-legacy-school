import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, MessageCircle, Banknote, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Breadcrumbs from '../ui/Breadcrumbs';
import FeeDueChip from './FeeDueChip';
import NotificationBell from '../ui/NotificationBell';
import Logo from '../ui/Logo';

const NAV = [
    { to: '/parent/dashboard', label: 'Dashboard', icon: 'home' },
    { to: '/parent/calendar',  label: 'Calendar',  icon: 'calendar' },
    { to: '/parent/messages',  label: 'Messages',  icon: 'chat' },
    { to: '/parent/fees',      label: 'Fees',      icon: 'cash' },
];

const ICONS = { home: Home, cash: Banknote, calendar: Calendar, chat: MessageCircle, logout: LogOut };

const Icon = ({ name }) => {
    const Cmp = ICONS[name] || Home;
    return <Cmp className="w-5 h-5 shrink-0" strokeWidth={2} />;
};

const ParentLayout = () => {
    const [open, setOpen] = useState(false);
    const { profile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin-login');
    };

    const initials = (profile?.full_name || profile?.username || 'P')
        .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    const NavList = ({ onClickLink }) => (
        <nav className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">For parents</div>
            {NAV.map(item => (
                <NavLink key={item.to} to={item.to} onClick={onClickLink}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                            isActive ? 'bg-primary-soft text-primary-dark' : 'text-gray-600 hover:bg-gray-50 hover:text-ink'
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
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Parent</div>
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

            {open && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
                    <motion.aside
                        initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                        className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
                            <Link to="/" className="flex items-center gap-2">
                                <Logo size="md" />
                            </Link>
                            <button onClick={() => setOpen(false)} className="text-gray-400">
                                <X className="w-6 h-6" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="flex-1 h-0 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain" data-lenis-prevent>
                            <NavList onClickLink={() => setOpen(false)} />
                        </div>
                    </motion.aside>
                </div>
            )}

            <div className="lg:pl-64 print:pl-0">
                <div className="print:hidden sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-ink">
                                <Menu className="w-6 h-6" strokeWidth={2} />
                            </button>
                            <Breadcrumbs />
                        </div>
                        <div className="flex items-center gap-3">
                            <FeeDueChip />
                            <NotificationBell />
                            <div className="text-xs text-gray-500 hidden md:block">
                                {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
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

export default ParentLayout;
