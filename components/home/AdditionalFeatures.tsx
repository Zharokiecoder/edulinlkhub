'use client';

import React from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

const AdditionalFeatures = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Class Management Tools */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          {/* Text Content - Left */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-[#FF9500]">Class Management </span>
              <span className="text-[#0D9488]">Tools for Educators</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              EduLink provides tools to help run and manage the class such as Class Roster, Attendance, and more. With the Gradebook, teachers can review and grade tests and quizzes in real-time.
            </p>
          </div>

          {/* Gradebook Mockup - Right */}
          <div className="relative">
            <Image
              src="/images/gradebook.png"
              alt="Gradebook"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* One-on-One Private Classes */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Private Classes Mockup - Left */}
          <div className="relative">
            <Image
              src="/images/privateclass.jpg"
              alt="One-on-One Private Classes"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>

          {/* Text Content - Right */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-[#FF9500]">One-on-One </span>
              <span className="text-[#FF9500]">Private Classes</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Educators can hold one-on-one private classes with students directly within the EduLink platform without leaving the virtual classroom.
            </p>
          </div>
        </div>

        {/* See More Features Button */}
        <div className="text-center">
          <Button 
            variant="outline"
            size="lg"
            className="border-2 border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488] hover:text-white"
          >
            See more features
          </Button>
        </div>

      </div>
    </section>
  );
};

export default AdditionalFeatures;