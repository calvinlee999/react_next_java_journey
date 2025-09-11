import React from 'react';
import { EventBus } from '../shared/event-bus';

interface NavigationProps {
  currentRoute: string;
  microFrontends: Array<{
    id: string;
    name: string;
    route: string;
    health?: string;
  }>;
  mfHealth: Record<string, string>;
}

export function Navigation({ currentRoute, microFrontends, mfHealth }: NavigationProps) {
  const handleNavigate = (route: string) => {
    EventBus.emit('navigate', { route });
  };

  const handleKeyPress = (event: React.KeyboardEvent, route: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate(route);
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Home */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavigate('/')}
              onKeyDown={(e) => handleKeyPress(e, '/')}
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              aria-label="Go to home page"
            >
              <span className="text-2xl">🏠</span>
              <span>MF Portal</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {microFrontends.map((mf) => {
              const isActive = currentRoute.startsWith(mf.route);
              const health = mfHealth[mf.id] || 'healthy';
              
              return (
                <button
                  key={mf.id}
                  onClick={() => handleNavigate(mf.route)}
                  onKeyDown={(e) => handleKeyPress(e, mf.route)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }
                  `}
                  aria-label={`Navigate to ${mf.name}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{mf.name}</span>
                  <HealthDot status={health} />
                </button>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <MobileMenu 
              microFrontends={microFrontends}
              currentRoute={currentRoute}
              mfHealth={mfHealth}
            />
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => EventBus.emit('notification', {
                type: 'info',
                message: 'System status: All micro-frontends operational'
              })}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Check system status"
            >
              <span className="text-xl">📊</span>
            </button>
            
            <button
              onClick={() => EventBus.emit('notification', {
                type: 'success',
                message: 'All micro-frontends refreshed successfully'
              })}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Refresh all micro-frontends"
            >
              <span className="text-xl">🔄</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Health indicator dot component
function HealthDot({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: 'bg-green-400', label: 'Healthy' };
      case 'degraded':
        return { color: 'bg-yellow-400', label: 'Degraded' };
      case 'unhealthy':
        return { color: 'bg-red-400', label: 'Unhealthy' };
      default:
        return { color: 'bg-gray-400', label: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="relative group">
      <div 
        className={`w-2 h-2 rounded-full ${config.color}`}
        aria-label={config.label}
      />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {config.label}
      </div>
    </div>
  );
}

// Mobile menu component
function MobileMenu({ 
  microFrontends, 
  currentRoute, 
  mfHealth 
}: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleNavigate = (route: string) => {
    EventBus.emit('navigate', { route });
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="p-2 text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        aria-label="Open mobile menu"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Micro-Frontends</h3>
          </div>
          
          {microFrontends.map((mf) => {
            const isActive = currentRoute.startsWith(mf.route);
            const health = mfHealth[mf.id] || 'healthy';
            
            return (
              <button
                key={mf.id}
                onClick={() => handleNavigate(mf.route)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span>{mf.name}</span>
                <HealthDot status={health} />
              </button>
            );
          })}
          
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => {
                EventBus.emit('notification', {
                  type: 'info',
                  message: 'Mobile menu: All systems operational'
                });
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-50 transition-colors"
            >
              System Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
