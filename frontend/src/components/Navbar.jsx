import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-primary text-white shadow-lg fixed w-full z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold font-sans tracking-wide">
                            Best Legacy
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/" className="hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition duration-300">Home</Link>
                            <Link to="/about" className="hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition duration-300">About</Link>
                            <Link to="/admissions" className="hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition duration-300">Admissions</Link>
                            <Link to="/gallery" className="hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition duration-300">Gallery</Link>
                            <Link to="/contact" className="hover:bg-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-300">Contact</Link>
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <span className="sr-only">Open main menu</span>
                            {!isOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-dark">Home</Link>
                        <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-dark">About</Link>
                        <Link to="/admissions" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-dark">Admissions</Link>
                        <Link to="/gallery" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-dark">Gallery</Link>
                        <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-secondary hover:text-primary">Contact</Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
