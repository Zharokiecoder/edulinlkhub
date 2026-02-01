'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Mastering English Grammar & Writing',
    description: 'Build strong writing and grammar skills through engaging lessons and on-demand practice.',
    price: '$20 per hour',
    rating: 5,
    image: '/images/english-course.jpg',
    icon: '📚',
    categories: [
      { name: 'Writing a Short Essay', color: 'bg-orange-500' },
      { name: 'Common Grammar Mistakes', color: 'bg-pink-400' },
      { name: 'Tenses in Action', color: 'bg-amber-700' },
      { name: 'Paragraph Writing', color: 'bg-orange-400' },
      { name: 'Sentence Structures', color: 'bg-purple-400' },
      { name: 'Punctuation Power', color: 'bg-blue-500' },
      { name: 'Part Of Speech Mastery', color: 'bg-teal-500' },
    ]
  },
  {
    id: 2,
    title: 'Math Made Easy: Numbers, Logic & Problem Solving',
    description: '5-student max, hour-long classes with innovative lessons in addition, logic, and puzzles.',
    price: '$25 per hour',
    rating: 5,
    image: '/images/math-course.jpg',
    icon: '🎲',
    categories: [
      { name: 'Logic Games', color: 'bg-orange-600' },
      { name: 'Math Puzzles', color: 'bg-pink-400' },
      { name: 'Measurement & Data', color: 'bg-orange-700' },
      { name: 'Geometry Basics', color: 'bg-orange-400' },
      { name: 'Decimals & Percentages', color: 'bg-cyan-700' },
      { name: 'Addition, Subtraction', color: 'bg-blue-500' },
      { name: 'Number Sense', color: 'bg-cyan-400' },
    ]
  },
  {
    id: 3,
    title: 'Creative Writing for Young Explorers',
    description: 'Spark imagination through storytelling, character building, and creative writing.',
    price: '$18 per hour',
    rating: 5,
    image: '/images/writing-course.jpg',
    icon: '✍️',
    categories: [
      { name: 'Publishing', color: 'bg-orange-500' },
      { name: 'Poetry', color: 'bg-pink-400' },
      { name: 'Writing Different Genres', color: 'bg-amber-700' },
      { name: 'Story Structures', color: 'bg-yellow-400' },
      { name: 'Setting the Scene', color: 'bg-teal-500' },
      { name: 'Creating Characters', color: 'bg-blue-400' },
      { name: 'What Made a Story', color: 'bg-emerald-400' },
    ]
  },
];

// Reusable pill component
const Pill = ({ category }: { category: { name: string; color: string } }) => (
  <div className="relative shrink-0">
    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-[70%] h-4 bg-green-400/40 rounded-full blur-md"></div>
    <div
      className={`${category.color} text-white rounded-full shadow-xl relative`}
      style={{
        width: '55px',
        height: '220px',
        transform: 'rotate(-10deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        className="text-sm font-semibold tracking-wide"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
        }}
      >
        {category.name}
      </span>
    </div>
  </div>
);

// Reusable course card component
const CourseCard = ({ course, fullWidth }: { course: typeof courses[0]; fullWidth?: boolean }) => (
  <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${fullWidth ? 'w-full' : 'w-112.5'}`}>
    <div className="flex gap-6 p-6">
      <div className="relative w-40 h-full shrink-0 rounded-xl overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          width={160}
          height={200}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex flex-col justify-between flex-1">
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h4>
          <p className="text-gray-600 text-xs mb-3 leading-relaxed">{course.description}</p>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              {[...Array(course.rating)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-sm">⭐</span>
              ))}
            </div>
            <p className="text-gray-900 font-bold text-base">{course.price}</p>
          </div>
        </div>
        <button className="bg-[#0D9488] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#0a7a6f] transition-all w-auto">
          EXPLORE NOW
        </button>
      </div>
    </div>
  </div>
);

// Mobile pills row - horizontally scrollable
const MobilePills = ({ categories }: { categories: typeof courses[0]['categories'] }) => (
  <div className="overflow-x-auto pb-6 px-4">
    <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
      {categories.map((category, i) => (
        <Pill key={i} category={category} />
      ))}
    </div>
  </div>
);

const CoursesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-[#0D9488]">Explore Course</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl">
            Discover engaging, tutor-led lessons in Math, English, and Creative Writing — all designed to boost your child&apos;s skills and confidence.
          </p>
        </div>

        {/* Courses List */}
        <div className="space-y-16">
          {courses.map((course, index) => (
            <div key={course.id}>
              {/* Course Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{course.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                </div>
                <a
                  href="#"
                  className="flex items-center gap-2 text-[#0D9488] font-semibold hover:underline"
                >
                  SEE ALL <ArrowRight size={20} />
                </a>
              </div>

              {/* ===== MOBILE LAYOUT (card only, pills hidden) ===== */}
              <div className="lg:hidden">
                <CourseCard course={course} fullWidth />
              </div>

              {/* ===== DESKTOP LAYOUT ===== */}
              {index === 0 ? (
                // English: Pills on left, Card on right
                <div className="hidden lg:grid grid-cols-12 gap-8 items-center">
                  {/* Pills Section - Left */}
                  <div className="col-span-12 lg:col-span-7">
                    <div className="bg-gray-100 rounded-3xl p-8 min-h-70 flex items-center justify-center">
                      <div className="flex items-center gap-4 justify-center">
                        {course.categories.map((category, catIdx) => (
                          <Pill key={catIdx} category={category} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Course Card - Right */}
                  <div className="col-span-12 lg:col-span-5">
                    <CourseCard course={course} />
                  </div>
                </div>
              ) : (
                // Math & Creative Writing: Pills split around card
                <div className="hidden lg:block relative">
                  <div className="bg-gray-100 rounded-3xl p-8 min-h-70 flex items-center justify-center gap-8">
                    {/* Left Pills */}
                    <div className="flex items-center gap-4">
                      {course.categories.slice(0, index === 1 ? 4 : 1).map((category, catIdx) => (
                        <Pill key={catIdx} category={category} />
                      ))}
                    </div>

                    {/* Course Card - Center */}
                    <div className="shrink-0 z-10">
                      <CourseCard course={course} />
                    </div>

                    {/* Right Pills */}
                    <div className="flex items-center gap-4">
                      {course.categories.slice(index === 1 ? 4 : 1).map((category, catIdx) => (
                        <Pill key={catIdx} category={category} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CoursesSection;