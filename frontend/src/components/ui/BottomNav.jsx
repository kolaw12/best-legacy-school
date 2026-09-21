import { NavLink } from 'react-router-dom';
import { Home, Banknote, MessageCircle, MoreHorizontal } from 'lucide-react';

const TABS = [
    { to: '/portal/dashboard', label: 'Home', icon: Home },
    { to: '/portal/fees',      label: 'Fees', icon: Banknote },
    { to: '/portal/messages',  label: 'Messages', icon: MessageCircle },
    { to: '/portal/more',      label: 'More', icon: MoreHorizontal },
];

const BottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-[#1A1D2B] border-t border-gray-100 dark:border-[#2D3348] safe-area-pb">
        <div className="flex items-center justify-around h-16">
            {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.to === '/portal/dashboard'}
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

export default BottomNav;
