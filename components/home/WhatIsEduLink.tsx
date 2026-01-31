'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

const WhatIsEduLink = () => {
  return (
    <section className="py-16 md:py-24 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-[#FF9500]">What is </span>
            <span className="text-[#0D9488]">EDULINK HUB?</span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            EduLink is an online platform that helps African educators, students, and freelancers find remote teaching 
            and academic jobs around the world. It connects skilled teachers with people who need help learning, 
            writing school projects, or creating presentation slides. On EduLink, educators can set up online classes, 
            upload course materials, give assignments and tests, grade work, and give feedback to students.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* For Instructors Card */}
          <div className="relative h-100 rounded-2xl overflow-hidden group">
            {/* Background Image */}
            <Image
              src="/images/instructor.png"
              alt="For Instructors"
              fill
              className="object-cover"
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-all duration-300"></div>
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center p-8 text-white z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                FOR INSTRUCTORS
              </h3>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900"
              >
                Start class today
              </Button>
            </div>
          </div>

          {/* For Students Card */}
          <div className="relative h-100 rounded-2xl overflow-hidden group">
            {/* Background Image */}
            <Image
              src="/images/student.png"
              alt="For Students"
              fill
              className="object-cover"
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-all duration-300"></div>
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center p-8 text-white z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                FOR STUDENTS
              </h3>
              <Button 
                variant="teal"
                size="lg"
                className="bg-[#0D9488] hover:bg-[#0a7a6f]"
              >
                Explore Services
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsEduLink;