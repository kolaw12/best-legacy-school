import { useState, useEffect } from 'react';
import axios from 'axios';
import PageHero from '../components/PageHero';
import API_URL from '../config/api';

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchImages();
    }, []);

    const staticImages = [
        { id: 's1', image: '/fun_in_the_pool.jpg', alt: 'Fun in the pool' },
        { id: 's2', image: '/staff_members.jpg', alt: 'Our dedicated staff' },
        { id: 's3', image: '/school_ceremony.jpg', alt: 'Students at a school ceremony' },
        { id: 's4', image: '/group_celebration.jpg', alt: 'Group celebration' },
        { id: 's5', image: '/cultural_day.jpg', alt: 'Cultural day performance' },
    ];

    const fetchImages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/gallery/`);
            setImages([...staticImages, ...response.data]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching gallery images:', error);
            setImages(staticImages);
            setLoading(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        
        // Handle images in the public folder (starting with /)
        if (path.startsWith('/')) {
            return path;
        }
        
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${API_URL}${cleanPath}`;
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
                                        src={getImageUrl(img.image)} 
                                        alt={img.alt || 'Gallery Image'} 
                                        className="w-full h-full object-center object-cover group-hover:scale-110 transition duration-500" 
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                        }}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition duration-300 flex items-center justify-center">
                                    <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-lg">{img.alt || 'Best Legacy School'}</span>
                                </div>
                            </div>
                        ))}
                        {images.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-400 italic">
                                No memories shared yet. Check back soon!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;
