'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/app/_context/AuthContext'

interface FormData {
  title: string
  content: string
}

interface FormErrors {
  title?: string
  content?: string
  general?: string
}

const CreatePostForm = () => {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters'
    } else if (formData.content.trim().length > 1000) {
      newErrors.content = 'Content must be less than 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!user || !isAuthenticated) {
      setErrors({ general: 'You must be logged in to create a post' })
      return
    }
    
    // Clear previous messages
    setErrors({})
    setSuccessMessage('')
    
    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('🚀 Creating post with data:', formData)
      
      const postData = {
        authorId: user.userId,
        title: formData.title.trim(),
        content: formData.content.trim()
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/posts`, postData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })
      
      if (response.data.success && response.data.data) {
        console.log('✅ Post created successfully:', response.data.data)
        
        setSuccessMessage('Post created successfully! Redirecting to dashboard...')
        
        // Reset form
        setFormData({ title: '', content: '' })
        
        // Redirect to dashboard after 2 seconds
          router.push('/dashboard')
        
      } else {
        throw new Error(response.data.error || 'Failed to create post')
      }
      
    } catch (error: unknown) {
  console.error('❌ Create post error:', error)
  
  if (axios.isAxiosError(error)) {
    // error is now typed as AxiosError
    if (error.response?.data?.error) {
      setErrors({ general: error.response.data.error })
    } else if (error.response?.status === 404) {
      setErrors({ general: 'Author not found. Please try logging in again.' })
    } else if (error.code === 'ECONNABORTED') {
      setErrors({ general: 'Request timeout. Please try again.' })
    } else {
      setErrors({ general: 'Network error. Please try again.' })
    }
  } else if (error instanceof Error) {
    // Generic JavaScript Error
    setErrors({ general: error.message || 'Something went wrong. Please try again.' })
  } else {
    // Unknown error type
    setErrors({ general: 'Something went wrong. Please try again.' })
  }
} finally {
  setIsLoading(false)
}
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-white font-bold">📝</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Post
        </h1>
        <p className="text-gray-600">
          Share your architectural project with the community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 text-sm font-medium">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800 text-sm font-medium">
                {errors.general}
              </p>
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Title *
          </label>
          <input
            name="title"
            type="text"
            placeholder="Enter an engaging title for your post"
            value={formData.title}
            onChange={handleInputChange}
            required
            className={`
              w-full px-4 py-3 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition duration-200 ease-in-out
              placeholder-gray-400
              ${errors.title ? 'border-red-500 ring-1 ring-red-500' : ''}
            `}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Content Textarea */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Content *
          </label>
          <textarea
            name="content"
            placeholder="Share details about your architectural project, design process, inspiration, or any other insights you'd like to share with the community..."
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={8}
            className={`
              w-full px-4 py-3 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition duration-200 ease-in-out
              placeholder-gray-400 resize-vertical
              ${errors.content ? 'border-red-500 ring-1 ring-red-500' : ''}
            `}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.content.length}/1000 characters
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="
              flex-1 px-6 py-3 text-base font-medium rounded-lg
              bg-gray-200 text-gray-800 hover:bg-gray-300
              transition duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
            "
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`
              flex-1 px-6 py-3 text-base font-semibold rounded-lg
              transition duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              flex items-center justify-center gap-2
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
              }
              text-white
            `}
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  className="opacity-25"
                />
                <path 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  className="opacity-75"
                />
              </svg>
            )}
            {isLoading ? 'Creating Post...' : 'Publish Post'}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for a great post:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use a descriptive title that captures attention</li>
          <li>• Share your design process and inspiration</li>
          <li>• Include technical details that fellow architects would find useful</li>
          <li>• Be authentic and share your learning experiences</li>
        </ul>
      </div>
    </div>
  )
}

export default CreatePostForm
