import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import API_URL from '../config/api';
import Seo from '../components/Seo';

import funPool from '../assets/fun_in_the_pool.jpg';
import staffImg from '../assets/staff_members.jpg';
import culturalImg from '../assets/cultural_day.jpg';

const EASE = [0.22, 1, 0.36, 1];

const Fade = ({ children, delay = 0, x = 0, y = 24, className }) => {
    const reduced = useReducedMotion();
    if (reduced) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, x, y, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
};

const Eyebrow = ({ children }) => (
    <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">{children}</span>
    </div>
);

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchImages();
    }, []);

    const staticImages = [
        { id: 's1', image: funPool, alt: 'Fun in the pool' },
        { id: 's2', image: staffImg, alt: 'Our dedicated staff' },
        { id: 's3', image: '/school_library.jpg', alt: 'A pupil at work in the library' },
        { id: 's4', image: '/school_hero_Section.jpg', alt: 'Pupils smiling together' },
        { id: 's5', image: culturalImg, alt: 'Cultural day performance' },
    ];

    const fetchImages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/gallery/`);
            // Dynamic images from DB
            const dbImages = response.data.map(img => ({
                ...img,
                isDynamic: true
            }));
            setImages([...staticImages, ...dbImages]);
        } catch (error) {
            console.error('Error fetching gallery images:', error);
            setImages(staticImages);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (img) => {
        if (!img) return null;
        // If it's one of our bundled assets, it's already a processed URL
        if (typeof img.image === 'string' && (img.image.startsWith('http') || img.image.startsWith('data:') || img.image.startsWith('/static/') || img.image.startsWith('/assets/'))) {
            return img.image;
        }
        // If it's a dynamic image from backend
        if (img.isDynamic) {
            const path = img.image;
            if (path.startsWith('http')) return path;
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `${API_URL}${cleanPath}`;
        }
        // Fallback for static assets that might just be the imported object
        return img.image;
    };

    return (
        <div className="bg-white -mt-16 md:-mt-[4.5rem]">
            <Seo
                title="Gallery — School Life"
                description="Cultural days, science fairs, graduations, and the small quiet moments that make a legacy. See photos of school life at Best Legacy Divine School, Mowe."
                path="/gallery"
            />
            {/* Scattered-photo hero — deliberately different from every
                other page: a loose "spilled polaroids" cluster instead of
                one framed photo or a full-bleed background image. */}
            <section className="relative bg-paper overflow-hidden pt-28 md:pt-32 pb-20 md:pb-24">
                <div className="absolute inset-0 mesh-gradient-premium opacity-60 pointer-events-none" />
                <div className="relative max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-12 gap-y-16 gap-x-10 items-center">
                    <div className="md:col-span-6">
                        <Fade>
                            <Eyebrow>School life</Eyebrow>
                            <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-ink leading-[1.05] text-balance">
                                A look inside <span className="italic text-primary">Best Legacy</span>.
                            </h1>
                            <p className="mt-6 max-w-md text-gray-600 text-lg leading-relaxed">
                                Cultural days, science fairs, graduations, and the small quiet moments that make a legacy.
                            </p>
                        </Fade>
                    </div>

                    <div className="md:col-span-6 relative h-[300px] sm:h-[360px] md:h-[400px]">
                        <Fade delay={0.1} className="absolute top-0 left-2 sm:left-8 w-[46%] sm:w-[42%] aspect-[4/5] -rotate-6">
                            <div className="w-full h-full rounded-xl overflow-hidden shadow-card-lg border-4 border-white">
                                <img src={culturalImg} alt="Cultural day at Best Legacy" className="w-full h-full object-cover" />
                            </div>
                        </Fade>
                        <Fade delay={0.22} className="absolute top-4 right-0 w-[48%] sm:w-[44%] aspect-[3/4] rotate-4">
                            <div className="w-full h-full rounded-xl overflow-hidden shadow-card-lg border-4 border-white">
                                <img src="/school_library.jpg" alt="A pupil at work at Best Legacy" className="w-full h-full object-cover" />
                            </div>
                        </Fade>
                        <Fade delay={0.34} className="absolute bottom-0 left-10 sm:left-16 w-[42%] sm:w-[38%] aspect-square rotate-3">
                            <div className="w-full h-full rounded-xl overflow-hidden shadow-card-lg border-4 border-white">
                                <img src="/school_hero_Section.jpg" alt="Pupils smiling at Best Legacy" className="w-full h-full object-cover" />
                            </div>
                        </Fade>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {images.map((img, i) => (
                            <figure
                                key={img.id}
                                className={`group relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-lg transition ${i % 5 === 0 ? 'lg:row-span-2 aspect-[4/5]' : 'aspect-[4/3]'}`}
                            >
                                <img
                                    src={getImageUrl(img)}
                                    alt={img.alt || img.caption || 'Gallery Image'}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    onError={(e) => {
                                        if (!e.target.src.includes('placeholder')) {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image';
                                        }
                                    }}
                                />
                                <figcaption className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition">
                                    {img.alt || img.caption || 'Best Legacy Divine School'}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;
