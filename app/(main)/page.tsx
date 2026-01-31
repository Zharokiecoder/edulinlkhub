import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import SuccessStats from '@/components/home/SuccessStats';
import FeaturesSection from '@/components/home/FeaturesSection';
import WhatIsEduLink from '@/components/home/WhatIsEduLink';
import PlatformFeatures from '@/components/home/PlatformFeatures';
import AdditionalFeatures from '@/components/home/AdditionalFeatures';
import CoursesSection from '@/components/home/CoursesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import NewsSection from '@/components/home/NewsSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <SuccessStats />
      <FeaturesSection />
      <WhatIsEduLink />
      <PlatformFeatures />
      <AdditionalFeatures />
      <CoursesSection />
      <TestimonialsSection />
      <NewsSection />
    </>
  );
}