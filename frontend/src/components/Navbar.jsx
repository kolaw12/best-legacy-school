import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import Logo from './ui/Logo';

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
    const [hoveredLink, setHoveredLink] = useState(null);
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
        <header className="fixed w-full z-50 pointer-events-none">
            <nav 
                className={`mx-auto transition-all duration-500 pointer-events-auto mt-4 px-2 py-1 max-w-6xl ${isOpen ? 'rounded-3xl bg-white/95 backdrop-blur-xl shadow-xl border border-gray-200 scale-100' : 'rounded-full'} ${
                    !isOpen && scrolled 
                    ? 'bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200 scale-95' 
                    : (!isOpen ? 'bg-white/80 backdrop-blur-md shadow-sm border border-gray-100 scale-100' : '')
                }`}
            >
                <div className="px-4 sm:px-6">
                    <div className="flex items-center justify-between h-12 md:h-14">
                        <Link to="/" className="flex items-center group">
                            <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className="flex items-center">
                                <Logo size="sm" />
                            </motion.div>
                        </Link>

                        {/* Desktop Links with Sliding Pill Indicator */}
                        <div className="hidden md:flex items-center gap-1 mx-4 relative" onMouseLeave={() => setHoveredLink(null)}>
                            {NAV_LINKS.map(link => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.end}
                                    onMouseEnter={() => setHoveredLink(link.to)}
                                    className={({ isActive }) =>
                                        `relative px-4 py-2 text-sm font-bold transition-colors z-10 ${
                                            isActive 
                                                ? 'text-primary' 
                                                : 'text-gray-600 hover:text-ink'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {t(link.labelKey)}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="nav-pill-active"
                                                    className="nav-link-pill bg-primary/10"
                                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                                />
                                            )}
                                            {hoveredLink === link.to && !isActive && (
                                                <motion.div
                                                    layoutId="nav-pill-hover"
                                                    className="nav-link-pill bg-gray-100/80"
                                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center gap-3 mr-2">
                            {/* Language Switcher */}
                            <div className="relative">
                                <button 
                                    onClick={() => setLangOpen(!langOpen)}
                                    className="flex items-center gap-1 text-xs font-bold transition-colors px-2 py-1 rounded-md text-gray-500 hover:text-primary"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {i18n.language.toUpperCase().substring(0, 2)}
                                </button>
                                {langOpen && (
                                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden z-50">
                                        <button onClick={() => changeLanguage('en')}  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-primary/5 hover:text-primary">EN — English</button>
                                        <button onClick={() => changeLanguage('yo')}  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-primary/5 hover:text-primary">YO — Yorùbá</button>
                                        <button onClick={() => changeLanguage('pcm')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-primary/5 hover:text-primary">PCM — Pidgin</button>
                                    </div>
                                )}
                            </div>

                            <Link to="/admin-login" className="text-xs font-bold transition-colors px-2 text-gray-500 hover:text-primary">{t('nav.signin')}</Link>
                            <Link
                                to="/admissions"
                                className="bg-primary text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm hover:shadow-md hover:bg-primary-dark transition-all"
                            >
                                {t('nav.apply')}
                            </Link>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 rounded-full transition-colors mr-2 text-primary hover:bg-primary/5"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden overflow-hidden"
                        >
                            <div className="px-4 pt-2 pb-6 space-y-2 border-t border-gray-100 mt-2">
                                {NAV_LINKS.map(link => (
                                    <NavLink key={link.to} to={link.to} end={link.end}
                                        className={({ isActive }) =>
                                            `block px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                                                isActive ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'
                                            }`
                                        }
                                    >{t(link.labelKey)}</NavLink>
                                ))}
                                <div className="flex gap-2 mt-4 px-2">
                                    <button onClick={() => changeLanguage('en')}  className={`flex-1 py-2 text-xs font-bold rounded-lg ${i18n.language.startsWith('en') ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-600'}`}>EN</button>
                                    <button onClick={() => changeLanguage('yo')}  className={`flex-1 py-2 text-xs font-bold rounded-lg ${i18n.language.startsWith('yo') ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-600'}`}>YO</button>
                                    <button onClick={() => changeLanguage('pcm')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${i18n.language.startsWith('pcm') ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-600'}`}>PCM</button>
                                </div>
                                <Link to="/admissions" className="block text-center mt-4 bg-primary text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg">
                                    {t('nav.apply')}
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
};

export default Navbar;
