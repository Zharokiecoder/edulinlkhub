"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Search, Filter, Star, MapPin, Globe, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Tutor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
  location: string;
  experience: string;
  rating: number;
  reviews: number;
  students: number;
  courses: number;
  subjects: string[];
  skills: string[];
}

export default function StudentTutorsPage() {
  const router = useRouter();
  const supabase = getSupabaseClient(); // ✅ Use shared client

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      // Get all educators/instructors
      const { data, error } = await supabase
        .from('profiles')
        .select('*, courses(id, title, subject)')
        .eq('role', 'educator');

      if (error) {
        console.error('Error fetching tutors:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Format tutors data
        const formattedTutors: Tutor[] = data.map((tutor: any) => {
          const courseCount = tutor.courses?.length || 0;
          const subjects = [...new Set(tutor.courses?.map((c: any) => c.subject).filter(Boolean))];

          return {
            id: tutor.id,
            name: tutor.name || 'Instructor',
            email: tutor.email,
            avatar: tutor.avatar_url,
            bio: tutor.bio || 'Experienced instructor',
            location: tutor.location || 'Online',
            experience: tutor.experience || '3+ years',
            rating: 4.5 + Math.random() * 0.5, // Mock rating - replace with real data when available
            reviews: Math.floor(Math.random() * 100) + 20,
            students: Math.floor(Math.random() * 500) + 50,
            courses: courseCount,
            subjects: subjects.length > 0 ? subjects : ['General'],
            skills: tutor.skills || [],
          };
        });

        setTutors(formattedTutors);
      }
    } catch (error) {
      console.error('Error in fetchTutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (tutorId: string) => {
    // Navigate to messages page with tutor ID as query parameter
    router.push(`/dashboard/student/messages?instructorId=${tutorId}`);
  };

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || 
                          tutor.subjects.some(s => s.toLowerCase().includes(filterSubject.toLowerCase()));
    return matchesSearch && matchesSubject;
  });

  // Get unique subjects for filter
  const allSubjects = [...new Set(tutors.flatMap(t => t.subjects))];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Tutor</h1>
        <p className="text-gray-600">Connect with expert instructors worldwide</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tutors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            >
              <option value="all">All Subjects</option>
              {allSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tutors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutors.length > 0 ? (
          filteredTutors.map((tutor) => (
            <div key={tutor.id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center mb-4">
                {tutor.avatar ? (
                  <Image
                    src={tutor.avatar}
                    alt={tutor.name}
                    width={80}
                    height={80}
                    className="rounded-full mb-3 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                    {tutor.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="font-bold text-lg text-gray-900">{tutor.name}</h3>
                <p className="text-sm text-gray-500">{tutor.experience} experience</p>
              </div>

              {/* Bio */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tutor.bio}</p>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" />
                    <span className="text-gray-900 font-medium">{tutor.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({tutor.reviews} reviews)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe size={14} />
                  <span>{tutor.students} students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{tutor.location}</span>
                </div>
              </div>

              {/* Subjects */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.slice(0, 3).map((subject, i) => (
                    <span key={i} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium">
                      {subject}
                    </span>
                  ))}
                  {tutor.subjects.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{tutor.subjects.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSendMessage(tutor.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <MessageSquare size={16} />
                  <span className="text-sm font-medium">Send Message</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500">
            <p className="text-lg font-semibold mb-2">No tutors found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Show total count */}
      {filteredTutors.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredTutors.length} of {tutors.length} tutors
        </div>
      )}
    </div>
  );
}