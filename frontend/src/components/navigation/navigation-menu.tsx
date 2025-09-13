'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, HomeIcon, CogIcon } from '@heroicons/react/24/outline';
import { SmartLink } from './smart-navigation';
import { useThemeStore } from '@/store/zustand/theme-store';

// Navigation Menu Item Type
interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
  badge?: string | number;
  external?: boolean;
}

// Main Navigation Data
const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: <HomeIcon className="w-5 h-5" />
  },
  {
    id: 'examples',
    label: 'Examples',
    icon: <CogIcon className="w-5 h-5" />,
    children: [
      {
        id: 'modern-react',
        label: 'Modern React Demo',
        href: '/modern-react'
      },
      {
        id: 'rendering',
        label: 'Rendering Examples',
        href: '/examples'
      },
      {
        id: 'virtual-dom',
        label: 'Virtual DOM Performance',
        href: '/virtual-dom-demo'
      },
      {
        id: 'webhooks',
        label: 'Webhook Demo',
        href: '/webhooks'
      },
      {
        id: 'event-comparison',
        label: 'WebHook vs Kafka',
        href: '/event-comparison'
      },
      {
        id: 'websockets',
        label: 'WebSocket Demo',
        href: '/websockets'
      },
      {
        id: 'ai-inference',
        label: 'AI Inference Demo',
        href: '/ai-inference-demo'
      }
    ]
  },
  {
    id: 'documentation',
    label: 'Documentation',
    children: [
      {
        id: 'architecture',
        label: 'Architecture',
        href: '/docs/architecture'
      },
      {
        id: 'deployment',
        label: 'Deployment',
        href: '/docs/deployment'
      },
      {
        id: 'state-management',
        label: 'State Management',
        href: '/docs/state-management'
      }
    ]
  }
];

// Dropdown Menu Component
interface DropdownMenuProps {
  item: NavigationItem;
  isActive: boolean;
  onClose: () => void;
}

function DropdownMenu({ item, isActive, onClose }: DropdownMenuProps) {
  const { animations } = useThemeStore();
  const pathname = usePathname();

  if (!item.children) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={animations ? { opacity: 0, y: -10, scale: 0.95 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={animations ? { opacity: 0, y: -10, scale: 0.95 } : false}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
        >
          {item.children.map((child) => (
            <SmartLink
              key={child.id}
              href={child.href || '#'}
              onClick={onClose}
              className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                pathname === child.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{child.label}</span>
                {child.badge && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                    {child.badge}
                  </span>
                )}
              </div>
            </SmartLink>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Navigation Item Component
interface NavigationItemComponentProps {
  item: NavigationItem;
  pathname: string;
}

function NavigationItemComponent({ item, pathname }: NavigationItemComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { animations } = useThemeStore();
  
  const isActive = item.href === pathname || 
    (item.children && item.children.some(child => child.href === pathname));

  const handleToggle = () => {
    if (item.children) {
      setIsOpen(!isOpen);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`[data-nav-item="${item.id}"]`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, item.id]);

  if (item.href && !item.children) {
    // Simple link
    return (
      <SmartLink
        href={item.href}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-100 text-blue-600' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {item.icon}
        <span className="font-medium">{item.label}</span>
        {item.badge && (
          <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
            {item.badge}
          </span>
        )}
      </SmartLink>
    );
  }

  // Dropdown menu
  return (
    <div 
      className="relative"
      data-nav-item={item.id}
    >
      <button
        onClick={handleToggle}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors w-full text-left ${
          isActive 
            ? 'bg-blue-100 text-blue-600' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {item.icon}
        <span className="font-medium">{item.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: animations ? 0.2 : 0 }}
          className="ml-auto"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </motion.div>
        {item.badge && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
            {item.badge}
          </span>
        )}
      </button>
      
      <DropdownMenu 
        item={item} 
        isActive={isOpen} 
        onClose={handleClose}
      />
    </div>
  );
}

// Main Navigation Component
export function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <SmartLink 
            href="/"
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RJ</span>
            </div>
            <span className="text-xl font-bold text-gray-900">React Journey</span>
          </SmartLink>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <NavigationItemComponent
                key={item.id}
                item={item}
                pathname={pathname}
              />
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <MobileNavigationMenu items={navigationItems} pathname={pathname} />
          </div>
        </div>
      </div>
    </nav>
  );
}

// Mobile Navigation Menu
interface MobileNavigationMenuProps {
  items: NavigationItem[];
  pathname: string;
}

function MobileNavigationMenu({ items, pathname }: MobileNavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { animations } = useThemeStore();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
        aria-label="Toggle mobile menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            />

            {/* Mobile menu */}
            <motion.div
              initial={animations ? { x: '100%' } : false}
              animate={{ x: 0 }}
              exit={animations ? { x: '100%' } : false}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {items.map((item) => (
                  <div key={item.id} onClick={() => setIsOpen(false)}>
                    <NavigationItemComponent
                      item={item}
                      pathname={pathname}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
