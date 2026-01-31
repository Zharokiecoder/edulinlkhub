'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Gloria Rose',
    image: '/images/testimonial-1.jpg',
    quote: 'Thank you so much for your help. It\'s exactly what I\'ve been looking for. You won\'t regret it. It really saves me time and effort. EduLink is exactly what you need in your educational journey.',
    rating: 5,
    reviews: '12 reviews at Yelp',
  },
  // Add more testimonials as needed
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 md:py-24 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div>
            {/* Label */}
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-3">
              TESTIMONIAL
            </p>

            {/* Heading */}
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#0D9488]">
              What They Say?
            </h2>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <p className="text-gray-600 leading-relaxed">
                EduLink Hub has got more than 100k positive ratings from our users around the world.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Some of the students and teachers were greatly helped by the Skilline.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Are you too? Please give your assessment
              </p>
            </div>

            {/* Input Field */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Write your assessment"
                className="flex-1 px-6 py-3 border-2 border-[#0D9488] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
              />
              <button className="w-12 h-12 bg-white border-2 border-[#0D9488] rounded-full flex items-center justify-center hover:bg-[#0D9488] hover:text-white transition-all">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Right Side - Testimonial Card */}
          <div className="relative">
            {/* Student Image */}
            <div className="relative">
              <div className="relative z-10">
                <Image
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  width={400}
                  height={500}
                  className="rounded-3xl object-cover"
                />
              </div>

              {/* Quote Card - Positioned at bottom right */}
              <div className="absolute bottom-0 -right-8 bg-white rounded-2xl shadow-2xl p-6 z-20 max-w-md">
                {/* Orange vertical bar */}
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-linear-to-b from-orange-400 to-red-400 rounded-full"></div>
                
                <div className="pl-6">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    &ldquo;{currentTestimonial.quote}&rdquo;
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 mb-1">
                        {currentTestimonial.name}
                      </p>
                      {/* Stars */}
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(currentTestimonial.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-xs">⭐</span>
                        ))}
                      </div>
                      <p className="text-gray-500 text-xs">
                        {currentTestimonial.reviews}
                      </p>
                    </div>

                    {/* Navigation Arrow */}
                    <button 
                      className="w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all"
                      onClick={() => setCurrentIndex((currentIndex + 1) % testimonials.length)}
                    >
                      <ChevronRight size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;