'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Search, Plus, Eye, Ban, Trash2 } from 'lucide-react'

type Student = {
  id: string
  name: string
  email: string
  created_at: string
  courses_completed: number
  certificates_earned: number
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredStudents(
        students.filter(
          s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredStudents(students)
    }
  }, [searchTerm, students])

  async function fetchStudents() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false })

    setStudents(data || [])
    setFilteredStudents(data || [])
    setLoading(false)
  }

  async function handleAddStudent() {
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      alert('Please fill all fields')
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newStudent.email,
      password: newStudent.password,
    })

    if (authError) {
      alert('Error creating student: ' + authError.message)
      return
    }

    if (authData.user) {
      await supabase.from('profiles').update({ name: newStudent.name, role: 'student' }).eq('id', authData.user.id)
    }

    setShowAddModal(false)
    setNewStudent({ name: '', email: '', password: '' })
    fetchStudents()
  }

  async function handleRemoveStudent(id: string) {
    if (!confirm('Remove this student permanently?')) return

    await supabase.from('profiles').delete().eq('id', id)
    fetchStudents()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-600 mt-1">Manage all registered students</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No students found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Courses</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Certificates</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.courses_completed || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.certificates_earned || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-700 p-1 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add New Student</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={newStudent.name}
              onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={newStudent.email}
              onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={newStudent.password}
              onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Student Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-slate-600">Name:</span>
                <p className="text-slate-900">{selectedStudent.name}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-600">Email:</span>
                <p className="text-slate-900">{selectedStudent.email}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-600">Joined:</span>
                <p className="text-slate-900">{new Date(selectedStudent.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-600">Courses Completed:</span>
                <p className="text-slate-900">{selectedStudent.courses_completed || 0}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-600">Certificates Earned:</span>
                <p className="text-slate-900">{selectedStudent.certificates_earned || 0}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStudent(null)}
              className="mt-6 w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}