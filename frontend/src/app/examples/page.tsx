import Link from 'next/link';

export default function ExamplesPage() {
  const examples = [
    {
      title: 'Client-Side Rendering (CSR)',
      description: 'Interactive components that render in the browser',
      path: '/examples/csr',
      color: 'blue',
      features: ['Interactive UI', 'JavaScript required', 'SPA behavior', 'CDN deployable']
    },
    {
      title: 'Static Site Generation (SSG)',
      description: 'Pre-rendered pages at build time for optimal performance',
      path: '/examples/ssg',
      color: 'green',
      features: ['Build-time rendering', 'Ultra-fast loading', 'SEO optimized', 'CDN cacheable']
    },
    {
      title: 'Server-Side Rendering (SSR)',
      description: 'Dynamic pages rendered on the server for each request',
      path: '/examples/ssr',
      color: 'purple',
      features: ['Fresh data', 'Personalized content', 'SEO friendly', 'Server required']
    },
    {
      title: 'Single Page Application (SPA)',
      description: 'Complete SPA with semantic HTML5 and accessibility features',
      path: '/examples/spa',
      color: 'orange',
      features: ['Client-side navigation', 'Semantic HTML5', 'ARIA accessibility', 'Form interactions']
    }
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        title: 'text-blue-800',
        button: 'bg-blue-500 hover:bg-blue-600',
        dot: 'bg-blue-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        title: 'text-green-800',
        button: 'bg-green-500 hover:bg-green-600',
        dot: 'bg-green-500'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        title: 'text-purple-800',
        button: 'bg-purple-500 hover:bg-purple-600',
        dot: 'bg-purple-500'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        title: 'text-orange-800',
        button: 'bg-orange-500 hover:bg-orange-600',
        dot: 'bg-orange-500'
      }
    };
    return classes[color as keyof typeof classes];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            React Rendering Strategies
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Next.js App Router supports multiple rendering strategies in the same application. 
            Choose the right strategy for each route based on your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {examples.map((example) => {
            const colors = getColorClasses(example.color);
            return (
              <div key={example.path} className={`${colors.bg} ${colors.border} border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center mb-4">
                  <div className={`w-3 h-3 ${colors.dot} rounded-full mr-3`}></div>
                  <h2 className={`text-xl font-semibold ${colors.title}`}>
                    {example.title}
                  </h2>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm">
                  {example.description}
                </p>
                
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2 text-sm">Key Features:</h3>
                  <ul className="space-y-1">
                    {example.features.map((feature) => (
                      <li key={feature} className="flex items-center text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link 
                  href={example.path}
                  className={`inline-block w-full text-center px-4 py-2 ${colors.button} text-white rounded transition-colors text-sm font-medium`}
                >
                  View Example →
                </Link>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Full-Stack Framework Capabilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">✨ Framework Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-sm">Client-side rendering (CSR) for interactive UIs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-sm">Single-page app (SPA) capabilities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-sm">Static-site generation (SSG) for performance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-sm">Server-side rendering (SSR) per route</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-sm">API routes for backend functionality</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-sm">CDN deployment without servers</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">🚀 Deployment Options</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🌐</span>
                  <span className="text-sm">Static hosting (Vercel, Netlify, S3)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">☁️</span>
                  <span className="text-sm">Azure Static Web Apps (included)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🐳</span>
                  <span className="text-sm">Containerized deployment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">⚡</span>
                  <span className="text-sm">Serverless functions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🏗️</span>
                  <span className="text-sm">Traditional server deployment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">🔄</span>
                  <span className="text-sm">Incremental adoption of features</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🎯 Perfect for Financial Applications
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              This Golden Path template gives you the flexibility to choose the right rendering strategy for each part of your fintech application:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <strong className="text-blue-600">Marketing Pages</strong>
                <p className="text-gray-600 mt-1">Use SSG for ultra-fast, SEO-optimized landing pages</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <strong className="text-green-600">User Dashboards</strong>
                <p className="text-gray-600 mt-1">Use SSR for personalized, data-rich interfaces</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <strong className="text-purple-600">Trading Tools</strong>
                <p className="text-gray-600 mt-1">Use CSR for real-time, interactive components</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
