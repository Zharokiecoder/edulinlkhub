'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import {
  Search,
  BookOpen,
  MoreVertical,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronDown,
  Trash2,
  Eye,
  Users,
  Plus,
  GraduationCap,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description?: string;
  instructor_id?: string;
  created_at?: string;
}

interface CourseDetail extends Course {
  instructorName: string;
  enrolledStudents: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filtered, setFiltered] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CourseDetail | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', instructor_id: '' });
  const [addLoading, setAddLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    const supabase = getSupabaseClient();
    try {
      const [coursesRes, instructorsRes] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, name').eq('role', 'educator'),
      ]);
      setCourses(coursesRes.data || []);
      setFiltered(coursesRes.data || []);
      setInstructors((instructorsRes.data || []).map((i: any) => ({ id: i.id, name: i.name || i.email?.split('@')[0] || 'Unknown' })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFiltered(courses.filter((c) => c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)));
  }, [searchQuery, courses]);

  useEffect(() => {
    const handler = () => setActiveMenu(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const viewDetail = async (course: Course) => {
    const supabase = getSupabaseClient();
    try {
      const instructor = instructors.find((i) => i.id === course.instructor_id);
      
      // Fetch enrollments count only
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id);
      
      console.log('Enrollments count for', course.title, ':', enrollmentsCount);
      
      setSelected({
        ...course,
        instructorName: instructor?.name || 'Unassigned',
        enrolledStudents: enrollmentsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching course details:', error);
      const instructor = instructors.find((i) => i.id === course.instructor_id);
      setSelected({ 
        ...course, 
        instructorName: instructor?.name || 'Unassigned', 
        enrolledStudents: 0,
      });
    }
  };

  const handleAdd = async () => {
    if (!newCourse.title) { showToast('Please enter a course title.', 'error'); return; }
    setAddLoading(true);
    const supabase = getSupabaseClient();
    try {
      const { error } = await supabase.from('courses').insert({
        title: newCourse.title,
        description: newCourse.description || null,
        instructor_id: newCourse.instructor_id || null,
      });
      if (error) { showToast(error.message || 'Failed to create course.', 'error'); setAddLoading(false); return; }
      showToast('Course created successfully!', 'success');
      setNewCourse({ title: '', description: '', instructor_id: '' });
      setShowAddModal(false);
      await fetchData();
    } catch (err: any) { showToast(err?.message || 'An error occurred.', 'error'); }
    finally { setAddLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all enrollments and certificates for this course.')) {
      return;
    }
    
    const supabase = getSupabaseClient();
    try {
      await supabase.from('courses').delete().eq('id', id);
      showToast('Course removed successfully.', 'success');
      setActiveMenu(null);
      setSelected(null);
      await fetchData();
    } catch { showToast('Failed to delete course.', 'error'); }
  };

  const getInstructorName = (instructorId?: string) => {
    if (!instructorId) return 'Unassigned';
    const found = instructors.find((i) => i.id === instructorId);
    return found?.name || 'Unknown';
  };

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: '1200px' }}>
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg" style={{ background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', animation: 'slideIn 0.3s ease' }}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#fff', letterSpacing: '-0.02em' }}>Courses</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Manage all courses ({courses.length} total)</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-lg text-sm font-medium cursor-pointer" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none' }}>
          <Plus size={15} /> New Course
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: '#161922', border: '1px solid #1f2329' }}>
        <Search size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
        <input type="text" placeholder="Search by title or description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent outline-none text-sm flex-1" style={{ color: '#e5e7eb' }} />
        <div className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: '#6b7280' }}><Filter size={13} /> Filter <ChevronDown size={12} /></div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto"></div></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#161922', border: '1px solid #1f2329' }}>
          <BookOpen size={32} style={{ color: '#6b7280', margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: '#6b7280' }}>{searchQuery ? 'No courses match your search.' : 'No courses yet. Create one above.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, i) => (
            <div
              key={course.id}
              className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 relative"
              style={{ background: '#161922', border: '1px solid #1f2329' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f640'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1f2329'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Color strip */}
              <div style={{ height: '4px', background: `hsl(${(i * 60 + 200) % 360}, 60%, 50%)` }}></div>

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center justify-center rounded-lg mb-3" style={{ width: '40px', height: '40px', background: `hsl(${(i * 60 + 200) % 360}, 60%, 15%)` }}>
                    <BookOpen size={18} style={{ color: `hsl(${(i * 60 + 200) % 360}, 60%, 60%)` }} />
                  </div>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === course.id ? null : course.id); }} className="flex items-center justify-center rounded-lg cursor-pointer" style={{ width: '28px', height: '28px', color: '#6b7280' }}>
                      <MoreVertical size={15} />
                    </button>
                    {activeMenu === course.id && (
                      <div className="absolute right-0 top-7 rounded-lg shadow-lg z-10 py-1 overflow-hidden" style={{ background: '#1e2330', border: '1px solid #1f2329', minWidth: '150px' }}>
                        <button onClick={() => { setActiveMenu(null); viewDetail(course); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer text-left" style={{ color: '#e5e7eb' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <Eye size={14} /> View Details
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer text-left" style={{ color: '#f87171' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#fff' }}>{course.title}</h3>
                {course.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: '#6b7280' }}>{course.description}</p>}
                <div className="flex items-center gap-1 mt-3">
                  <GraduationCap size={12} style={{ color: '#6b7280' }} />
                  <span className="text-xs" style={{ color: '#6b7280' }}>{getInstructorName(course.instructor_id)}</span>
                </div>
              </div>

              {/* Click overlay to view detail */}
              <div onClick={() => viewDetail(course)} className="absolute inset-0 z-0" style={{ cursor: 'pointer' }}></div>
              <div className="relative z-10"></div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl w-full mx-4 overflow-hidden" style={{ background: '#161922', border: '1px solid #1f2329', maxWidth: '500px' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1f2329' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-lg" style={{ width: '42px', height: '42px', background: 'rgba(59,130,246,0.15)' }}>
                  <BookOpen size={20} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#fff' }}>{selected.title}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Taught by {selected.instructorName}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="cursor-pointer" style={{ color: '#6b7280' }}><X size={18} /></button>
            </div>
            {selected.description && (
              <div className="px-5 pt-4">
                <p className="text-xs" style={{ color: '#9ca3af' }}>{selected.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { label: 'Instructor', value: selected.instructorName, icon: GraduationCap, color: '#8b5cf6' },
                { label: 'Students', value: selected.enrolledStudents, icon: Users, color: '#10b981' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="rounded-lg p-3 text-center" style={{ background: '#111318', border: '1px solid #1f2329' }}>
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex items-center justify-center rounded-lg" style={{ width: '32px', height: '32px', background: item.color + '15' }}>
                        <Icon size={15} style={{ color: item.color }} />
                      </div>
                    </div>
                    <p className="text-sm font-bold" style={{ color: '#fff' }}>{item.value}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{item.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => handleDelete(selected.id)} className="flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-medium cursor-pointer" style={{ padding: '8px 0', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                <Trash2 size={14} /> Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl w-full mx-4 overflow-hidden" style={{ background: '#161922', border: '1px solid #1f2329', maxWidth: '440px' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1f2329' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#fff' }}>Create New Course</h2>
              <button onClick={() => setShowAddModal(false)} className="cursor-pointer" style={{ color: '#6b7280' }}><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>Course Title</label>
                <input type="text" placeholder="e.g. Mathematics 101" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors" style={{ background: '#111318', border: '1px solid #1f2329', color: '#e5e7eb' }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1f2329'; }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>Description (optional)</label>
                <textarea placeholder="Brief description of the course..." value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} rows={2} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors resize-none" style={{ background: '#111318', border: '1px solid #1f2329', color: '#e5e7eb' }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1f2329'; }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>Assign Instructor</label>
                <select value={newCourse.instructor_id} onChange={(e) => setNewCourse({ ...newCourse, instructor_id: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors appearance-none cursor-pointer" style={{ background: '#111318', border: '1px solid #1f2329', color: newCourse.instructor_id ? '#e5e7eb' : '#6b7280' }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1f2329'; }}>
                  <option value="" style={{ background: '#111318', color: '#6b7280' }}>Select an instructor...</option>
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id} style={{ background: '#111318', color: '#e5e7eb' }}>{inst.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAdd} disabled={addLoading} className="w-full rounded-lg text-sm font-medium cursor-pointer mt-1 flex items-center justify-center gap-2" style={{ padding: '10px 0', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', opacity: addLoading ? 0.6 : 1 }}>
                {addLoading ? <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div> : <><Plus size={15} /> Create Course</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}