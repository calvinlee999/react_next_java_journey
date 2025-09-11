'use client';

import React, { useState, useEffect } from 'react';
import { EventBus } from './shared/event-bus';
import './globals.css';

// For demonstration purposes, we'll simulate micro-frontend loading
// In a real implementation, these would be loaded via Module Federation

interface MicroFrontend {
  id: string;
  name: string;
  route: string;
  url: string;
  health?: 'healthy' | 'degraded' | 'unhealthy';
}

const microFrontends: MicroFrontend[] = [
  {
    id: 'user-management',
    name: 'User Management',
    route: '/users',
    url: 'http://localhost:3001',
    health: 'healthy'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    route: '/analytics',
    url: 'http://localhost:3003',
    health: 'healthy'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    route: '/shop',
    url: 'http://localhost:3004',
    health: 'healthy'
  }
];

export default function ShellApp() {
  const [currentRoute, setCurrentRoute] = useState('/');
  const [mfHealth, setMfHealth] = useState<Record<string, string>>({});

  // Initialize event bus and health monitoring
  useEffect(() => {
    // Subscribe to navigation events
    EventBus.subscribe('navigate', (data: { route: string }) => {
      setCurrentRoute(data.route);
      window.history.pushState({}, '', data.route);
    });

    // Subscribe to health updates
    EventBus.subscribe('health-update', (data: { mfId: string; status: string }) => {
      setMfHealth(prev => ({
        ...prev,
        [data.mfId]: data.status
      }));
    });

    // Handle browser back/forward
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);

    // Health check for micro-frontends
    const healthCheck = () => {
      microFrontends.forEach(mf => {
        // Simulate health check - in real app, this would ping the micro-frontend
        const isHealthy = Math.random() > 0.1; // 90% uptime simulation
        setMfHealth(prev => ({
          ...prev,
          [mf.id]: isHealthy ? 'healthy' : 'degraded'
        }));
      });
    };

    healthCheck();
    const healthInterval = setInterval(healthCheck, 30000); // Check every 30s

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(healthInterval);
      EventBus.unsubscribe('navigate');
      EventBus.unsubscribe('health-update');
    };
  }, []);

  const renderMicroFrontend = () => {
    const activeMF = microFrontends.find(mf => 
      currentRoute.startsWith(mf.route)
    );

    if (!activeMF) {
      return <Dashboard microFrontends={microFrontends} mfHealth={mfHealth} />;
    }

    // For demonstration, we'll show an iframe of the micro-frontend
    // In production, this would be the actual micro-frontend component
    return (
      <div className="h-screen">
        <iframe
          src={activeMF.url}
          className="w-full h-full border-0"
          title={`${activeMF.name} Micro-Frontend`}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentRoute={currentRoute}
        microFrontends={microFrontends}
        mfHealth={mfHealth}
      />
      
      <main className="container mx-auto px-4 py-8">
        {renderMicroFrontend()}
      </main>

      {/* Global notifications */}
      <GlobalNotifications />
    </div>
  );
}

// Dashboard component for the shell home page
function Dashboard({ 
  microFrontends, 
  mfHealth 
}: { 
  microFrontends: MicroFrontend[];
  mfHealth: Record<string, string>;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Micro-Frontend Portal
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A demonstration of micro-frontend architecture where independent teams 
          develop and deploy domain-specific features autonomously.
        </p>
      </div>

      {/* Micro-Frontend Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {microFrontends.map(mf => (
          <div 
            key={mf.id}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => EventBus.emit('navigate', { route: mf.route })}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{mf.name}</h3>
              <HealthIndicator status={mfHealth[mf.id] || 'healthy'} />
            </div>
            
            <p className="text-gray-600 mb-4">
              Independent micro-frontend for {mf.name.toLowerCase()} domain.
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Route: {mf.route}</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Benefits */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Micro-Frontend Benefits
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Team Autonomy',
              description: 'Independent development and deployment cycles',
              icon: '👥'
            },
            {
              title: 'Technology Freedom',
              description: 'Different frameworks and tools per domain',
              icon: '🛠️'
            },
            {
              title: 'Fault Isolation',
              description: 'Failures in one area don\'t affect others',
              icon: '🛡️'
            },
            {
              title: 'Scalable Development',
              description: 'Multiple teams can work in parallel',
              icon: '📈'
            },
            {
              title: 'Domain Alignment',
              description: 'Features organized by business domains',
              icon: '🎯'
            },
            {
              title: 'Independent Deployment',
              description: 'Deploy features without full app deployment',
              icon: '🚀'
            }
          ].map((benefit, index) => (
            <div key={index} className="text-center p-4">
              <div className="text-3xl mb-2">{benefit.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Health indicator component
function HealthIndicator({ status }: { status: string }) {
  const colors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors] || colors.healthy}`} />
      <span className="text-sm text-gray-500 capitalize">{status}</span>
    </div>
  );
}

// Error fallback for micro-frontends
function MicroFrontendError({ mfName }: { mfName: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="text-red-600 text-xl mb-2">⚠️</div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        {mfName} Unavailable
      </h3>
      <p className="text-red-600 mb-4">
        The {mfName} micro-frontend encountered an error and cannot be loaded.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// Global notifications component
function GlobalNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>>([]);

  useEffect(() => {
    EventBus.subscribe('notification', (data: any) => {
      const notification = {
        id: Date.now().toString(),
        ...data
      };
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    });

    return () => EventBus.unsubscribe('notification');
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${
            notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            notification.type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}
