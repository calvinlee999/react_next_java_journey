'use client';

import { useEffect, useState } from 'react';
import BigDataPlatformDashboard from '@/components/BigDataPlatformDashboard';

interface ApiResponse {
  message: string;
  service: string;
  version: string;
  architecture: string;
}

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
}

export default function Home() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch from backend API
        const apiResponse = await fetch('http://localhost:8080/api/hello');
        if (!apiResponse.ok) throw new Error('Failed to fetch API data');
        const apiResult = await apiResponse.json();
        setApiData(apiResult);

        // Fetch health status
        const healthResponse = await fetch('http://localhost:8080/api/health');
        if (!healthResponse.ok) throw new Error('Failed to fetch health data');
        const healthResult = await healthResponse.json();
        setHealthData(healthResult);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start max-w-4xl w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-blue-600">Golden Path Template</h1>
          <p className="text-lg text-gray-600">React + Java + Azure Production-Ready Architecture</p>
        </div>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full">
            <p className="text-blue-700">Loading backend connection...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full">
            <p className="text-red-700">Error: {error}</p>
            <p className="text-sm text-red-600 mt-2">Make sure the backend is running on port 8080</p>
          </div>
        )}

        {apiData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 w-full">
            <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Backend Connected Successfully</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Message:</span> {apiData.message}</p>
              <p><span className="font-medium">Service:</span> {apiData.service}</p>
              <p><span className="font-medium">Version:</span> {apiData.version}</p>
              <p><span className="font-medium">Architecture:</span> {apiData.architecture}</p>
            </div>
          </div>
        )}

        {healthData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">🏥 Health Status</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  healthData.status === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {healthData.status}
                </span>
              </p>
              <p><span className="font-medium">Service:</span> {healthData.service}</p>
              <p><span className="font-medium">Environment:</span> {healthData.environment}</p>
              <p><span className="font-medium">Timestamp:</span> {new Date(healthData.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">🎯 Full-Stack Framework Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Client-Side Rendering (CSR) - Interactive UIs</li>
              <li>✅ Static Site Generation (SSG) - CDN deployable</li>
              <li>✅ Server-Side Rendering (SSR) - Fresh data</li>
              <li>✅ Single Page App (SPA) capabilities</li>
              <li>✅ Java Spring Boot Backend API</li>
              <li>✅ Azure Cloud Infrastructure</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">🚀 Deployment Flexibility</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>📦 No server required for static routes</li>
              <li>🌐 CDN deployment (Vercel, Netlify, S3)</li>
              <li>☁️ Azure Static Web Apps included</li>
              <li>🔄 Incremental adoption of server features</li>
              <li>🐳 Docker containerization ready</li>
              <li>⚡ Serverless deployment options</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row w-full justify-center">
          <button
            onClick={() => window.open('http://localhost:8080/api/health', '_blank')}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            🏥 Check Health
          </button>
          <button
            onClick={() => window.open('http://localhost:8080/h2-console', '_blank')}
            className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center hover:bg-gray-50 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            🗃️ Database Console
          </button>
          <button
            onClick={() => window.location.href = '/examples'}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-purple-600 text-white gap-2 hover:bg-purple-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            🎯 View Rendering Examples
          </button>
          <button
            onClick={() => window.location.href = '/modern-react'}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            ⚛️ Modern React Demo
          </button>
        </div>

        {/* Big Data Platform Dashboard Section */}
        <div className="w-full">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🚀 Big Data Platform Integration</h2>
            <p className="text-gray-600 mb-4">
              Explore our modern big data platform with unified event-driven architecture, 
              AI-powered governance, data quality controls, and Azure Databricks integration.
            </p>
            <BigDataPlatformDashboard />
          </div>
        </div>
      </main>
    </div>
  );
}
