'use client'

import { useState } from 'react'

// Component demonstrating Semantic HTML5 and Accessibility features
export default function SemanticAccessibilityDemo() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <main role="main" className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Submitted Successfully!</h1>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md"
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
      <header role="banner" className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Semantic HTML5 & Accessibility Demo
          </h1>
          <p className="mt-2 text-gray-600">
            This page demonstrates proper semantic structure and accessibility features
          </p>
        </div>
      </header>

      <main role="main" id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        <section>
          <h2>Demo Form</h2>
          <form>
            <div>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" />
            </div>
            <button type="submit">Submit</button>
          </form>
        </section>
      </main>

      <footer role="contentinfo" className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            This form demonstrates semantic HTML5 structure
          </p>
        </div>
      </footer>
    </div>
  )
}
