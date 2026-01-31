"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Video, Edit, Trash2, Clock, Eye, Save, X, FileText, Upload } from 'lucide-react';

export default function CourseLessonsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'video',
    video_url: '',
    video_type: 'youtube',
    pdf_file: null as File | null,
    pdf_url: '',
    duration: 0,
    is_free: false,
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseAndLessons();
    }
  }, [courseId]);

  const fetchCourseAndLessons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('instructor_id', user.id)
        .single();

      if (!courseData) {
        alert('Course not found or unauthorized');
        router.push('/dashboard/instructor/courses');
        return;
      }

      setCourse(courseData);

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      setLessons(lessonsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const getVideoType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'direct';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, pdf_file: file });
    } else {
      alert('Please select a PDF file');
    }
  };

  const uploadPDF = async () => {
    if (!formData.pdf_file) return null;

    try {
      setUploading(true);
      const fileName = `${courseId}/${Date.now()}_${formData.pdf_file.name}`;
      
      const { data, error } = await supabase.storage
        .from('course-materials')
        .upload(fileName, formData.pdf_file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(fileName);

      setUploading(false);
      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF: ' + error.message);
      setUploading(false);
      return null;
    }
  };

  const handleAddLesson = async () => {
    try {
      let pdfUrl = formData.pdf_url;
      
      if (formData.content_type === 'pdf' && formData.pdf_file) {
        pdfUrl = await uploadPDF() || '';
        if (!pdfUrl) return;
      }

      const videoType = formData.content_type === 'video' ? getVideoType(formData.video_url) : null;
      
      const { error } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title: formData.title,
          description: formData.description,
          content_type: formData.content_type,
          video_url: formData.content_type === 'video' ? formData.video_url : null,
          video_type: videoType,
          pdf_url: formData.content_type === 'pdf' ? pdfUrl : null,
          duration: formData.duration * 60,
          is_free: formData.is_free,
          order_index: lessons.length,
        });

      if (error) throw error;

      alert('Lesson added successfully! ✅');
      setShowAddModal(false);
      resetForm();
      fetchCourseAndLessons();
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to add lesson: ' + error.message);
    }
  };

  const handleUpdateLesson = async () => {
    try {
      let pdfUrl = formData.pdf_url;
      
      if (formData.content_type === 'pdf' && formData.pdf_file) {
        pdfUrl = await uploadPDF() || '';
        if (!pdfUrl) return;
      }

      const { error } = await supabase
        .from('lessons')
        .update({
          title: formData.title,
          description: formData.description,
          content_type: formData.content_type,
          video_url: formData.content_type === 'video' ? formData.video_url : null,
          video_type: formData.content_type === 'video' ? getVideoType(formData.video_url) : null,
          pdf_url: formData.content_type === 'pdf' ? pdfUrl : null,
          duration: formData.duration * 60,
          is_free: formData.is_free,
        })
        .eq('id', editingLesson.id);

      if (error) throw error;

      alert('Lesson updated successfully! ✅');
      setEditingLesson(null);
      resetForm();
      fetchCourseAndLessons();
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to update lesson: ' + error.message);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      alert('Lesson deleted! ✅');
      fetchCourseAndLessons();
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to delete lesson: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'video',
      video_url: '',
      video_type: 'youtube',
      pdf_file: null,
      pdf_url: '',
      duration: 0,
      is_free: false,
    });
  };

  const openEditModal = (lesson: any) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type || 'video',
      video_url: lesson.video_url || '',
      video_type: lesson.video_type || 'youtube',
      pdf_file: null,
      pdf_url: lesson.pdf_url || '',
      duration: Math.floor(lesson.duration / 60),
      is_free: lesson.is_free,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Courses
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Course Lessons</h1>
              <p className="text-gray-600">{course?.title}</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Lesson
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {lessons.length === 0 ? (
            <div className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No lessons yet</h3>
              <p className="text-gray-600 mb-6">Start building your course by adding lessons</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Add Your First Lesson
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className={`w-12 h-12 ${lesson.content_type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}>
                        {lesson.content_type === 'pdf' ? (
                          <FileText className="w-6 h-6 text-red-600" />
                        ) : (
                          <Video className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{lesson.title}</h3>
                          {lesson.is_free && (
                            <span className="ml-3 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              Free Preview
                            </span>
                          )}
                          <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                            {lesson.content_type}
                          </span>
                        </div>
                        {lesson.description && (
                          <p className="text-gray-600 text-sm mb-2">{lesson.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(lesson.duration)}
                          </span>
                          {lesson.content_type === 'video' && (
                            <span className="capitalize">{lesson.video_type}</span>
                          )}
                          <span>Lesson {index + 1}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(lesson)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">Total Lessons: <strong>{lessons.length}</strong></span>
            <span className="text-blue-800">
              Videos: <strong>{lessons.filter(l => l.content_type === 'video').length}</strong>
            </span>
            <span className="text-blue-800">
              PDFs: <strong>{lessons.filter(l => l.content_type === 'pdf').length}</strong>
            </span>
            <span className="text-blue-800">
              Free Previews: <strong>{lessons.filter(l => l.is_free).length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingLesson) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLesson(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: 'video' })}
                    className={`p-4 rounded-lg border-2 transition ${
                      formData.content_type === 'video'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className={`w-8 h-8 mx-auto mb-2 ${formData.content_type === 'video' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="font-semibold">Video</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, content_type: 'pdf' })}
                    className={`p-4 rounded-lg border-2 transition ${
                      formData.content_type === 'pdf'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className={`w-8 h-8 mx-auto mb-2 ${formData.content_type === 'pdf' ? 'text-red-600' : 'text-gray-400'}`} />
                    <p className="font-semibold">PDF Document</p>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to React Hooks"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description..."
                />
              </div>

              {/* Video URL or PDF Upload */}
              {formData.content_type === 'video' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video URL *
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports YouTube, Vimeo, or direct video links
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload PDF *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Click to upload PDF
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.pdf_file ? formData.pdf_file.name : 'PDF files only, max 10MB'}
                      </p>
                    </label>
                  </div>
                  {formData.pdf_url && !formData.pdf_file && (
                    <p className="text-xs text-green-600 mt-2">✓ PDF already uploaded</p>
                  )}
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                  min="0"
                />
              </div>

              {/* Free Preview */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_free" className="ml-3 text-sm text-gray-700">
                  Allow free preview (students can access without enrolling)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLesson(null);
                  resetForm();
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={editingLesson ? handleUpdateLesson : handleAddLesson}
                disabled={!formData.title || (formData.content_type === 'video' ? !formData.video_url : !formData.pdf_file && !formData.pdf_url) || uploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}