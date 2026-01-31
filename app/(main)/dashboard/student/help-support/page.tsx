'use client';

import React, { useState } from 'react';
import { Search, HelpCircle, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Send } from 'lucide-react';

export default function StudentHelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const faqs = [
    {
      id: 1,
      question: 'How do I enroll in a course?',
      answer: 'To enroll in a course, browse the courses page, select the course you want, and click the "Enroll Now" button. For paid courses, you\'ll need to complete the payment process first.',
    },
    {
      id: 2,
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'Yes! We offer a 30-day money-back guarantee for all paid courses. If you\'re not satisfied within 30 days of enrollment, contact our support team for a full refund.',
    },
    {
      id: 3,
      question: 'How do I access my course materials?',
      answer: 'Once enrolled, you can access your course materials by going to the Learning page in your dashboard. All your enrolled courses will be listed there with their lessons and content.',
    },
    {
      id: 4,
      question: 'How do I contact my instructor?',
      answer: 'You can contact your instructor through the Messages section in your dashboard. Simply select the instructor from your conversations list or start a new conversation.',
    },
    {
      id: 5,
      question: 'How do I download my certificate?',
      answer: 'After completing a course with 100% progress, you can download your certificate from the Certifications page. Click the "Download" button on the respective course certificate.',
    },
    {
      id: 6,
      question: 'Can I access courses on mobile devices?',
      answer: 'Yes! EduLink Hub is fully responsive and works on all devices. You can access your courses on smartphones, tablets, and desktop computers.',
    },
    {
      id: 7,
      question: 'How do I update my profile information?',
      answer: 'Go to Settings in your dashboard to update your profile information, including your name, bio, avatar, and other personal details.',
    },
    {
      id: 8,
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through our payment partners.',
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the message to support
    alert('Support ticket submitted! We\'ll get back to you within 24 hours.');
    setContactForm({ subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D9488] to-[#0a7a6f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <HelpCircle size={64} className="mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-xl text-white/90 mb-8">
            Search our knowledge base or contact support
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help articles..."
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - FAQs */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>

            {filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </h3>
                      {expandedFaq === faq.id ? (
                        <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <Search size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try different keywords or contact our support team
                </p>
              </div>
            )}

            {/* Contact Form */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Still need help? Contact us
              </h2>
              <form onSubmit={handleSubmitContact} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="What do you need help with?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your issue in detail..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-semibold"
                  >
                    <Send size={18} />
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Contact Options */}
          <div className="space-y-6">
            {/* Quick Contact Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Contact Support</h3>
              <div className="space-y-4">
                <a
                  href="mailto:support@edulinkhub.com"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Email Us</p>
                    <p className="text-xs text-gray-600">support@edulinkhub.com</p>
                  </div>
                </a>

                <a
                  href="tel:+1234567890"
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Call Us</p>
                    <p className="text-xs text-gray-600">+1 (234) 567-890</p>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Live Chat</p>
                    <p className="text-xs text-gray-600">Available 24/7</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Support Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-semibold text-gray-900">9AM - 6PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-semibold text-gray-900">10AM - 4PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-semibold text-gray-900">Closed</span>
                </div>
              </div>
            </div>

            {/* Popular Resources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Popular Resources</h3>
              <div className="space-y-3">
                <a href="#" className="block text-sm text-[#0D9488] hover:underline">
                  Getting Started Guide
                </a>
                <a href="#" className="block text-sm text-[#0D9488] hover:underline">
                  Course Enrollment Tutorial
                </a>
                <a href="#" className="block text-sm text-[#0D9488] hover:underline">
                  Payment & Refund Policy
                </a>
                <a href="#" className="block text-sm text-[#0D9488] hover:underline">
                  Technical Requirements
                </a>
                <a href="#" className="block text-sm text-[#0D9488] hover:underline">
                  Certificate Information
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}