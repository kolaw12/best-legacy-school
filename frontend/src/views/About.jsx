import PageHero from '../components/PageHero';

const About = () => {
    return (
        <div className="bg-white">
            <PageHero
                title="About Us"
                subtitle="Learn about our rich history and vision for the future."
                bgImage="/school_hero_Section.png"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mt-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                            <h3 className="text-2xl font-bold text-primary mb-4">Our Mission</h3>
                            <p className="text-gray-600 text-lg">
                                To provide a nurturing environment that fosters academic excellence, moral integrity, 
                                and spiritual development, preparing students to be responsible leaders of tomorrow.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                            <h3 className="text-2xl font-bold text-primary mb-4">Our Vision</h3>
                            <p className="text-gray-600 text-lg">
                                To be a world-class institution aiming for the highest standards in education 
                                and character building, recognized for producing well-rounded individuals.
                            </p>
                        </div>
                    </div>

                    <div className="mt-12">
                         <h3 className="text-2xl font-bold text-gray-900 mb-4">Our History</h3>
                         <p className="text-gray-600 leading-relaxed">
                             Best Legacy Divine School was founded with a passion for quality education. 
                             Over the years, we have grown from a small nursery center to a full-fledged primary school, 
                             dedicated to laying a solid foundation for every child. Our commitment to excellence 
                             remains unwavering as we continue to shape young minds.
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
