'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react';

export default function StudentNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [filterType, activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActivities(data || []);
      setFilteredActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    if (filterType === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(a => a.type === filterType));
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setActivities(activities.map(a => ({ ...a, read: true })));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setActivities(activities.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setActivities([]);
    } catch (error) {
      console.error('Error clearing activities:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return '📚';
      case 'achievement':
        return '🏆';
      case 'message':
        return '💬';
      case 'update':
        return '🔔';
      default:
        return '📌';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">
                {activities.length} notification{activities.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activities.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    <CheckCheck size={18} />
                    Mark all as read
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    <Trash2 size={18} />
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        {activities.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-4">
              <Filter size={20} className="text-gray-400" />
              <div className="flex gap-2">
                {['all', 'update', 'enrollment', 'achievement', 'message'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === type
                        ? 'bg-[#0D9488] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {filteredActivities.length > 0 ? (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md group ${
                  activity.read ? 'border-gray-200' : 'border-[#0D9488] bg-[#0D9488]/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {activity.title}
                      </h3>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {getTimeAgo(activity.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {activity.description}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteActivity(activity.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <Bell size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filterType === 'all' ? 'No notifications yet' : `No ${filterType} notifications`}
            </h3>
            <p className="text-gray-600">
              {filterType === 'all' 
                ? 'Your notifications will appear here'
                : 'Try selecting a different filter'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}