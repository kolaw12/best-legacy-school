import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DarkModeToggle = ({ className = '' }) => {
    const { dark, toggle } = useTheme();
    return (
        <button
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-gray-100 dark:hover:bg-[#2D3348] ${className}`}
        >
            {dark ? <Sun className="w-4.5 h-4.5 text-amber-400" strokeWidth={2} /> : <Moon className="w-4.5 h-4.5 text-gray-500" strokeWidth={2} />}
        </button>
    );
};

export default DarkModeToggle;
