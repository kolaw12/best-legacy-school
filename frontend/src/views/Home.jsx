import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative h-screen max-h-[600px] flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/school_hero_Section.png')" }}></div>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-down">
            Best Legacy Divine School
          </h1>
          <p className="text-xl md:text-2xl mb-8 animate-fade-in-up">
            Excellence in Spirit and Mind
          </p>
          <div className="space-x-4">
            <Link to="/admissions" className="bg-secondary text-primary font-bold py-3 px-8 rounded-full hover:bg-yellow-400 transition transform hover:scale-105">
              Apply Now
            </Link>
            <Link to="/about" className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-primary transition transform hover:scale-105">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
                <img src="/school_hero_Section.png" alt="School Principal" className="rounded-lg shadow-xl w-full object-cover h-96" />
                {/* Note: In a real app, use a specific principal/welcome image */}
            </div>
            <div className="md:w-1/2">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
                    Welcome to Best Legacy Divine School
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    At Best Legacy Divine School, we believe that every child is a unique gift capable of achieving greatness. Our mission is to provide a nurturing environment where academic excellence meets spiritual growth.
                </p>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    We are dedicated to raising future leaders who are not only intellectually sound but also morally upright. Join us in this journey of transforming lives and building a legacy of excellence.
                </p>
                <div className="flex items-center">
                    <div className="text-lg font-bold text-primary">Mrs. Olusola Kolawole</div>
                    <span className="mx-2 text-gray-400">|</span>
                    <div className="text-gray-500">School Principal</div>
                </div>
            </div>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Us?</h2>
            <p className="mt-4 text-gray-500">We provide a holistic education for your child.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300">
              <div className="text-primary text-4xl mb-4">
                <i className="fas fa-book-reader"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Quality Education</h3>
              <p className="text-gray-600">Our curriculum is designed to challenge and inspire students to reach their full potential.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300">
              <div className="text-primary text-4xl mb-4">
                <i className="fas fa-praying-hands"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Moral Foundation</h3>
              <p className="text-gray-600">We instill strong moral values and spiritual guidance in every student.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300">
              <div className="text-primary text-4xl mb-4">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Experienced Staff</h3>
              <p className="text-gray-600">Our dedicated teachers are experts in their fields and committed to student success.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary py-16 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                      <div className="text-4xl font-bold mb-2">16+</div>
                      <div className="text-gray-100">Years of Excellence</div>
                  </div>
                  <div>
                      <div className="text-4xl font-bold mb-2">500+</div>
                      <div className="text-gray-100">Happy Students</div>
                  </div>
                  <div>
                      <div className="text-4xl font-bold mb-2">50+</div>
                      <div className="text-gray-100">Expert Teachers</div>
                  </div>
                  <div>
                      <div className="text-4xl font-bold mb-2">100%</div>
                      <div className="text-gray-100">Success Rate</div>
                  </div>
              </div>
          </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">What Parents Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="text-yellow-400 flex">
                            {[...Array(5)].map((_, index) => (
                                <svg key={index} className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                            ))}
                        </div>
                    </div>
                    <p className="text-gray-600 mb-6 italic">"Best Legacy Divine School has been a blessing to our family. The teachers are incredibly supportive and the environment is perfect for learning."</p>
                    <div className="font-bold text-gray-900">- Parent Name {i}</div>
                </div>
             ))}
          </div>
        </div>
      </div>

       {/* Call to Action */}
       <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
                Ready to Give Your Child the Best Start?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Applications are now open for the upcoming academic session. Secure a spot for your child today!
            </p>
            <div className="space-x-4">
                <Link to="/admissions" className="inline-block bg-secondary text-primary font-bold py-3 px-8 rounded-full hover:bg-yellow-400 transition duration-300">
                    Apply for Admission
                </Link>
                <Link to="/contact" className="inline-block bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-primary transition duration-300">
                    Contact Us
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
