import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Briefcase, UserCircle } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';

const TYPE_ICONS = {
    student: Users,
    teacher: Briefcase,
    guardian: UserCircle,
};

const TYPE_LABELS = {
    student: 'Students',
    teacher: 'Teachers',
    guardian: 'Guardians',
};

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();
    const debounceRef = useRef(null);

    // Ctrl+K / Cmd+K to focus
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const search = useCallback((q) => {
        if (q.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        axios.get(`${API_URL}/api/auth/search/`, { params: { q } })
            .then(r => setResults(r.data || []))
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setOpen(true);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(val), 300);
    };

    const handleSelect = (url) => {
        setOpen(false);
        setQuery('');
        setResults([]);
        navigate(url);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
        }
    };

    // Group results by type
    const grouped = {};
    results.forEach(r => {
        if (!grouped[r.type]) grouped[r.type] = [];
        grouped[r.type].push(r);
    });

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => query.length >= 2 && setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search... ⌘K"
                    className="w-40 sm:w-56 lg:w-72 pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
            </div>

            {open && query.length >= 2 && (
                <div className="absolute top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden z-50">
                    {loading ? (
                        <div className="p-4 text-sm text-gray-400 text-center">Searching...</div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 text-center">No results for "{query}"</div>
                    ) : (
                        <div className="max-h-80 overflow-y-auto py-2">
                            {Object.entries(grouped).map(([type, items]) => (
                                <div key={type}>
                                    <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                                        {TYPE_LABELS[type] || type}
                                    </div>
                                    {items.map(item => {
                                        const Icon = TYPE_ICONS[type] || Users;
                                        return (
                                            <button
                                                key={`${type}-${item.id}`}
                                                onClick={() => handleSelect(item.url)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left"
                                            >
                                                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-ink truncate">{item.title}</div>
                                                    <div className="text-xs text-gray-400 truncate">{item.subtitle}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
