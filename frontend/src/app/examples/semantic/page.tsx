'use client'

import { useState } from 'react'

// Component demonstrating Semantic HTML5 and Accessibility features
export default function SemanticAccessibilityDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    notifications: false,
    newsletter: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Announce validation errors to screen readers
      const errorMessage = `Form has ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''}`
      announceToScreenReader(errorMessage)
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setSubmitted(true)
    announceToScreenReader('Form submitted successfully')
  }

  // Helper function to announce messages to screen readers
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <main role="main" className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center" role="alert" aria-live="polite">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Submitted Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your submission. We&apos;ll get back to you soon.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit Another Form
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Skip to main content for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        {/* Header with proper semantic structure */}
        <header role="banner" className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Semantic HTML5 & Accessibility Demo
            </h1>
            <p className="text-gray-600 mt-2">
              Demonstrating proper use of semantic elements and ARIA roles for inclusive web design
            </p>
          </div>
        </header>

        <main role="main" id="main-content" className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Introduction Section */}
          <section aria-labelledby="intro-heading" className="mb-12">
            <h2 id="intro-heading" className="text-2xl font-semibold text-gray-800 mb-6">
              What Makes This Form Accessible?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <article className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-blue-800 mb-3">🏗️ Semantic HTML5</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• &lt;header&gt;, &lt;main&gt;, &lt;section&gt; structure</li>
                  <li>• Proper heading hierarchy (h1, h2, h3)</li>
                  <li>• &lt;fieldset&gt; and &lt;legend&gt; for form grouping</li>
                  <li>• &lt;label&gt; elements properly associated</li>
                </ul>
              </article>
              
              <article className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-green-800 mb-3">♿ ARIA Accessibility</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• aria-describedby for help text</li>
                  <li>• aria-invalid for error states</li>
                  <li>• aria-live regions for announcements</li>
                  <li>• role attributes where needed</li>
                </ul>
              </article>
            </div>
          </section>

          {/* Accessible Form */}
          <section aria-labelledby="form-heading">
            <h2 id="form-heading" className="text-2xl font-semibold text-gray-800 mb-6">
              Interactive Form Example
            </h2>
            
            <form 
              onSubmit={handleSubmit}
              className="bg-white p-8 rounded-lg shadow-lg max-w-2xl"
              noValidate
            >
              <fieldset className="mb-8">
                <legend className="text-lg font-medium text-gray-900 mb-6">
                  Personal Information
                </legend>
                
                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label 
                      htmlFor="full-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="full-name"
                      name="fullName"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      aria-describedby={errors.name ? 'name-error' : 'name-help'}
                      aria-invalid={errors.name ? 'true' : 'false'}
                      aria-required="true"
                    />
                    {errors.name ? (
                      <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.name}
                      </p>
                    ) : (
                      <p id="name-help" className="mt-1 text-sm text-gray-500">
                        Enter your legal name as it appears on official documents
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label 
                      htmlFor="email-address"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email-address"
                      name="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      aria-describedby={errors.email ? 'email-error' : 'email-help'}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-required="true"
                    />
                    {errors.email ? (
                      <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.email}
                      </p>
                    ) : (
                      <p id="email-help" className="mt-1 text-sm text-gray-500">
                        We&apos;ll use this to send you important updates
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label 
                      htmlFor="user-role"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Role <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <select
                      id="user-role"
                      name="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                      aria-describedby={errors.role ? 'role-error' : 'role-help'}
                      aria-invalid={errors.role ? 'true' : 'false'}
                      aria-required="true"
                    >
                      <option value="">Select your role</option>
                      <option value="developer">Software Developer</option>
                      <option value="designer">UI/UX Designer</option>
                      <option value="manager">Product Manager</option>
                      <option value="analyst">Business Analyst</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.role ? (
                      <p id="role-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.role}
                      </p>
                    ) : (
                      <p id="role-help" className="mt-1 text-sm text-gray-500">
                        This helps us understand your background
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset className="mb-8">
                <legend className="text-lg font-medium text-gray-900 mb-4">
                  Communication Preferences
                </legend>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="notifications"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={(e) => handleInputChange('notifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      aria-describedby="notifications-help"
                    />
                    <label htmlFor="notifications" className="ml-3 text-sm">
                      <span className="font-medium text-gray-700">Email Notifications</span>
                      <p id="notifications-help" className="text-gray-500">
                        Receive updates about new features and important changes
                      </p>
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="newsletter"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={(e) => handleInputChange('newsletter', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      aria-describedby="newsletter-help"
                    />
                    <label htmlFor="newsletter" className="ml-3 text-sm">
                      <span className="font-medium text-gray-700">Monthly Newsletter</span>
                      <p id="newsletter-help" className="text-gray-500">
                        Get monthly tips, tutorials, and industry insights
                      </p>
                    </label>
                  </div>
                </div>
              </fieldset>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-describedby="submit-help"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></span>
                      {' '}Submitting...
                    </>
                  ) : (
                    'Submit Form'
                  )}
                </button>
                <p id="submit-help" className="text-sm text-gray-500">
                  All fields marked with * are required
                </p>
              </div>
            </form>
          </section>

          {/* Live Region for Screen Reader Announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only"></div>
        </main>

        {/* Footer */}
        <footer role="contentinfo" className="bg-white border-t mt-12">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <p className="text-center text-gray-600 text-sm">
              This form demonstrates semantic HTML5 structure and comprehensive accessibility features
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
