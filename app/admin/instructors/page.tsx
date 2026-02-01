'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Mail, BookOpen, Calendar, UserPlus, Trash2, GraduationCap } from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  email: string;
  created_at: string;
  course_count?: number;
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      
      // Fetch all educators/instructors
      const { data: instructorsData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'educator')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each instructor, count their courses
      if (instructorsData && instructorsData.length > 0) {
        const instructorsWithCounts = await Promise.all(
          instructorsData.map(async (instructor: any) => {
            const { count } = await supabase
              .from('courses')
              .select('id', { count: 'exact', head: true })
              .eq('instructor_id', instructor.id);

            return {
              ...instructor,
              course_count: count || 0
            };
          })
        );

        setInstructors(instructorsWithCounts);
      } else {
        setInstructors([]);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInstructor = async () => {
    if (!newInstructor.name || !newInstructor.email || !newInstructor.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newInstructor.email,
        password: newInstructor.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile to set role as educator
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: newInstructor.name,
            role: 'educator'
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        alert('Instructor added successfully!');
        setShowAddModal(false);
        setNewInstructor({ name: '', email: '', password: '' });
        fetchInstructors();
      }
    } catch (error: any) {
      console.error('Error adding instructor:', error);
      alert('Failed to add instructor: ' + error.message);
    }
  };

  const handleDeleteInstructor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instructor? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Instructor deleted successfully');
      fetchInstructors();
    } catch (error: any) {
      console.error('Error deleting instructor:', error);
      alert('Failed to delete instructor: ' + error.message);
    }
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: instructors.length,
    totalCourses: instructors.reduce((sum, instructor) => sum + (instructor.course_count || 0), 0),
    avgCourses: instructors.length > 0 
      ? (instructors.reduce((sum, instructor) => sum + (instructor.course_count || 0), 0) / instructors.length).toFixed(1)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructors</h1>
        <p className="text-gray-600">Manage all educators</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Instructors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Courses/Instructor</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgCourses}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            Add Instructor
          </button>
        </div>
      </div>

      {/* Instructors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInstructors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No instructors found</p>
                    <p className="text-gray-400 text-sm">
                      {searchQuery 
                        ? 'Try adjusting your search' 
                        : 'Add your first instructor to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInstructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold mr-3">
                          {instructor.name?.charAt(0) || 'I'}
                        </div>
                        <span className="font-medium text-gray-900">{instructor.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{instructor.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(instructor.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-semibold text-gray-900">{instructor.course_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteInstructor(instructor.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Count */}
      {filteredInstructors.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredInstructors.length} of {instructors.length} instructors
        </div>
      )}

      {/* Add Instructor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Instructor</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newInstructor.name}
                  onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newInstructor.email}
                  onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="instructor@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newInstructor.password}
                  onChange={(e) => setNewInstructor({ ...newInstructor, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewInstructor({ name: '', email: '', password: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInstructor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Instructor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}