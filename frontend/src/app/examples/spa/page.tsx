'use client'

import { useState } from 'react'
import { ChevronRightIcon, HomeIcon, UserIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { NextSeo } from 'next-seo'

// SPA Navigation Component with Semantic HTML5 and ARIA
interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ComponentType
  ariaLabel: string
}

// Individual page components for SPA
const DashboardPage = () => (
  <main role="main" aria-labelledby="dashboard-title">
    <header>
      <h1 id="dashboard-title" className="text-2xl font-bold text-gray-900 mb-4">
        Financial Dashboard
      </h1>
      <p className="text-gray-600 mb-6">Welcome to your personalized financial overview</p>
    </header>
    
    <section aria-labelledby="metrics-title" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <h2 id="metrics-title" className="sr-only">Key Financial Metrics</h2>
      
      <article className="bg-white p-6 rounded-lg shadow-md border" aria-labelledby="portfolio-value">
        <h3 id="portfolio-value" className="text-sm font-medium text-gray-500">Portfolio Value</h3>
        <p className="text-2xl font-bold text-green-600" aria-describedby="portfolio-description">$127,450.32</p>
        <p id="portfolio-description" className="text-sm text-gray-500">+2.4% from last month</p>
      </article>
      
      <article className="bg-white p-6 rounded-lg shadow-md border" aria-labelledby="monthly-return">
        <h3 id="monthly-return" className="text-sm font-medium text-gray-500">Monthly Return</h3>
        <p className="text-2xl font-bold text-blue-600" aria-describedby="return-description">+5.8%</p>
        <p id="return-description" className="text-sm text-gray-500">Above market average</p>
      </article>
      
      <article className="bg-white p-6 rounded-lg shadow-md border" aria-labelledby="active-trades">
        <h3 id="active-trades" className="text-sm font-medium text-gray-500">Active Trades</h3>
        <p className="text-2xl font-bold text-purple-600" aria-describedby="trades-description">12</p>
        <p id="trades-description" className="text-sm text-gray-500">3 pending execution</p>
      </article>
    </section>
    
    <section aria-labelledby="recent-activity">
      <h2 id="recent-activity" className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="bg-white rounded-lg shadow-md border p-6">
        <ul className="space-y-3">
          <li className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>AAPL Stock Purchase</span>
            <span className="text-green-600 font-medium">+$2,450</span>
          </li>
          <li className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>MSFT Dividend</span>
            <span className="text-blue-600 font-medium">+$156.20</span>
          </li>
          <li className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Portfolio Rebalancing</span>
            <span className="text-gray-600 font-medium">Completed</span>
          </li>
        </ul>
      </div>
    </section>
  </main>
)

const ProfilePage = () => (
  <main role="main" aria-labelledby="profile-title">
    <header>
      <h1 id="profile-title" className="text-2xl font-bold text-gray-900 mb-4">
        User Profile
      </h1>
      <p className="text-gray-600 mb-6">Manage your account settings and preferences</p>
    </header>
    
    <form aria-labelledby="profile-form-title" className="bg-white p-6 rounded-lg shadow-md border max-w-2xl">
      <h2 id="profile-form-title" className="text-lg font-semibold mb-6">Personal Information</h2>
      
      <fieldset className="space-y-4">
        <legend className="sr-only">User Details</legend>
        
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="full-name"
            name="fullName"
            defaultValue="John Doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby="name-help"
          />
          <p id="name-help" className="text-sm text-gray-500 mt-1">Enter your legal name as it appears on documents</p>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue="john.doe@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby="email-help"
          />
          <p id="email-help" className="text-sm text-gray-500 mt-1">We&apos;ll never share your email with third parties</p>
        </div>
        
        <div>
          <label htmlFor="risk-tolerance" className="block text-sm font-medium text-gray-700 mb-1">
            Risk Tolerance
          </label>
          <select
            id="risk-tolerance"
            name="riskTolerance"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby="risk-help"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate" selected>Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <p id="risk-help" className="text-sm text-gray-500 mt-1">Choose your investment risk preference</p>
        </div>
      </fieldset>
      
      <div className="mt-6">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-describedby="save-help"
        >
          Save Changes
        </button>
        <p id="save-help" className="text-sm text-gray-500 mt-2">Changes will be saved immediately</p>
      </div>
    </form>
  </main>
)

const AnalyticsPage = () => (
  <main role="main" aria-labelledby="analytics-title">
    <header>
      <h1 id="analytics-title" className="text-2xl font-bold text-gray-900 mb-4">
        Portfolio Analytics
      </h1>
      <p className="text-gray-600 mb-6">Detailed analysis of your investment performance</p>
    </header>
    
    <section aria-labelledby="performance-charts">
      <h2 id="performance-charts" className="text-lg font-semibold mb-4">Performance Charts</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="bg-white p-6 rounded-lg shadow-md border" aria-labelledby="chart1-title">
          <h3 id="chart1-title" className="text-md font-medium mb-4">6-Month Performance</h3>
          <div className="h-64 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-center justify-center">
            <p className="text-gray-600" aria-label="Chart placeholder showing upward trend">
              📈 Portfolio trending upward (+12.3%)
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-2">Performance compared to S&P 500 benchmark</p>
        </article>
        
        <article className="bg-white p-6 rounded-lg shadow-md border" aria-labelledby="chart2-title">
          <h3 id="chart2-title" className="text-md font-medium mb-4">Asset Allocation</h3>
          <div className="h-64 bg-gradient-to-r from-green-100 to-green-200 rounded flex items-center justify-center">
            <p className="text-gray-600" aria-label="Pie chart showing balanced portfolio allocation">
              🥧 Balanced allocation: 60% Stocks, 30% Bonds, 10% Cash
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-2">Diversified across multiple asset classes</p>
        </article>
      </div>
    </section>
    
    <section aria-labelledby="risk-metrics" className="mt-8">
      <h2 id="risk-metrics" className="text-lg font-semibold mb-4">Risk Metrics</h2>
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Beta</dt>
            <dd className="text-xl font-bold text-gray-900">0.85</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Sharpe Ratio</dt>
            <dd className="text-xl font-bold text-gray-900">1.42</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Max Drawdown</dt>
            <dd className="text-xl font-bold text-gray-900">-8.2%</dd>
          </div>
        </dl>
      </div>
    </section>
  </main>
)

