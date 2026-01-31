'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newSkill, setNewSkill] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    about: '',
    location: '',
    experience: '',
    education: '',
    skills: [] as string[],
  });

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        alert('Unauthorized');
        router.push('/');
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setFormData({
        name: profileData.name || '',
        bio: profileData.bio || '',
        about: profileData.about || '',
        location: profileData.location || '',
        experience: profileData.experience || '',
        education: profileData.education || '',
        skills: profileData.skills || [],
      });

      if (profileData.avatar_url) {
        setAvatarPreview(profileData.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    setAvatarPreview(null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

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

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setSaving(true);

      let updateData: any = {
        name: formData.name,
        bio: formData.bio,
        about: formData.about,
        location: formData.location,
        experience: formData.experience,
        education: formData.education,
        skills: formData.skills,
      };

      // Upload avatar if provided
      if (avatarFile) {
        const avatarUrl = await uploadAvatar();
        if (avatarUrl) {
          updateData.avatar_url = avatarUrl;
        }
      } else if (!avatarPreview) {
        updateData.avatar_url = null;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

      // Create activity
      await supabase
        .from('activities')
        .insert([
          {
            user_id: userId,
            title: 'Profile Updated',
            description: 'You updated your profile information',
            type: 'update',
          },
        ]);

      router.push(`/profile/${userId}`);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
              href={`/profile/${userId}`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-sm text-gray-500">Update your profile information</p>
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

          {/* Avatar Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Profile Picture
            </label>

            <div className="flex items-center gap-6">
              {/* Current Avatar */}
              <div className="relative">
                <img
                  src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.name}&background=0D9488&color=fff&size=200`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                />
                {avatarPreview && avatarFile && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={saving}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors inline-flex items-center gap-2 font-medium">
                    <Upload size={18} />
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
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or WEBP (MAX. 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="Your full name"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Short description)
              </label>
              <input
                type="text"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={160}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="A short bio about yourself (max 160 characters)"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/160 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="City, Country"
                disabled={saving}
              />
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition resize-none"
              placeholder="Tell us about yourself..."
              disabled={saving}
            />
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Experience</h2>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition resize-none"
              placeholder="Describe your work experience..."
              disabled={saving}
            />
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Education</h2>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition resize-none"
              placeholder="Describe your educational background..."
              disabled={saving}
            />
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Skills</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:border-transparent outline-none transition"
                placeholder="Add a skill (press Enter)"
                disabled={saving}
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={saving}
                className="px-4 py-2 bg-[#0D9488] text-white rounded-lg hover:bg-[#0a7a6f] transition-colors font-medium disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 group"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    disabled={saving}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Link
              href={`/profile/${userId}`}
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
        </form>
      </div>
    </div>
  );
}