'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/_context/AuthContext'
import CreatePostForm from '@/app/_components/posts/createPostForm'

const CreatePostPage = () => {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold">🏗️</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Insyd</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-700 font-medium transition duration-200"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <CreatePostForm />
      </main>
    </div>
  )
}

export default CreatePostPage
