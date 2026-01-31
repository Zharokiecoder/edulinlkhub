"use client"

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, Clock, Send, CheckCircle } from 'lucide-react';

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function InstructorHelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const faqs: FAQ[] = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I create my first course?',
      answer: 'To create your first course, navigate to "My Courses" from the instructor dashboard and click the "Create Course" button. Fill in the course details including title, description, subject, difficulty level, and pricing. Upload a thumbnail image and click "Create Course" to publish.',
    },
    {
      id: 2,
      category: 'Course Management',
      question: 'How can I edit or update my course?',
      answer: 'Go to "My Courses" and find the course you want to edit. Click the "Edit" button on the course card. Make your desired changes and click "Save Changes" to update your course.',
    },
    {
      id: 3,
      category: 'Payments',
      question: 'When and how do I get paid?',
      answer: 'Payments are processed monthly on the 15th. You will receive your earnings minus the platform fee (15%) directly to your registered bank account or PayPal. You can track your earnings in the Earnings section.',
    },
    {
      id: 4,
      category: 'Students',
      question: 'How do I communicate with my students?',
      answer: 'You can communicate with your students through the Messages feature. Click on "Messages" in the sidebar to see all your conversations with enrolled students. You can also see student activity in the Students section.',
    },
    {
      id: 5,
      category: 'Course Management',
      question: 'Can I offer my course for free?',
      answer: 'Yes! When creating or editing a course, you can set the price to $0 to make it free. This is a great way to build your reputation and attract more students.',
    },
    {
      id: 6,
      category: 'Technical',
      question: 'What file formats are supported for course materials?',
      answer: 'We support video files (MP4, MOV), documents (PDF, DOCX), images (JPG, PNG, GIF), and presentations (PPTX). Maximum file size is 500MB per file.',
    },
    {
      id: 7,
      category: 'Schedule',
      question: 'How do I schedule live classes?',
      answer: 'Navigate to the "Schedule" page and click "Add Class". Select the date, time, course, and add a meeting link (Zoom, Google Meet, etc.). Students will be notified about the scheduled class.',
    },
    {
      id: 8,
      category: 'Payments',
      question: 'What is the platform fee?',
      answer: 'The platform charges a 15% fee on all course sales. This covers hosting, payment processing, and platform maintenance. You receive 85% of the course price.',
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const groupedFaqs = filteredFaqs.reduce((acc: Record<string, FAQ[]>, faq: FAQ) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support Center</h1>
        <p className="text-gray-600">Find answers to common questions or contact our support team</p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="p-3 bg-white/20 rounded-lg w-fit mb-4">
            <Mail size={24} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Email Support</h3>
          <p className="text-white/80 text-sm mb-4">Get help via email</p>
          <a href="mailto:support@edulinkhub.com" className="text-white hover:underline text-sm font-medium">
            support@edulinkhub.com
          </a>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="p-3 bg-white/20 rounded-lg w-fit mb-4">
            <Phone size={24} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
          <p className="text-white/80 text-sm mb-4">Call us anytime</p>
          <a href="tel:+1234567890" className="text-white hover:underline text-sm font-medium">
            +1 (234) 567-890
          </a>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="p-3 bg-white/20 rounded-lg w-fit mb-4">
            <MessageCircle size={24} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
          <p className="text-white/80 text-sm mb-4">Chat with support</p>
          <button className="text-white hover:underline text-sm font-medium">Start Chat</button>
        </div>
      </div>

      {/* Support Hours */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <Clock size={24} className="text-blue-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">Support Hours</p>
          <p className="text-sm text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM EST | Saturday: 10:00 AM - 4:00 PM EST</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* FAQs by Category */}
        <div className="space-y-6">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      {expandedFaq === faq.id ? (
                        <ChevronUp size={20} className="text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100 pt-4 bg-gray-50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No FAQs found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Still Need Help?</h2>
        <p className="text-gray-600 mb-6">Send us a message and we'll get back to you within 24 hours.</p>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Message Sent Successfully!</h3>
            <p className="text-green-700">We've received your message and will respond within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="What do you need help with?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="Describe your issue or question..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Send Message
            </button>
          </form>
        )}
      </div>

      {/* Popular Resources */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all">
            <h3 className="font-semibold text-gray-900 mb-1">Instructor Guide</h3>
            <p className="text-sm text-gray-600">Complete guide to creating successful courses</p>
          </a>
          <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all">
            <h3 className="font-semibold text-gray-900 mb-1">Video Tutorials</h3>
            <p className="text-sm text-gray-600">Step-by-step video guides for instructors</p>
          </a>
          <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all">
            <h3 className="font-semibold text-gray-900 mb-1">Best Practices</h3>
            <p className="text-sm text-gray-600">Tips for engaging students and boosting sales</p>
          </a>
          <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all">
            <h3 className="font-semibold text-gray-900 mb-1">Community Forum</h3>
            <p className="text-sm text-gray-600">Connect with other instructors and share ideas</p>
          </a>
        </div>
      </div>
    </div>
  );
}