import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import Logo from './ui/Logo';
import DarkModeToggle from './ui/DarkModeToggle';

const NAV_LINKS = [
    { to: '/',           labelKey: 'nav.home',       end: true },
    { to: '/about',      labelKey: 'nav.about' },
    { to: '/admissions', labelKey: 'nav.admissions' },
    { to: '/gallery',    labelKey: 'nav.gallery' },
    { to: '/virtual-tour', labelKey: 'nav.virtual_tour' },
    { to: '/contact',    labelKey: 'nav.contact' },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setLangOpen(false);
    };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    return (
        <header
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                isOpen || scrolled
                    ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm'
                    : 'bg-white/80 backdrop-blur-md border-b border-transparent'
            }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-[4.5rem]">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="flex items-center transition-transform duration-200 hover:scale-105">
                            <Logo size="sm" />
                        </div>
                        <span className="hidden sm:flex flex-col leading-none">
                            <span className="text-sm font-bold tracking-[0.08em] text-ink">BEST LEGACY</span>
                            <span className="text-[9px] font-semibold tracking-[0.2em] text-gray-400 uppercase">Divine School</span>
                        </span>
                    </Link>

                    {/* Desktop links — thin gold underline instead of a filled pill */}
                    <div className="hidden lg:flex items-center gap-8">
                        {NAV_LINKS.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) =>
                                    `group relative py-2 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                                        isActive ? 'text-primary' : 'text-gray-500 hover:text-ink'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {t(link.labelKey)}
                                        <span
                                            className={`absolute left-0 right-0 -bottom-0.5 h-px bg-gold origin-left transition-transform duration-300 ${
                                                isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                            }`}
                                        />
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-5">
                        {/* Language switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 hover:text-ink transition-colors"
                            >
                                <Globe className="w-4 h-4" strokeWidth={1.75} />
                                {i18n.language.toUpperCase().substring(0, 2)}
                            </button>
                            {langOpen && (
                                <div className="absolute right-0 mt-3 w-40 bg-white rounded-xl shadow-card-lg border border-gray-100 py-1.5 overflow-hidden z-50">
                                    <button onClick={() => changeLanguage('en')}  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors">EN — English</button>
                                    <button onClick={() => changeLanguage('yo')}  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors">YO — Yorùbá</button>
                                    <button onClick={() => changeLanguage('pcm')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors">PCM — Pidgin</button>
                                </div>
                            )}
                        </div>

                        <DarkModeToggle />

                        <div className="w-px h-5 bg-gray-200" />

                        <Link to="/parent-login" className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gray-500 hover:text-ink transition-colors">
                            Parent Portal
                        </Link>

                        <Link
                            to="/admissions"
                            className="bg-primary text-white text-xs font-bold uppercase tracking-[0.1em] px-6 py-3 rounded-full shadow-sm hover:bg-primary-dark hover:shadow-md transition-all"
                        >
                            {t('nav.apply')}
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="lg:hidden p-2 -mr-2 rounded-full transition-colors text-ink hover:bg-gray-50"
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            <div className={`lg:hidden overflow-hidden border-t border-gray-100 transition-all duration-300 ease-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}>
                <div className="px-4 sm:px-6 pt-3 pb-6 space-y-1">
                    {NAV_LINKS.map(link => (
                        <NavLink key={link.to} to={link.to} end={link.end}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `block px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-[0.08em] transition-colors ${
                                    isActive ? 'bg-primary-soft text-primary-dark' : 'text-gray-600 hover:bg-gray-50'
                                }`
                            }
                        >{t(link.labelKey)}</NavLink>
                    ))}
                    <div className="flex gap-2 mt-4 px-1">
                        <button onClick={() => changeLanguage('en')}  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${i18n.language.startsWith('en') ? 'bg-primary-soft text-primary-dark' : 'bg-gray-50 text-gray-600'}`}>EN</button>
                        <button onClick={() => changeLanguage('yo')}  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${i18n.language.startsWith('yo') ? 'bg-primary-soft text-primary-dark' : 'bg-gray-50 text-gray-600'}`}>YO</button>
                        <button onClick={() => changeLanguage('pcm')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${i18n.language.startsWith('pcm') ? 'bg-primary-soft text-primary-dark' : 'bg-gray-50 text-gray-600'}`}>PCM</button>
                    </div>
                    <Link to="/parent-login" className="block text-center mt-2 bg-secondary-soft text-secondary-dark font-bold uppercase tracking-[0.1em] text-sm py-3 rounded-full">
                        Parent Portal
                    </Link>
                    <Link to="/admissions" className="block text-center mt-2 bg-primary text-white font-bold uppercase tracking-[0.1em] text-sm py-3.5 rounded-full shadow-sm">
                        {t('nav.apply')}
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
