'use client';

import React from 'react';
import Image from 'next/image';
import { LayoutGrid, BookOpen, Users } from 'lucide-react';

const PlatformFeatures = () => {
  return (
    <section className="py-16 md:py-24 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* First Feature: Everything you can do */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          {/* Text Content - Left */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-[#0D9488]">Everything you can do in a physical classroom, </span>
              <span className="text-[#FF9500]">you can do with EduLink</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              EduLink Hub empowers African educators to seamlessly manage class scheduling, student attendance, secure payments, and virtual classrooms — all in one easy-to-use cloud-based platform.
            </p>
            <a href="#" className="text-[#0D9488] font-semibold hover:underline">
              Learn more →
            </a>
          </div>

          {/* Image - Right */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/images/classroom-feature.jpg"
                alt="Virtual Classroom"
                width={600}
                height={300}
                className="w-full h-75 object-cover"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-16 h-16 bg-[#0D9488] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0a7a6f] transition-all hover:scale-110">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Our Features Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-[#0D9488]">Our </span>
            <span className="text-[#FF9500]">Features</span>
          </h2>
          <p className="text-gray-600 text-lg">
            This very extraordinary feature, can make learning activities more efficient
          </p>
        </div>

        {/* User Interface Feature */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          {/* Image/Mockup - Left */}
          <div className="relative">
            <div className="relative">
              <Image
                src="/images/ui-mockup.png"
                alt="User Interface"
                width={500}
                height={500}
                className="w-full h-auto"
              />
              {/* Buttons at bottom left */}
              <div className="absolute bottom-8 left-8 flex gap-3">
                <button className="px-6 py-2 bg-[#0D9488] text-white rounded-full font-medium hover:bg-[#0a7a6f] transition-all">
                  Present
                </button>
                <button className="px-6 py-2 bg-[#FF9500] text-white rounded-full font-medium hover:bg-[#e08600] transition-all flex items-center gap-2">
                  <span>📞</span> Call
                </button>
              </div>
            </div>
          </div>

          {/* Text Content - Right */}
          <div>
            <h3 className="text-3xl font-bold mb-8">
              <span className="text-[#FF9500]">A user interface </span>
              <span className="text-[#0D9488]">designed for E-learning services</span>
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center">
                    <LayoutGrid className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  EduLink provides a clear and organized interface where educators can manage lessons, share materials, and stay focused without distractions.
                </p>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 bg-[#FF9500] rounded-lg flex items-center justify-center">
                    <BookOpen className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Easily see all students, track attendance, monitor engagement, and manage class data
                </p>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center">
                    <Users className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Schedule sessions, upload assignments, grade submissions, and communicate with students
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How EduLink Stands Out */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          {/* Text Content - Left */}
          <div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-[#0D9488]">How EduLink </span>
              <span className="text-[#FF9500]">Stands Out</span>
            </h3>
            
            <ul className="space-y-4 text-gray-600">
              <li className="flex gap-3">
                <span className="text-[#0D9488] mt-1">•</span>
                <span>Combine academic tutoring, digital skills, scholarship mentorship and creative learning for different age groups.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#0D9488] mt-1">•</span>
                <span>Offer private one-on-one video classes, in-app payments, and student progress tracking</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#0D9488] mt-1">•</span>
                <span>We stand out by blending education with practical life skills and mentorship, creating a supportive space for academic and personal growth.</span>
              </li>
            </ul>
          </div>

          {/* Image - Right */}
          <div className="relative">
            <Image
              src="/images/Teacher.png"
              alt="How EduLink Stands Out"
              width={500}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Assessments, Quizzes, Tests */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image/Quiz Mockup - Left */}
          <div className="relative">
            <Image
              src="/images/quiz.png"
              alt="Assessments and Quizzes"
              width={500}
              height={500}
              className="w-full h-auto"
            />
          </div>

          {/* Text Content - Right */}
          <div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-[#0D9488]">Assessments, Quizzes, </span>
              <span className="text-[#FF9500]">Tests</span>
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Easily launch live assignments, quizzes, and tests. Student results are automatically entered in the online gradebook.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PlatformFeatures;