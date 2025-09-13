'use client'

import { useState } from 'react'

// SPA Component demonstrating Single Page Application patterns
export default function SPADemo() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header role="banner" className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            SPA Demo - Single Page Application
          </h1>
          <p className="mt-2 text-gray-600">
            This demonstrates SPA navigation with semantic HTML5
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <nav role="navigation" className="w-64 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Navigation</h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currentPage === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('profile')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currentPage === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('settings')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currentPage === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </li>
            </ul>
          </nav>

          <main role="main" className="flex-1 bg-white rounded-lg shadow-md p-8">
            {currentPage === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                <p>Welcome to your dashboard!</p>
              </div>
            )}
            {currentPage === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Profile</h2>
                <p>Manage your profile information here.</p>
              </div>
            )}
            {currentPage === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p>Configure your application settings.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <footer role="contentinfo" className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 SPA Demo - Demonstrating Single Page Application patterns
          </p>
        </div>
      </footer>
    </div>
  )
}
