// Server-Side Rendering (SSR) Example
// This page is rendered on the server for each request

interface ServerData {
  requestTime: string;
  userAgent: string;
  ipAddress: string;
  serverInfo: {
    nodeVersion: string;
    platform: string;
    timestamp: string;
  };
}

// This simulates fetching data on the server for each request
async function getServerData(): Promise<ServerData> {
  // In a real app, this might fetch from a database or external API
  return {
    requestTime: new Date().toISOString(),
    userAgent: 'Server-rendered request',
    ipAddress: 'xxx.xxx.xxx.xxx (hidden for security)',
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    }
  };
}

export default async function SSRExample() {
  const data = await getServerData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
            <h1 className="text-3xl font-bold text-gray-800">Server-Side Rendering (SSR)</h1>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-purple-800 mb-2">🌐 SSR Characteristics</h2>
            <ul className="text-purple-700 space-y-1 text-sm">
              <li>• Rendered on the server for each request</li>
              <li>• Fresh data on every page load</li>
              <li>• SEO friendly with dynamic content</li>
              <li>• Can access server-side resources</li>
              <li>• Perfect for personalized content</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Request Information</h3>
              <p className="text-sm text-gray-600">Rendered at: {data.requestTime}</p>
              <p className="text-sm text-gray-600">User Agent: {data.userAgent}</p>
              <p className="text-sm text-gray-600">IP Address: {data.ipAddress}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Server Information</h3>
              <p className="text-sm text-gray-600">Node.js: {data.serverInfo.nodeVersion}</p>
              <p className="text-sm text-gray-600">Platform: {data.serverInfo.platform}</p>
              <p className="text-sm text-gray-600">Server Time: {data.serverInfo.timestamp}</p>
            </div>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">💰 Fintech SSR Use Cases</h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Personalized account dashboards</li>
              <li>• Real-time transaction histories</li>
              <li>• Dynamic pricing pages</li>
              <li>• User-specific recommendations</li>
              <li>• Compliance reports with fresh data</li>
            </ul>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚡ Performance Considerations</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Slower initial page load than SSG</li>
              <li>• Always fresh data</li>
              <li>• Requires server infrastructure</li>
              <li>• Can cache with CDN strategies</li>
              <li>• Great for authenticated content</li>
            </ul>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">🏗️ Next.js App Router Benefits</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Can mix SSR, SSG, and CSR in the same app</li>
              <li>• Route-level rendering strategy choices</li>
              <li>• Automatic code splitting</li>
              <li>• Built-in caching and optimization</li>
              <li>• Serverless deployment ready</li>
            </ul>
          </div>

          <div className="mt-6 flex space-x-4">
            <a 
              href="/examples"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ← Back to Examples
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
