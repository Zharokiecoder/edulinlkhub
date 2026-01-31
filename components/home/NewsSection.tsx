'use client';

import React from 'react';
import Image from 'next/image';

const NewsSection = () => {
  const featuredNews = {
    id: 1,
    image: '/images/news-featured.jpg',
    badge: 'NEWS',
    title: 'EduLink adds $30 million to its balance sheet for a Zoom-friendly edtech solution',
    description: 'EduLink, launched less than a year ago by Blackboard co-founder Michael Chasen, integrates exclusively...',
    link: '#',
  };

  const sideNews = [
    {
      id: 2,
      image: '/images/news-2.jpg',
      badge: 'PRESS RELEASE',
      title: 'EduLink closes $30 Million Series A Financing to Meet High Demand',
      description: 'Class Technologies Inc., the company that created Class...',
    },
    {
      id: 3,
      image: '/images/news-3.jpg',
      badge: 'NEWS',
      title: "Zoom's earliest investors are betting millions on a better Zoom for schools",
      description: 'Zoom was never created to be a consumer product. Nonetheless, the...',
    },
    {
      id: 4,
      image: '/images/news-4.jpg',
      badge: 'NEWS',
      title: 'Former Blackboard CEO Raises $16M to Bring LMS Features to Zoom Classrooms',
      description: 'This year, investors have reaped big financial returns from betting on Zoom...',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0D9488]">
            Lastest News and Resources
          </h2>
          <p className="text-gray-600 text-lg">
            See the developments that have occurred to EduLink Hub in the world
          </p>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Featured News - Left */}
          <div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              {/* Featured Image */}
              <div className="relative h-64">
                <Image
                  src={featuredNews.image}
                  alt={featuredNews.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Badge */}
                <span className="inline-block px-4 py-1 bg-[#0D9488] text-white text-xs font-semibold rounded-full mb-4">
                  {featuredNews.badge}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {featuredNews.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {featuredNews.description}
                </p>

                {/* Read More Link */}
                <a 
                  href={featuredNews.link}
                  className="text-[#0D9488] font-semibold text-sm hover:underline"
                >
                  Read more
                </a>
              </div>
            </div>
          </div>

          {/* Side News - Right */}
          <div className="space-y-6">
            {sideNews.map((news) => (
              <div 
                key={news.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden">
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Badge */}
                    <span className="inline-block px-3 py-1 bg-[#0D9488] text-white text-xs font-semibold rounded-full mb-2">
                      {news.badge}
                    </span>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-gray-900 mb-2 leading-tight">
                      {news.title}
                    </h4>

                    {/* Description */}
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                      {news.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default NewsSection;