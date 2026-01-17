import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">Best Legacy Divine School</h3>
                        <p className="text-gray-400">
                            Best Legacy Divine School is committed to providing quality education and nurturing the holistic development of every child.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
                            <li><Link to="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
                            <li><Link to="/admissions" className="text-gray-400 hover:text-white transition">Admissions</Link></li>
                            <li><Link to="/contact" className="text-gray-400 hover:text-white transition">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-4">Contact Info</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li>8, Kolawole street off uncle steve, Mowe, Ogun State</li>
                            <li>Phone: +234 (0) 806 766 3966</li>
                            <li>Email: towshk3@gmail.com</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Best Legacy Divine School. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
