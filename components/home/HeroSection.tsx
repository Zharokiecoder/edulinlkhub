'use client';

import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-[#FF9500]">Remote Teaching.</span>
                <br />
                <span className="text-[#0D5F5C]">Smarter Learning.</span>
              </h1>
              <p className="text-lg text-[#0D5F5C] leading-relaxed max-w-xl">
                Find expert tutors, online classes, project help,
                <br />
                and more — all in one place.
              </p>
            </div>

            {/* CTA Links */}
            <div className="flex flex-wrap items-center gap-6">
              <a 
                href="#join" 
                className="text-[#0D5F5C] font-semibold text-lg hover:text-[#0A4A48] transition-colors"
              >
                Join for free
              </a>
              <a 
                href="#video"
                className="flex items-center gap-2 text-gray-700 font-medium text-lg hover:text-[#0D5F5C] transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[#0D5F5C] flex items-center justify-center group-hover:bg-[#0A4A48] transition-colors">
                  <Play size={20} fill="white" className="text-white ml-1" />
                </div>
                Watch how it works
              </a>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative z-10">
              <div className="aspect-4/5 rounded-3xl overflow-hidden relative">
                <Image
                  src="/images/hero image.png"
                  alt="EduLink Student"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-orange-50/30 to-transparent -z-10"></div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;