'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, User, Bell, Shield, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';

export default function StudentSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    location: '',
  });

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const { data: { user: userData } } = await supabase.auth.getUser();

      if (!userData) {
        router.push('/login');
        return;
      }

      setUser(userData);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

      setProfile(profileData);
      setProfileData({
        name: profileData?.name || '',
        bio: profileData?.bio || '',
        location: profileData?.location || '',
      });
      setEmailNotifications(profileData?.email_notifications ?? true);
      
      if (profileData?.avatar_url) {
        setAvatarPreview(profileData.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);

      let updateData: any = {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
      };

      // Upload avatar if provided
      if (avatarFile) {
        const avatarUrl = await uploadAvatar();
        if (avatarUrl) {
          updateData.avatar_url = avatarUrl;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      setAvatarFile(null);
      fetchUserData();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Password updated successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailNotificationsToggle = async () => {
    try {
      const newValue = !emailNotifications;
      setEmailNotifications(newValue);

      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Notification preferences updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating notifications:', err);
      setError('Failed to update preferences');
      setEmailNotifications(!emailNotifications);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
      setSaving(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Profile Settings */}
        <form onSubmit={handleProfileUpdate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User size={24} className="text-[#0D9488]" />
            <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
          </div>

          {/* Avatar Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Profile Picture
            </label>
            <div className="flex items-center gap-6">
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${profileData.name}&background=0D9488&color=fff&size=200`}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
              />
              <div className="flex gap-3">
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors inline-flex items-center gap-2 font-medium text-sm">
                    <Upload size={16} />
                    Change Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={saving}
                  />
                </label>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <input
                type="text"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                maxLength={160}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="A short bio about yourself"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">{profileData.bio.length}/160 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="City, Country"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <Mail size={18} className="text-gray-400" />
                <span className="text-gray-600">{user?.email}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-[#0D9488]" />
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="Enter new password"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="Confirm new password"
                disabled={saving}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-semibold disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={24} className="text-[#0D9488]" />
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <button
              onClick={handleEmailNotificationsToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? 'bg-[#0D9488]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 size={24} className="text-red-500" />
            <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          {deleteConfirm ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}