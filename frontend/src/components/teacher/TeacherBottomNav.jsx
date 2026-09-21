import { NavLink } from 'react-router-dom';
import { Home, CheckCircle2, BookOpen, MessageCircle, MoreHorizontal } from 'lucide-react';

const TABS = [
    { to: '/admin/teacher/dashboard',   label: 'Home', icon: Home },
    { to: '/admin/teacher/attendance',  label: 'Attendance', icon: CheckCircle2 },
    { to: '/admin/teacher/grades',      label: 'Grades', icon: BookOpen },
    { to: '/admin/teacher/messages',    label: 'Messages', icon: MessageCircle },
    { to: '/admin/teacher/more',        label: 'More', icon: MoreHorizontal },
];

const TeacherBottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-[#1A1D2B] border-t border-gray-100 dark:border-[#2D3348]">
        <div className="flex items-center justify-around h-16">
            {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.to === '/admin/teacher/dashboard'}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-0.5 w-full h-full transition ${
                                isActive ? 'text-primary' : 'text-gray-400'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                        <span className="text-[10px] font-semibold">{tab.label}</span>
                    </NavLink>
                );
            })}
        </div>
    </nav>
);

export default TeacherBottomNav;
