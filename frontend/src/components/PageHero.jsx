import React from 'react';

const PageHero = ({ title, subtitle, bgImage }) => {
    return (
        <div className="relative h-64 md:h-80 flex items-center justify-center text-white bg-primary">
            {bgImage && (
                <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url('${bgImage}')` }}
                ></div>
            )}
            <div className="absolute inset-0 bg-black opacity-60"></div>
            <div className="relative z-10 text-center px-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 animate-fade-in-down">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-lg md:text-xl text-gray-200 animate-fade-in-up">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PageHero;
