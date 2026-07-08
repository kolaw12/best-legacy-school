import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import Logo from './ui/Logo';

const SOCIALS = [
    { id: 'facebook',  label: 'Facebook',  href: '#', d: 'M22 12a10 10 0 10-11.5 9.9v-7H8v-2.9h2.5V9.7c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6v1.9h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z' },
    { id: 'instagram', label: 'Instagram', href: '#', d: 'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.3 1.2.4 2.4.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.2.3-2.4.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2zM12 7a5 5 0 100 10 5 5 0 000-10zm6.4-.6a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zM12 9.2a2.8 2.8 0 110 5.6 2.8 2.8 0 010-5.6z' },
    { id: 'twitter',   label: 'Twitter / X', href: '#', d: 'M18.9 4.5h3l-6.5 7.4 7.6 10.1h-6L13.1 16l-5.4 6h-3l7-7.9L4.5 4.5h6.1l4.2 5.6 4.1-5.6zm-1 16h1.7L7.7 6.2H5.9l13 14.3z' },
];

const Footer = () => {
    return (
        <footer className="bg-[#0F111A] text-gray-400 pt-16 pb-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 pb-12 border-b border-white/5">
                    {/* Brand + CTA Combined */}
                    <div className="col-span-2 md:col-span-2">
                        <Link to="/" className="inline-flex items-center">
                            <div className="bg-white rounded-lg p-2.5">
                                <Logo size="xl" />
                            </div>
                        </Link>
                        <h2 className="mt-6 text-2xl font-black text-white leading-tight tracking-tight">
                            Your child's legacy <span className="text-primary italic font-serif">starts here</span>.
                        </h2>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link to="/admissions" className="bg-primary text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-primary-dark transition-all">
                                Apply Now
                            </Link>
                            <div className="flex gap-4 items-center ml-2">
                                {SOCIALS.map(s => (
                                    <a key={s.id} href={s.href} className="text-gray-600 hover:text-white transition-colors">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d={s.d}/></svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase text-[10px] tracking-[0.2em]">School</h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li><Link to="/about" className="hover:text-primary transition-colors">The Way</Link></li>
                            <li><Link to="/gallery" className="hover:text-primary transition-colors">Gallery</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase text-[10px] tracking-[0.2em]">Admissions</h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li><Link to="/admissions" className="hover:text-primary transition-colors">Apply</Link></li>
                            <li><Link to="/book-tour" className="hover:text-primary transition-colors">Book a tour</Link></li>
                            <li><Link to="/application-status" className="hover:text-primary transition-colors">Track application</Link></li>
                            <li><Link to="/admin-login" className="hover:text-primary transition-colors">Portal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase text-[10px] tracking-[0.2em]">Locate</h4>
                        <div className="space-y-3 text-sm">
                            <a href="tel:+2348067663966" className="flex items-center gap-2 text-gray-300 hover:text-primary font-bold text-xs uppercase tracking-wider transition-colors">
                                <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                +234 806 766 3966
                            </a>
                            <span className="flex items-start gap-2 text-gray-500 leading-snug text-xs">
                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                                8, Kolawole St, off Uncle Steve, Mowe
                            </span>
                        </div>
                    </div>
                </div>

                {/* Compact Bottom Bar */}
                <div className="mt-8 flex flex-wrap justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em] text-gray-700 gap-4">
                    <p>&copy; {new Date().getFullYear()} Best Legacy Divine School.</p>
                    <div className="flex gap-6">
                        <a href="mailto:office@bestlegacy.sch?subject=Privacy%20policy%20request" className="hover:text-white transition-colors">Privacy</a>
                        <a href="mailto:office@bestlegacy.sch?subject=Safeguarding%20policy%20request" className="hover:text-white transition-colors">Safeguarding</a>
                    </div>
                </div>
            </div>

            {/* Massive brand watermark — the letterforms are filled with a
                real photo (background-clip: text) instead of a flat color,
                shown at full strength so the photo reads clearly inside
                the letters rather than as a faint texture. */}
            <div className="relative mt-10 py-4 pointer-events-none select-none overflow-hidden">
                <div
                    className="text-center font-black leading-none bg-clip-text text-transparent bg-cover"
                    style={{
                        fontSize: '20vw',
                        letterSpacing: '-0.04em',
                        backgroundImage: "url('/cultural_day.jpg')",
                        backgroundPosition: 'center 30%',
                        WebkitBackgroundClip: 'text',
                    }}
                >
                    BLDS
                </div>
            </div>
        </footer>
    );
};

export default Footer;
