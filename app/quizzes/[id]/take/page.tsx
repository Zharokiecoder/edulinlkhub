"use client"

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Award, CheckCircle, XCircle } from 'lucide-react';

export default function QuizTakingPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.id as string;

  const supabase = getSupabaseClient(); // ✅ Use shared client

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const fetchQuiz = async () => {
    try {
      // ✅ Use getSession() instead of getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No session in quiz page:', sessionError);
        router.push('/login');
        return;
      }
      
      const currentUser = session.user;
      setUser(currentUser);

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) {
        console.error('Error fetching quiz:', quizError);
        setLoading(false);
        return;
      }

      console.log('QUIZZES LOADED:', quizData);
      setQuiz(quizData);

      if (quizData?.time_limit) {
        setTimeLeft(quizData.time_limit * 60);
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
      }

      setQuestions(questionsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchQuiz:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || submitted) return;

    setSubmitted(true);

    let totalPoints = 0;
    let earnedPoints = 0;
    const resultsData: any[] = [];

    questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) {
        earnedPoints += question.points;
      }

      resultsData.push({
        questionId: question.id,
        question: question.question_text,
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation,
        points: question.points,
      });
    });

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= (quiz?.passing_score || 70);

    console.log('💾 Saving quiz attempt:', {
      quiz_id: quizId,
      student_id: user.id,
      course_id: quiz.course_id,
      score: score,
      total_points: totalPoints,
      passed: passed,
    });

    const { error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: user.id,
        course_id: quiz.course_id,
        score: score,
        total_points: totalPoints,
        passed: passed,
        answers: answers,
        completed_at: new Date().toISOString(),
        time_taken: quiz?.time_limit ? (quiz.time_limit * 60) - (timeLeft || 0) : null,
      });

    if (error) {
      console.error('❌ Error saving attempt:', error);
    } else {
      console.log('✅ Quiz attempt saved successfully!');
    }

    setResults({
      score,
      passed,
      earnedPoints,
      totalPoints,
      details: resultsData,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz not found</h2>
          <button
            onClick={() => router.push('/dashboard/student/learning')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

  if (submitted && results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => router.push(`/courses/${quiz.course_id}/watch`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Course
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="text-center">
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                results.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {results.passed ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${
                results.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.passed ? 'Congratulations!' : 'Not Passed'}
              </h1>
              <p className="text-gray-600 mb-6">
                You scored {results.earnedPoints} out of {results.totalPoints} points
              </p>
              <div className="text-5xl font-bold text-gray-800 mb-2">
                {Math.round(results.score)}%
              </div>
              <p className="text-gray-600">
                Passing score: {quiz?.passing_score || 70}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Answers</h2>
            <div className="space-y-6">
              {results.details.map((result: any, index: number) => (
                <div
                  key={result.questionId}
                  className={`p-4 rounded-lg border-2 ${
                    result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 flex-1">
                      Question {index + 1}: {result.question}
                    </h3>
                    {result.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">Your Answer:</span>{' '}
                      <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                        {result.userAnswer || 'Not answered'}
                      </span>
                    </p>
                    {!result.isCorrect && (
                      <p>
                        <span className="font-semibold">Correct Answer:</span>{' '}
                        <span className="text-green-700">{result.correctAnswer}</span>
                      </p>
                    )}
                    {result.explanation && (
                      <p className="text-gray-600 italic mt-2">
                        💡 {result.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => router.push(`/courses/${quiz.course_id}/watch`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Learning
            </button>
            {!results.passed && quiz?.attempts_allowed && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.push(`/courses/${quiz?.course_id}/watch`)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Course
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{quiz?.title}</h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            {timeLeft !== null && (
              <div className={`flex items-center ${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {currentQuestion && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion.question_text}
              </h2>

              <div className="space-y-3">
                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options ? (
                  currentQuestion.options.map((option: string, index: number) => (
                    <label
                      key={index}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                        answers[currentQuestion.id] === option
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-gray-800">{option}</span>
                    </label>
                  ))
                ) : (
                  <div className="space-y-3">
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      answers[currentQuestion.id] === 'True'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value="True"
                        checked={answers[currentQuestion.id] === 'True'}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-gray-800">True</span>
                    </label>
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      answers[currentQuestion.id] === 'False'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value="False"
                        checked={answers[currentQuestion.id] === 'False'}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-gray-800">False</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center flex-wrap gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="text-sm text-gray-600">
              {Object.keys(answers).length} of {questions.length} answered
            </div>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center transition-colors"
              >
                <Award className="w-5 h-5 mr-2" />
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}