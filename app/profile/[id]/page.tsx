'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, Users, BookOpen, Award, Mail, MapPin, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ViewProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsOwnProfile(user?.id === userId);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (!profileData) {
        alert('Profile not found');
        router.push('/');
        return;
      }

      setProfile(profileData);

      // If educator, fetch their courses
      if (profileData.role === 'educator') {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);

        setCourses(coursesData || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            {isOwnProfile && (
              <Link
                href={`/profile/${userId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-medium"
              >
                <Edit size={18} />
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.name}&background=0D9488&color=fff&size=200`}
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
              />
              {profile.role === 'educator' && (
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#0D9488] rounded-full flex items-center justify-center border-4 border-white">
                  <Award size={20} className="text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <span className="px-3 py-1 bg-[#0D9488]/10 text-[#0D9488] rounded-full text-sm font-semibold capitalize">
                  {profile.role}
                </span>
              </div>

              {profile.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Stats for Educators */}
              {profile.role === 'educator' && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {profile.average_rating?.toFixed(1) || '5.0'}
                    </span>
                    <span className="text-gray-500">
                      ({profile.total_reviews || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span>{profile.total_students || 0} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen size={18} />
                    <span>{profile.total_courses || 0} courses</span>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        {profile.about && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 whitespace-pre-line">{profile.about}</p>
          </div>
        )}

        {/* Experience Section (Educators) */}
        {profile.role === 'educator' && profile.experience && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>
            <p className="text-gray-700 whitespace-pre-line">{profile.experience}</p>
          </div>
        )}

        {/* Education Section */}
        {profile.education && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>
            <p className="text-gray-700 whitespace-pre-line">{profile.education}</p>
          </div>
        )}

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Courses Section (Educators) */}
        {profile.role === 'educator' && courses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
              {courses.length > 6 && (
                <Link
                  href={`/courses?instructor=${userId}`}
                  className="text-[#0D9488] hover:text-[#0a7a6f] font-semibold"
                >
                  View All
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-[#0D9488] transition-colors group"
                >
                  <div className="relative h-40 bg-gray-200">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">📚</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0D9488] transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users size={14} />
                        <span>{course.total_students || 0}</span>
                      </div>
                      <div className="font-bold text-[#0D9488]">
                        {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for No Courses */}
        {profile.role === 'educator' && courses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? 'Start creating courses to share your knowledge'
                : 'This instructor hasn\'t created any courses yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}