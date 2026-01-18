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
                title="School Gallery" 
                subtitle="Moments to remember."
                bgImage="/school_hero_Section.png"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Gallery</h2>
                    <p className="mt-4 text-xl text-gray-500">
                        Moments captured at Best Legacy Divine School.
                    </p>
                </div>
                
                {loading ? (
                    <div className="text-center py-20 text-gray-500 font-bold">Loading Gallery...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {images.map((img) => (
                            <div key={img.id} className="group relative shadow-lg rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition duration-300">
                                <div className="w-full h-64 bg-gray-200 overflow-hidden">
                                    <img 
                                        src={getImageUrl(img)} 
                                        alt={img.alt || img.caption || 'Gallery Image'} 
                                        className="w-full h-full object-center object-cover group-hover:scale-110 transition duration-500" 
                                        onError={(e) => {
                                            if (!e.target.src.includes('placeholder')) {
                                                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                            }
                                        }}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-transparent group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center text-center px-4">
                                    <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        {img.alt || img.caption || 'Best Legacy School'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;
