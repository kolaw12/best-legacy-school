import PageHero from '../components/PageHero';

const Gallery = () => {
    // Placeholder images - in real app would fetch from API
    const images = [
        { id: 1, src: 'https://via.placeholder.com/400x300?text=School+Building', alt: 'School Building' },
        { id: 2, src: 'https://via.placeholder.com/400x300?text=Classroom', alt: 'Classroom' },
        { id: 3, src: 'https://via.placeholder.com/400x300?text=Playground', alt: 'Playground' },
        { id: 4, src: 'https://via.placeholder.com/400x300?text=Lab', alt: 'Computer Lab' },
        { id: 5, src: 'https://via.placeholder.com/400x300?text=Library', alt: 'Library' },
        { id: 6, src: 'https://via.placeholder.com/400x300?text=Students', alt: 'Happy Students' },
    ];

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((img) => (
                        <div key={img.id} className="group relative shadow-lg rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition duration-300">
                            <div className="w-full h-64 bg-gray-200 overflow-hidden">
                                <img src={img.src} alt={img.alt} className="w-full h-full object-center object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition duration-300 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-lg">{img.alt}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Gallery;
