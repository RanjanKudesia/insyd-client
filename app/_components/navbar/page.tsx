'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/app/_socket/socketProvider';
import { useAuth } from '@/app/_context/AuthContext';

const statusStyles = {
  connected:  'bg-green-500',
  connecting: 'bg-yellow-500',
  disconnected:'bg-gray-400',
  error:      'bg-red-500',
} as const;

export default function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { status, unread, resetUnread } = useSocket();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">

          {/* Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.svg" alt="logo" width={32} height={32} />
            <span className="font-bold text-2xl">Insyd</span>
          </Link>

          {/* Right side nav */}
          <div className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Dashboard
            </Link>

            {isAuthenticated && user ? (
              <>
                {/* Live badge */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span
                    className={`w-2 h-2 rounded-full ${statusStyles[status]}`}
                  />
                  {status === 'connecting' && 'Connecting…'}
                  {status === 'connected' && 'Live Updates'}
                  {status === 'disconnected' && 'Offline'}
                  {status === 'error' && 'Error'}
                </div>

                {/* Bell */}
                <button
                  onClick={resetUnread}
                  className="relative text-gray-600 hover:text-gray-900"
                >
                  {/* bell icon */}
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 min-w-[1.25rem] h-5 flex items-center justify-center">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>

                {/* logout */}
                <button
                  onClick={logout}
                  className="bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-gray-600 hover:text-gray-800 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