const SettingsPage = () => (
  <main role="main" aria-labelledby="settings-title">
    <header>
      <h1 id="settings-title" className="text-2xl font-bold text-gray-900 mb-4">
        Application Settings
      </h1>
      <p className="text-gray-600 mb-6">Customize your trading platform experience</p>
    </header>
    
    <section aria-labelledby="notifications-settings">
      <h2 id="notifications-settings" className="text-lg font-semibold mb-4">Notification Preferences</h2>
      
      <form className="bg-white p-6 rounded-lg shadow-md border max-w-2xl">
        <fieldset>
          <legend className="text-md font-medium text-gray-900 mb-4">Email Notifications</legend>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                aria-describedby="price-alerts-help"
              />
              <span className="ml-2 text-sm text-gray-700">Price Alerts</span>
            </label>
            <p id="price-alerts-help" className="text-xs text-gray-500 ml-6">
              Receive notifications when stock prices hit your target levels
            </p>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                aria-describedby="trade-confirmations-help"
              />
              <span className="ml-2 text-sm text-gray-700">Trade Confirmations</span>
            </label>
            <p id="trade-confirmations-help" className="text-xs text-gray-500 ml-6">
              Get confirmation emails for all executed trades
            </p>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                aria-describedby="market-news-help"
              />
              <span className="ml-2 text-sm text-gray-700">Market News</span>
            </label>
            <p id="market-news-help" className="text-xs text-gray-500 ml-6">
              Daily market summaries and important financial news
            </p>
          </div>
        </fieldset>
        
        <div className="mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update Preferences
          </button>
        </div>
      </form>
    </section>
  </main>
)

// Main SPA Component
export default function SPADemo() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)

  // Navigation items with accessibility labels
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      content: DashboardPage,
      ariaLabel: 'Navigate to dashboard page'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      content: ProfilePage,
      ariaLabel: 'Navigate to user profile page'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ChartBarIcon,
      content: AnalyticsPage,
      ariaLabel: 'Navigate to portfolio analytics page'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: CogIcon,
      content: SettingsPage,
      ariaLabel: 'Navigate to application settings page'
    }
  ]

  // SPA navigation with loading state
  const navigateTo = async (pageId: string) => {
    if (pageId === currentPage) return
    
    setIsLoading(true)
    
    // Simulate API call or data fetching
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setCurrentPage(pageId)
    setIsLoading(false)
    
    // Announce page change to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = `Navigated to ${navigationItems.find(item => item.id === pageId)?.label} page`
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  const currentPageData = navigationItems.find(item => item.id === currentPage)
  const CurrentPageComponent = currentPageData?.content || DashboardPage

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        {/* Header with role banner */}
        <header role="banner" className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FinTech SPA Demo
                </h1>
                <p className="text-sm text-gray-600">
                  Single Page Application with Semantic HTML5 & Accessibility
                </p>
              </div>
              
              {/* Status indicator */}
              <output className="flex items-center space-x-2" aria-live="polite">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400' : 'bg-green-400'}`} 
                     aria-hidden="true"></div>
                <span className="text-sm text-gray-600">
                  {isLoading ? 'Loading...' : 'Ready'}
                </span>
              </output>
            </div>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Navigation sidebar */}
            <nav aria-label="Main navigation" className="w-64 flex-shrink-0">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => navigateTo(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                        }`}
                        aria-label={item.ariaLabel}
                        aria-current={isActive ? 'page' : undefined}
                        disabled={isLoading}
                      >
                        <Icon className="h-5 w-5 mr-3" aria-hidden="true" />
                        <span>{item.label}</span>
                        {isActive && (
                          <ChevronRightIcon className="h-4 w-4 ml-auto" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
            
            {/* Main content area */}
            <section className="flex-1" id="main-content" aria-label="Page content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLoading ? (
                    <output
                      className="flex items-center justify-center h-64"
                      aria-live="polite"
                      aria-label="Loading page content"
                    >
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
                      <span className="ml-2 text-gray-600">Loading {currentPageData?.label}...</span>
                    </output>
                  ) : (
                    <CurrentPageComponent />
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
          </div>
        </div>        {/* Footer with role contentinfo */}
        <footer role="contentinfo" className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-600 text-sm">
              © 2025 FinTech SPA Demo - Demonstrating Semantic HTML5 and Accessibility Best Practices
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
