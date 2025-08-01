// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from './_context/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Insyd Architecture Platform',
  description: 'Connect with architecture professionals worldwide',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
