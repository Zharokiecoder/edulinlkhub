"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, FileQuestion, Edit, Trash2, Save, X, Award, Clock, Target } from 'lucide-react';

export default function QuizManagementPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [course, setCourse] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit: 0,
    attempts_allowed: 3,
    is_required: true,
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 1,
  });

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
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
        alert('Course not found');
        router.push('/dashboard/instructor/courses');
        return;
      }

      setCourse(courseData);

      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      setQuizzes(quizzesData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchQuestions = async (quizId: string) => {
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    setQuestions(data || []);
  };

  const handleAddQuiz = async () => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .insert({
          course_id: courseId,
          title: formData.title,
          description: formData.description,
          passing_score: formData.passing_score,
          time_limit: formData.time_limit || null,
          attempts_allowed: formData.attempts_allowed || null,
          is_required: formData.is_required,
          order_index: quizzes.length,
        });

      if (error) throw error;

      alert('Quiz created! ✅');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert('Failed to create quiz: ' + error.message);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Delete this quiz? All questions and attempts will be deleted.')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
      alert('Quiz deleted! ✅');
      fetchData();
    } catch (error: any) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const handleAddQuestion = async () => {
    if (!showQuestionsModal) return;

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: showQuestionsModal.id,
          question_text: questionForm.question_text,
          question_type: questionForm.question_type,
          options: questionForm.question_type === 'multiple_choice' ? questionForm.options : null,
          correct_answer: questionForm.correct_answer,
          explanation: questionForm.explanation,
          points: questionForm.points,
          order_index: questions.length,
        });

      if (error) throw error;

      alert('Question added! ✅');
      resetQuestionForm();
      fetchQuestions(showQuestionsModal.id);
    } catch (error: any) {
      alert('Failed to add question: ' + error.message);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;

    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      fetchQuestions(showQuestionsModal.id);
    } catch (error: any) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      passing_score: 70,
      time_limit: 0,
      attempts_allowed: 3,
      is_required: true,
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 1,
    });
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Course Quizzes</h1>
              <p className="text-gray-600">{course?.title}</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Quiz
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {quizzes.length === 0 ? (
            <div className="p-12 text-center">
              <FileQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No quizzes yet</h3>
              <p className="text-gray-600 mb-6">Test your students' knowledge with quizzes</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Create Your First Quiz
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {quizzes.map((quiz, index) => (
                <div key={quiz.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{quiz.title}</h3>
                        {quiz.is_required && (
                          <span className="ml-3 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          {quiz.passing_score}% to pass
                        </span>
                        {quiz.time_limit && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {quiz.time_limit} min
                          </span>
                        )}
                        <span>
                          {quiz.attempts_allowed ? `${quiz.attempts_allowed} attempts` : 'Unlimited attempts'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setShowQuestionsModal(quiz);
                          fetchQuestions(quiz.id);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center text-sm"
                      >
                        <FileQuestion className="w-4 h-4 mr-2" />
                        Questions
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
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
      </div>

      {/* Add Quiz Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Create Quiz</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chapter 1 Assessment"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="What does this quiz cover?"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    value={formData.time_limit}
                    onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="0 = no limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attempts Allowed
                  </label>
                  <input
                    type="number"
                    value={formData.attempts_allowed}
                    onChange={(e) => setFormData({ ...formData, attempts_allowed: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="is_required" className="ml-3 text-sm text-gray-700">
                  Required (students must pass to complete course)
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuiz}
                disabled={!formData.title}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Create Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="p-6 border-b sticky top-0 bg-white z-10 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{showQuestionsModal.title}</h2>
                  <p className="text-sm text-gray-600">{questions.length} questions</p>
                </div>
                <button
                  onClick={() => {
                    setShowQuestionsModal(null);
                    setQuestions([]);
                    resetQuestionForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Add Question Form */}
              <div className="p-6 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-800 mb-4">Add Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={questionForm.question_text}
                      onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Question Type
                      </label>
                      <select
                        value={questionForm.question_type}
                        onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={questionForm.points}
                        onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {questionForm.question_type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Options (4 choices)
                      </label>
                      <div className="space-y-2">
                        {questionForm.options.map((option, index) => (
                          <input
                            key={index}
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...questionForm.options];
                              newOptions[index] = e.target.value;
                              setQuestionForm({ ...questionForm, options: newOptions });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Correct Answer *
                    </label>
                    {questionForm.question_type === 'multiple_choice' ? (
                      <select
                        value={questionForm.correct_answer}
                        onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select correct answer</option>
                        {questionForm.options.map((option, index) => (
                          <option key={index} value={option}>{option || `Option ${index + 1}`}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={questionForm.correct_answer}
                        onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="True">True</option>
                        <option value="False">False</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Explanation (optional)
                    </label>
                    <textarea
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Explain the correct answer..."
                    />
                  </div>

                  <button
                    onClick={handleAddQuestion}
                    disabled={!questionForm.question_text || !questionForm.correct_answer}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="p-6">
                {questions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No questions yet. Add your first question above.</p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                {index + 1}
                              </span>
                              <h4 className="font-semibold text-gray-800">{q.question_text}</h4>
                            </div>
                            {q.question_type === 'multiple_choice' && q.options && (
                              <div className="ml-11 space-y-1">
                                {q.options.map((opt: string, i: number) => (
                                  <p key={i} className={`text-sm ${opt === q.correct_answer ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                                    {opt} {opt === q.correct_answer && '✓'}
                                  </p>
                                ))}
                              </div>
                            )}
                            {q.question_type === 'true_false' && (
                              <p className="ml-11 text-sm text-green-600 font-semibold">
                                Correct: {q.correct_answer}
                              </p>
                            )}
                            {q.explanation && (
                              <p className="ml-11 text-sm text-gray-500 italic mt-2">
                                Explanation: {q.explanation}
                              </p>
                            )}
                            <p className="ml-11 text-xs text-gray-400 mt-1">
                              {q.points} {q.points === 1 ? 'point' : 'points'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
