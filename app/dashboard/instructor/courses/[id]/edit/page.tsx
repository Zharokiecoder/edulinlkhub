'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    level: 'beginner',
    price: '',
    status: 'draft',
    thumbnail_url: '',
  });

  const subjects = [
    'Computer Science',
    'Mathematics',
    'English',
    'Science',
    'Business',
    'Art & Design',
    'Music',
    'Language',
    'Engineering',
    'Marketing',
    'Other'
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('instructor_id', user.id)
        .single();

      if (error) throw error;

      if (!data) {
        alert('Course not found or you do not have permission to edit it');
        router.push('/dashboard/instructor/courses');
        return;
      }

      setFormData({
        title: data.title,
        description: data.description,
        subject: data.subject,
        level: data.level,
        price: data.price.toString(),
        status: data.status,
        thumbnail_url: data.thumbnail_url || '',
      });

      if (data.thumbnail_url) {
        setThumbnailPreview(data.thumbnail_url);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setFormData({ ...formData, thumbnail_url: '' });
  };

  const uploadThumbnail = async (userId: string): Promise<string | null> => {
    if (!thumbnailFile) return null;

    try {
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${courseId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, thumbnailFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || !formData.description || !formData.subject || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      let updateData: any = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        level: formData.level,
        price: price,
        status: formData.status,
      };

      // Upload new thumbnail if provided
      if (thumbnailFile) {
        const thumbnailUrl = await uploadThumbnail(user.id);
        if (thumbnailUrl) {
          updateData.thumbnail_url = thumbnailUrl;
        }
      } else if (!thumbnailPreview) {
        // If thumbnail was removed
        updateData.thumbnail_url = null;
      }

      const { error: updateError } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId);

      if (updateError) throw updateError;

      // Create activity
      await supabase
        .from('activities')
        .insert([
          {
            user_id: user.id,
            title: 'Course Updated',
            description: `You updated the course: ${formData.title}`,
            type: 'update',
          },
        ]);

      // Redirect to courses list
      router.push('/dashboard/instructor/courses');
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      router.push('/dashboard/instructor/courses');
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course');
      setSaving(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/instructor/courses"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
              <p className="text-sm text-gray-500">Update your course details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Main Content Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Course Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="e.g., Introduction to Web Development"
                disabled={saving}
                required
              />
            </div>

            {/* Course Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition resize-none"
                placeholder="Describe what students will learn in this course..."
                disabled={saving}
                required
              />
            </div>

            {/* Subject and Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                  disabled={saving}
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                  disabled={saving}
                  required
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Price (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                  placeholder="0.00"
                  disabled={saving}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set to $0 for a free course
              </p>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Thumbnail
              </label>
              
              {thumbnailPreview ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-300">
                  <Image
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={saving}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0D9488] transition-colors">
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    PNG, JPG or WEBP (MAX. 5MB)
                  </p>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors inline-block">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                disabled={saving}
              >
                <option value="draft">Draft - Not visible to students</option>
                <option value="active">Active - Visible to students</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            {/* Delete Button */}
            {deleteConfirm ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold disabled:opacity-50"
              >
                <Trash2 size={20} />
                Delete Course
              </button>
            )}

            {/* Save/Cancel Buttons */}
            <div className="flex gap-4">
              <Link
                href="/dashboard/instructor/courses"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}