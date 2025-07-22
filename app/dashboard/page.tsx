'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/app/_context/AuthContext'
import Navbar from '../_components/navbar/page'

interface Post {
  postId: string
  authorId: string
  title: string
  content: string
  likes: string[]
  likeCount: number
  createdAt: string
  updatedAt: string
  author?: {
    userId: string
    name: string
    email: string
  }
}

type FilterType = 'all' | 'my_posts' | 'liked_posts'

const DashboardPage = () => {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  // State
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null) // NEW: Track which post is being deleted

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
  const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://m75xolz360.execute-api.eu-north-1.amazonaws.com/prod'

  // Fetch all posts - FIXED: Using useCallback to avoid dependency warnings
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await axios.get(`${API_BASE_URL}/api/v1/posts`, {
        timeout: 10000,
      })

      if (response.data.success) {
        setPosts(response.data.data || [])
      } else {
        throw new Error('Failed to fetch posts')
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching posts:', error)
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          setError(error.response.data.error)
        } else if (error.code === 'ECONNABORTED') {
          setError('Request timeout. Please try again.')
        } else {
          setError('Network error. Please try again.')
        }
      } else if (error instanceof Error) {
        setError(error.message || 'Failed to load posts. Please try again.')
      } else {
        setError('Failed to load posts. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [API_BASE_URL])

  // Apply filter to posts - FIXED: Using useCallback to avoid dependency warnings
  const applyFilter = useCallback(() => {
    if (!user) return

    let filtered = posts

    switch (currentFilter) {
      case 'my_posts':
        filtered = posts.filter(post => post.authorId === user.userId)
        break
      case 'liked_posts':
        filtered = posts.filter(post => post.likes.includes(user.userId))
        break
      case 'all':
      default:
        filtered = posts
        break
    }

    setFilteredPosts(filtered)
  }, [posts, currentFilter, user])

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  // WebSocket connection for real-time updates - FIXED: Added fetchPosts to dependencies
  useEffect(() => {
    if (!isAuthenticated || !user) return

    console.log('🔌 Connecting to WebSocket for real-time post updates...', user.userId)
    
    const ws = new WebSocket(`${WEBSOCKET_URL}?userId=${user.userId}`)
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected for real-time post updates')
      setWsConnection(ws)
    }
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('📨 WebSocket message received:', message)
        
        // Handle different message types
        if (message.type === 'post_update' || message.type === 'notification') {
          // Refresh posts when someone likes a post to get real-time updates
          console.log('🔄 Refreshing posts due to real-time update')
          fetchPosts()
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }
    
    ws.onclose = () => {
      console.log('❌ WebSocket connection closed')
      setWsConnection(null)
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (isAuthenticated && user) {
          console.log('🔄 Attempting to reconnect WebSocket...')
          // The effect will run again and reconnect
        }
      }, 3000)
    }
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [isAuthenticated, user, WEBSOCKET_URL, fetchPosts])

  // Fetch posts on component mount - FIXED: Added fetchPosts to dependencies
  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts()
    }
  }, [isAuthenticated, fetchPosts])

  // Apply filters when posts or filter changes - FIXED: Added applyFilter to dependencies
  useEffect(() => {
    applyFilter()
  }, [applyFilter])

  // Handle like/unlike post with optimistic updates - FIXED: Type-safe error handling
  const handleLikePost = async (post: Post) => {
    if (!user) return

    const isLiked = post.likes.includes(user.userId)

    try {
      // Optimistic update
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.postId === post.postId
            ? {
                ...p,
                likes: isLiked
                  ? p.likes.filter(id => id !== user.userId)
                  : [...p.likes, user.userId],
                likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1
              }
            : p
        )
      )

      if (isLiked) {
        // Unlike post
        await axios.delete(`${API_BASE_URL}/api/v1/posts/${post.postId}/like`, {
          data: { userId: user.userId }
        })
      } else {
        // Like post
        await axios.post(`${API_BASE_URL}/api/v1/posts/${post.postId}/like`, {
          userId: user.userId
        })
      }

      // Refresh posts to ensure consistency (this will trigger real-time updates for other users)
      setTimeout(() => fetchPosts(), 500)
    } catch (error: unknown) {
      console.error('❌ Error toggling like:', error)
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          console.error('API Error:', error.response.data.error)
        } else if (error.code === 'ECONNABORTED') {
          console.error('Request timeout error')
        } else {
          console.error('Network error')
        }
      } else if (error instanceof Error) {
        console.error('Error:', error.message)
      }
      
      // Revert optimistic update on error
      fetchPosts()
    }
  }

  // NEW: Handle delete post
  const handleDeletePost = async (post: Post) => {
    if (!user || post.authorId !== user.userId) return

    // Confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return

    setDeletingPostId(post.postId)

    // Store original posts for rollback
    const originalPosts = [...posts]

    try {
      // Optimistic update - remove post immediately
      setPosts(prevPosts => prevPosts.filter(p => p.postId !== post.postId))

      // API call to delete post
      const response = await axios.delete(`${API_BASE_URL}/api/v1/posts/${post.postId}`, {
        timeout: 10000,
      })

      if (response.data.success) {
        console.log('✅ Post deleted successfully')
        // Post already removed optimistically, no need to update state again
      } else {
        throw new Error('Failed to delete post')
      }
    } catch (error: unknown) {
      console.error('❌ Error deleting post:', error)
      
      // Revert optimistic update on error
      setPosts(originalPosts)
      
      // Show error message
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          alert('You are not authorized to delete this post.')
        } else if (error.response?.status === 404) {
          alert('Post not found. It may have already been deleted.')
        } else if (error.response?.data?.error) {
          alert(`Error: ${error.response.data.error}`)
        } else if (error.code === 'ECONNABORTED') {
          alert('Request timeout. Please try again.')
        } else {
          alert('Network error. Please try again.')
        }
      } else if (error instanceof Error) {
        alert(`Error: ${error.message}`)
      } else {
        alert('Something went wrong. Please try again.')
      }
    } finally {
      setDeletingPostId(null)
    }
  }

  // Loading state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header with WebSocket Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Architecture Posts</h2>
              <p className="text-gray-600">Discover and share amazing architectural projects</p>
            </div>
            
            {/* WebSocket Connection Status */}
          </div>
        </div>

        {/* Create Post Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/posts/create')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Post</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setCurrentFilter('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                  currentFilter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Posts ({posts.length})
              </button>
              <button
                onClick={() => setCurrentFilter('my_posts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                  currentFilter === 'my_posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Posts ({posts.filter(post => post.authorId === user.userId).length})
              </button>
              <button
                onClick={() => setCurrentFilter('liked_posts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                  currentFilter === 'liked_posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Liked Posts ({posts.filter(post => post.likes.includes(user.userId)).length})
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={fetchPosts}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading posts...</span>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <div key={post.postId} className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300">
                    {/* Post Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {post.author?.name?.charAt(0).toUpperCase() || 'A'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {post.author?.name || 'Unknown Author'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {post.authorId === user.userId && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            Your Post
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                    </div>

                    {/* Post Content */}
                    <div className="p-6 pt-4">
                      <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Like Button */}
                          <button
                            onClick={() => handleLikePost(post)}
                            disabled={post.authorId === user.userId}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition duration-200 transform hover:scale-105 ${
                              post.likes.includes(user.userId)
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${post.authorId === user.userId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <svg 
                              className={`w-5 h-5 transition-transform duration-200 ${
                                post.likes.includes(user.userId) ? 'scale-110' : ''
                              }`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{post.likeCount}</span>
                          </button>

                          {/* Delete Button - Only show for user's own posts */}
                          {post.authorId === user.userId && (
                            <button
                              onClick={() => handleDeletePost(post)}
                              disabled={deletingPostId === post.postId}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition duration-200 transform hover:scale-105 ${
                                deletingPostId === post.postId
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                              title="Delete post"
                            >
                              {deletingPostId === post.postId ? (
                                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                              <span className="font-medium text-sm">
                                {deletingPostId === post.postId ? 'Deleting...' : 'Delete'}
                              </span>
                            </button>
                          )}
                        </div>
                        
                        {/* Help text for own posts */}
                        {post.authorId === user.userId && (
                          <span className="text-xs text-gray-500">Your post</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentFilter === 'all' && 'No posts yet'}
                  {currentFilter === 'my_posts' && "You haven&apos;t created any posts yet"}
                  {currentFilter === 'liked_posts' && "You haven&apos;t liked any posts yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {currentFilter === 'all' && 'Be the first to share your architectural project!'}
                  {currentFilter === 'my_posts' && 'Share your amazing architectural work with the community.'}
                  {currentFilter === 'liked_posts' && 'Start exploring posts and like the ones you find inspiring.'}
                </p>

                {currentFilter !== 'liked_posts' && (
                  <button
                    onClick={() => router.push('/posts/create')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Create Your First Post
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Create Post Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => router.push('/posts/create')}
          className="
            bg-blue-600 hover:bg-blue-700 text-white 
            w-16 h-16 rounded-full shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition duration-300 ease-in-out transform hover:scale-105
            focus:outline-none focus:ring-4 focus:ring-blue-300
          "
          title="Create New Post"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default DashboardPage
