'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { FileText, Calendar, Users } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Remote Teaching Opportunities',
    description: 'Join EduLink to connect with students globally and earn money by teaching online from the comfort of your home. Set your schedule, create your class, and start impacting lives today.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
  },
  {
    icon: Calendar,
    title: 'Offer Academic Support & Scholarship mentorship',
    description: 'Use your skills to help students succeed—write research projects, create presentation slides, assist with assignments or offer scholarship mentorship.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500',
  },
  {
    icon: Users,
    title: 'Upgrade Your Digital Teaching Skills',
    description: 'Enroll in our training programs to learn how to teach effectively online. Gain the tools and confidence you need to thrive in the remote education space.',
    color: 'text-teal-700',
    bgColor: 'bg-teal-600',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-[#0D9488]">Empower Learning, </span>
            <span className="text-[#FF9500]">Anywhere.</span>
          </h2>
          <p className="text-gray-600 text-lg">
            EduLink is a platform that connects educators and students globally for remote teaching, 
            project support, and academic services—all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="relative">
                {/* Icon positioned at top center, half outside card */}
                <div className="flex justify-center -mb-10 relative z-10">
                  <div className={`w-20 h-20 rounded-full ${feature.bgColor} flex items-center justify-center shadow-lg`}>
                    <Icon className="text-white" size={36} />
                  </div>
                </div>
                
                {/* Card */}
                <Card 
                  hover 
                  shadow="lg"
                  className="pt-16 group"
                >
                  <CardHeader>
                    <CardTitle className="text-xl text-center">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;