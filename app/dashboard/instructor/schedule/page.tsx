"use client"

import React, { useState } from 'react';
import { Calendar, Clock, Video, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function InstructorSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock scheduled classes
  const scheduledClasses = [
    {
      id: 1,
      title: 'Web Development - Live Session',
      course: 'Introduction to Web Development',
      date: '2026-01-15',
      time: '10:00 AM',
      duration: '1 hour',
      students: 25,
      meetingLink: 'https://zoom.us/j/123456789',
    },
    {
      id: 2,
      title: 'JavaScript Fundamentals Q&A',
      course: 'JavaScript Mastery',
      date: '2026-01-18',
      time: '2:00 PM',
      duration: '45 mins',
      students: 18,
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 3,
      title: 'React Hooks Workshop',
      course: 'React Advanced',
      date: '2026-01-20',
      time: '11:00 AM',
      duration: '2 hours',
      students: 30,
      meetingLink: 'https://zoom.us/j/987654321',
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule</h1>
          <p className="text-gray-600">Manage your live classes and sessions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add Class
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}
          
          {[...Array(startingDayOfWeek)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasClass = scheduledClasses.some(c => c.date === dateStr);
            const isToday = new Date().getDate() === day && 
                           new Date().getMonth() === currentDate.getMonth() && 
                           new Date().getFullYear() === currentDate.getFullYear();
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                  isToday 
                    ? 'bg-teal-600 text-white font-bold' 
                    : hasClass
                    ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>{day}</span>
                {hasClass && !isToday && (
                  <div className="w-1 h-1 bg-teal-600 rounded-full mt-1"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Upcoming Classes</h3>
        <div className="space-y-4">
          {scheduledClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-50 rounded-lg">
                  <Calendar size={24} className="text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{classItem.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{classItem.course}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{new Date(classItem.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{classItem.time} ({classItem.duration})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video size={14} />
                      <span>{classItem.students} students</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                
                  <a href={classItem.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                >
                  Join Meeting
                </a>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule New Class</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., React Hooks Workshop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  <option>Select a course</option>
                  <option>Web Development</option>
                  <option>JavaScript Mastery</option>
                  <option>React Advanced</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Schedule Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}