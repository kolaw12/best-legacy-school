import { useState, useEffect } from 'react';
import axios from 'axios';
import PageHero from '../components/PageHero';
import API_URL from '../config/api';

import funPool from '../assets/fun_in_the_pool.jpg';
import staffImg from '../assets/staff_members.jpg';
import ceremonyImg from '../assets/school_ceremony.jpg';
import groupImg from '../assets/group_celebration.jpg';
import culturalImg from '../assets/cultural_day.jpg';

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchImages();
    }, []);

    const staticImages = [
        { id: 's1', image: funPool, alt: 'Fun in the pool' },
        { id: 's2', image: staffImg, alt: 'Our dedicated staff' },
        { id: 's3', image: ceremonyImg, alt: 'Students at a school ceremony' },
        { id: 's4', image: groupImg, alt: 'Group celebration' },
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
        <div className="bg-white">
            <PageHero
                eyebrow="SCHOOL LIFE"
                title="A look inside Best Legacy."
                subtitle="Cultural days, science fairs, graduations, and the small quiet moments that make a legacy."
                bgImage="/group_celebration.jpg"
            />

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
