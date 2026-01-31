'use client';

import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer>
      
      {/* Logo and Virtual Class Section */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="EduLink Hub Logo"
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-2xl font-bold">
                <span className="text-[#0D9488]">EduLink</span>
                <span className="text-gray-700">HUB</span>
              </span>
            </div>

            {/* Vertical Line Separator */}
            <div className="h-16 w-px bg-gray-300"></div>

            {/* Virtual Class for Zoom */}
            <div className="text-center">
              <p className="text-[#0D9488] font-semibold text-lg">
                Virtual Class
              </p>
              <p className="text-[#0D9488] font-semibold text-lg">
                for Zoom
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Subscribe to get our Newsletter
          </h3>

          {/* Email Input with Subscribe Button */}
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your Email"
              className="flex-1 px-6 py-3 border-2 border-[#0D9488] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 bg-white"
            />
            <button className="px-8 py-3 bg-[#0D9488] text-white rounded-full font-semibold hover:bg-[#0a7a6f] transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section - Links and Copyright */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3">
            {/* Links */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <a href="#" className="hover:text-[#0D9488] transition-colors">
                Careers
              </a>
              <span>|</span>
              <a href="#" className="hover:text-[#0D9488] transition-colors">
                Privacy Policy
              </a>
              <span>|</span>
              <a href="#" className="hover:text-[#0D9488] transition-colors">
                Terms & Conditions
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500">
              © 2025 EduLink Hub
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;