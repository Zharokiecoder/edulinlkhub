"use client"

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { DollarSign, TrendingUp, Calendar, Download, CreditCard, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Transaction {
  id: string;
  student: string;
  course: string;
  amount: number;
  date: string;
  status: string;
}

interface Earnings {
  total: number;
  thisMonth: number;
  lastMonth: number;
  pending: number;
}

export default function InstructorEarningsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<Earnings>({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
  });
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Mock revenue data for charts
  const revenueData = [
    { month: 'Jan', revenue: 4500, students: 45 },
    { month: 'Feb', revenue: 5200, students: 52 },
    { month: 'Mar', revenue: 4800, students: 48 },
    { month: 'Apr', revenue: 6100, students: 61 },
    { month: 'May', revenue: 7200, students: 72 },
    { month: 'Jun', revenue: 8500, students: 85 },
  ];

  const courseRevenueData = [
    { name: 'Web Development', value: 35, revenue: 12500 },
    { name: 'Data Science', value: 25, revenue: 8900 },
    { name: 'UI/UX Design', value: 20, revenue: 7100 },
    { name: 'Mobile Dev', value: 15, revenue: 5300 },
    { name: 'Others', value: 5, revenue: 1900 },
  ];

  const COLORS = ['#0D9488', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];

  useEffect(() => {
    fetchEarnings();
    fetchTransactions();
  }, [filter]);

  const fetchEarnings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch enrollments for instructor's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, price')
        .eq('instructor_id', session.user.id);

      if (courses) {
        const courseIds = courses.map(c => c.id);
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id, enrolled_at')
          .in('course_id', courseIds);

        if (enrollments) {
          const total = enrollments.reduce((sum, e) => {
            const course = courses.find(c => c.id === e.course_id);
            return sum + (course?.price || 0);
          }, 0);

          const thisMonth = enrollments.filter(e => {
            const date = new Date(e.enrolled_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).reduce((sum, e) => {
            const course = courses.find(c => c.id === e.course_id);
            return sum + (course?.price || 0);
          }, 0);

          setEarnings({
            total,
            thisMonth,
            lastMonth: total - thisMonth,
            pending: thisMonth * 0.1, // 10% pending
          });
        }
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, price')
        .eq('instructor_id', session.user.id);

      if (courses) {
        const courseIds = courses.map(c => c.id);
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, students:student_id(name, email)')
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false })
          .limit(20);

        if (enrollments) {
          const formattedTransactions: Transaction[] = enrollments.map(e => {
            const course = courses.find(c => c.id === e.course_id);
            return {
              id: e.id,
              student: e.students?.name || 'Unknown',
              course: course?.title || 'Unknown Course',
              amount: course?.price || 0,
              date: new Date(e.enrolled_at).toLocaleDateString(),
              status: Math.random() > 0.2 ? 'completed' : 'pending',
            };
          });
          setTransactions(formattedTransactions);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const percentageChange = earnings.lastMonth > 0
    ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1)
    : '0';

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings</h1>
          <p className="text-gray-600">Track your revenue and payouts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign size={24} />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs ${
              parseFloat(percentageChange) >= 0 ? 'text-green-200' : 'text-red-200'
            }`}>
              {parseFloat(percentageChange) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(parseFloat(percentageChange))}%
            </div>
          </div>
          <p className="text-white/80 text-sm mb-1">Total Earnings</p>
          <p className="text-3xl font-bold">${earnings.total.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar size={24} className="text-blue-600" />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <p className="text-gray-600 text-sm mb-1">This Month</p>
          <p className="text-3xl font-bold text-gray-900">${earnings.thisMonth.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Last Month</p>
          <p className="text-3xl font-bold text-gray-900">${earnings.lastMonth.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <CreditCard size={24} className="text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Pending Payout</p>
          <p className="text-3xl font-bold text-gray-900">${earnings.pending.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0D9488"
                strokeWidth={3}
                dot={{ fill: '#0D9488', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Course Revenue Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue by Course</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseRevenueData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {courseRevenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {courseRevenueData.map((course, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-600">{course.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">${course.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Course</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{transaction.student}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-700">{transaction.course}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900">${transaction.amount.toFixed(2)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-600">{transaction.date}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}