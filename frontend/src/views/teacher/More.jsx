import { Link, useNavigate } from 'react-router-dom';
import { Users, ClipboardList, UserCircle, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ITEMS = [
    { to: '/admin/teacher/class',       label: 'Class Roster', icon: Users, desc: 'View pupils & contacts' },
    { to: '/admin/teacher/assignments', label: 'Assignments', icon: ClipboardList, desc: 'Set & grade homework' },
    { to: '/admin/profile',             label: 'Profile', icon: UserCircle, desc: 'Account settings' },
];

const TeacherMore = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin-login');
    };

    return (
        <>
            <h1 className="text-2xl font-black text-ink">More</h1>
            <div className="mt-6 space-y-2">
                {ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                        <Link key={item.to} to={item.to}
                            className="flex items-center justify-between bg-white dark:bg-[#1A1D2B] rounded-2xl border border-gray-100 dark:border-[#2D3348] px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#22253A] transition">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-ink">{item.label}</div>
                                    <div className="text-xs text-gray-400">{item.desc}</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                    );
                })}
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-4 bg-white dark:bg-[#1A1D2B] rounded-2xl border border-gray-100 dark:border-[#2D3348] px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#22253A] transition">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-rose-500" strokeWidth={2} />
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-semibold text-rose-600">Sign out</div>
                    </div>
                </button>
            </div>
        </>
    );
};

export default TeacherMore;
