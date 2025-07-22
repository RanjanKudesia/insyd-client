'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/app/_context/AuthContext';
import Image from 'next/image';


interface FormData {
  name: string
  email: string
}

interface FormErrors {
  name?: string
  email?: string
  general?: string
}

const SignupPage = () => {
  const router = useRouter()
  const { login } = useAuth()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters'
    }

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
      console.log('🚀 Creating user with data:', formData)

      const response = await axios.post(`${API_BASE_URL}/api/v1/users`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      if (response.data.success && response.data.data) {
        console.log('✅ User created successfully:', response.data.data)

        // Update auth state
        login(response.data.data)

        setSuccessMessage('Account created successfully! Redirecting...')

        // Redirect to dashboard after 2 seconds
        router.replace('/dashboard')

      } else {
        throw new Error(response.data.error || 'Signup failed')
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
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4">
            <Image src='/logo.svg' width={50} height={50} alt='logo' />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Insyd
          </h1>
          <p className="text-gray-600">
            Connect with architecture professionals worldwide
          </p>
        </div>

        {/* Signup Form */}
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

            {/* Name Input */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`
                  w-full px-4 py-3 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition duration-200 ease-in-out
                  placeholder-gray-400
                  ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}
                `}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition duration-200"
                type="button"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Join thousands of architects sharing their work</p>
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              Real-time notifications
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
              Professional network
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
              Project showcase
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
