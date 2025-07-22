'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/app/_context/AuthContext'

interface FormData {
  email: string
}

interface FormErrors {
  email?: string
  general?: string
}

const LoginPage = () => {
  const router = useRouter()
  const { login } = useAuth()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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

    // Clear previous messages
    setErrors({})
    setSuccessMessage('')

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('🔑 Attempting login for email:', formData.email)

      // Check if user exists by email
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/email/${formData.email}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      if (response.data.success && response.data.data) {
        console.log('✅ User found:', response.data.data)

        // Update auth state
        login(response.data.data)

        setSuccessMessage('Login successful! Redirecting...')

        // Redirect to dashboard after 1.5 seconds
          router.push('/dashboard')

      } else {
        throw new Error('User not found')
      }

    } catch (error: unknown) {
      console.error('❌ Login error:', error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setErrors({ general: 'No account found with this email address. Please sign up first.' })
        } else if (error.response?.data?.error) {
          setErrors({ general: error.response.data.error })
        } else if (error.code === 'ECONNABORTED') {
          setErrors({ general: 'Request timeout. Please try again.' })
        } else {
          setErrors({ general: 'Network error. Please try again.' })
        }
      } else if (error instanceof Error) {
        setErrors({ general: error.message || 'Something went wrong. Please try again.' })
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-white font-bold">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your Insyd account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
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

            {/* Email Input */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`
                  w-full px-4 py-3 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition duration-200 ease-in-out
                  placeholder-gray-400
                  ${errors.email ? 'border-red-500 ring-1 ring-red-500' : ''}
                `}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full px-8 py-4 text-lg font-semibold rounded-lg
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
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Links - FIXED APOSTROPHE */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition duration-200"
                type="button"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Access your professional network instantly</p>
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              Instant notifications
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
              Real-time updates
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
              Professional feed
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
