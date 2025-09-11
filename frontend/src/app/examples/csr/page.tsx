'use client';

import { useState, useEffect } from 'react';

// Client-Side Rendering (CSR) Example
// This component runs entirely in the browser
export default function CSRExample() {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    // This runs only on the client side
    setTimestamp(new Date().toISOString());
    
    // Simulate API call that happens on client
    const fetchData = async () => {
      setLoading(true);
      try {
        // This could be your backend API or any external API
        const response = await fetch('/api/client-data');
        if (response.ok) {
          const result = await response.text();
          setData(result);
        } else {
          setData('Client-side data loaded successfully!');
        }
      } catch (error) {
        setData('Client-side data loaded (offline mode)');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <h1 className="text-3xl font-bold text-gray-800">Client-Side Rendering (CSR)</h1>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">🖥️ CSR Characteristics</h2>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Renders entirely in the browser</li>
              <li>• Perfect for interactive dashboards</li>
              <li>• Requires JavaScript to function</li>
              <li>• Can be deployed to any CDN or static hosting</li>
              <li>• Great for SPA (Single Page Application) behavior</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Runtime Information</h3>
              <p className="text-sm text-gray-600">Rendered at: {timestamp}</p>
              <p className="text-sm text-gray-600">Environment: Browser</p>
              <p className="text-sm text-gray-600">Hydration: Not applicable</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Data Loading</h3>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600">Loading data...</span>
                </div>
              ) : (
                <p className="text-sm text-green-600">✅ {data}</p>
              )}
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Use Cases for CSR</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Interactive financial dashboards</li>
              <li>• Real-time trading interfaces</li>
              <li>• Admin panels and back-office tools</li>
              <li>• Progressive Web Apps (PWAs)</li>
              <li>• Applications behind authentication</li>
            </ul>
          </div>

          <div className="mt-6 flex space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ← Back
            </button>
            <button 
              onClick={() => setTimestamp(new Date().toISOString())}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              🔄 Refresh Timestamp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
