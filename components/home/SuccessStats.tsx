'use client';

import React from 'react';
import { Users, Award, BookOpen, TrendingUp } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '15K+',
    label: 'Active Students',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    icon: Award,
    value: '75%',
    label: 'Total success',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  {
    icon: BookOpen,
    value: '35',
    label: 'Main questions',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: TrendingUp,
    value: '26',
    label: 'Chief experts',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

const SuccessStats = () => {
  return (
    <section className="relative bg-[#FFF8F0]">
      {/* Curved top border - creates concave curve upward */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-white">
        <svg 
          className="absolute bottom-0 w-full h-24" 
          preserveAspectRatio="none" 
          viewBox="0 0 1440 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M0,0 Q720,100 1440,0 L1440,100 L0,100 Z" 
            fill="#FFF8F0"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-16 md:pb-24">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="text-[#0D9488]">Our </span>
            <span className="text-[#FF9500]">Success</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Empowering thousands of learners and educators worldwide
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${stat.bgColor} mb-4`}>
                  <Icon className={stat.color} size={28} />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SuccessStats;