'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/_context/AuthContext'
import Navbar from '@/app/_components/navbar/page' // Import your Navbar component

const ProfilePage = () => {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use the new Navbar component */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32"></div>
          <div className="relative px-8 pb-8">
            <div className="flex items-center -mt-16">
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-6 mt-16">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-500 text-sm">Architecture Professional</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Details */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-500 bg-gray-50 px-4 py-3 rounded-lg font-mono text-sm">{user.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600">📧</span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  Active
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600">⚡</span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Real-time Notifications</p>
                    <p className="text-sm text-gray-600">WebSocket live updates</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  Ready
                </span>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Your dual-channel notification system is fully configured and operational. 
                  You&apos;ll receive notifications both via email and real-time when someone 
                  interacts with your posts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
            >
              <span className="mr-2">🏠</span>
              Go to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-200 flex items-center justify-center"
            >
              <span className="mr-2">👋</span>
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
