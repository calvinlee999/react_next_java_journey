// Static Site Generation (SSG) Example
// This page is pre-rendered at build time

interface StaticData {
  buildTime: string;
  version: string;
  features: string[];
}

// This data would typically come from a CMS, API, or file system at build time
async function getStaticData(): Promise<StaticData> {
  return {
    buildTime: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'Pre-rendered at build time',
      'Served from CDN',
      'Lightning fast loading',
      'SEO optimized',
      'Perfect for marketing pages'
    ]
  };
}

export default async function SSGExample() {
  const data = await getStaticData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <h1 className="text-3xl font-bold text-gray-800">Static Site Generation (SSG)</h1>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">⚡ SSG Characteristics</h2>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>• Pre-rendered at build time</li>
              <li>• Served as static HTML from CDN</li>
              <li>• Ultra-fast loading times</li>
              <li>• Perfect SEO optimization</li>
              <li>• Can be deployed anywhere (Vercel, Netlify, S3, etc.)</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Build Information</h3>
              <p className="text-sm text-gray-600">Built at: {data.buildTime}</p>
              <p className="text-sm text-gray-600">Version: {data.version}</p>
              <p className="text-sm text-gray-600">Rendering: Static (Build Time)</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Performance Benefits</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Instant loading</li>
                <li>✅ CDN cacheable</li>
                <li>✅ SEO friendly</li>
                <li>✅ Low server costs</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">Features of this SSG Page</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💼 Perfect for Fintech Use Cases</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Marketing and landing pages</li>
              <li>• Documentation and help centers</li>
              <li>• Product information pages</li>
              <li>• Compliance and legal pages</li>
              <li>• Blog and news sections</li>
            </ul>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">🚀 Deployment Options</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Azure Static Web Apps (included in this template)</li>
              <li>• Vercel, Netlify, or any CDN</li>
              <li>• AWS S3 + CloudFront</li>
              <li>• GitHub Pages</li>
              <li>• Any static file hosting service</li>
            </ul>
          </div>

          <div className="mt-6">
            <a 
              href="/examples"
              className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ← Back to Examples
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
