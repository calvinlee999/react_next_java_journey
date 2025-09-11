'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/zustand/app-store';
import { useNavigationStore } from '@/store/zustand/navigation-store';
import { useThemeStore } from '@/store/zustand/theme-store';
import { SmartLink, BreadcrumbNavigation, useRouteChange } from '@/components/navigation/smart-navigation';
import { VirtualList, LazyLoad, OptimizedImage, MemoWrapper } from '@/components/optimization/virtual-dom-optimizations';

// Demo data for Virtual DOM testing
const generateLargeDataset = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `This is a description for item ${i}`,
    value: Math.random() * 1000,
    category: ['A', 'B', 'C'][i % 3]
  }));

export default function ModernReactDemo() {
  useRouteChange(); // Initialize route change tracking
  
  const { user, setUser, settings, updateSettings } = useAppStore();
  const { currentRoute, navigationHistory } = useNavigationStore();
  const { theme, setTheme, animations, toggleAnimations } = useThemeStore();
  
  const [largeDataset] = useState(() => generateLargeDataset(10000));
  const [virtualListHeight] = useState(400);
  const [itemHeight] = useState(50);

  // Virtual DOM optimization demo
  const renderVirtualItem = (item: typeof largeDataset[0], index: number) => (
    <MemoWrapper 
      key={item.id} 
      dependencies={[item.id, item.name, item.value]}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50">
        <div>
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.description}</p>
        </div>
        <div className="text-right">
          <span className="font-bold text-green-600">${item.value.toFixed(2)}</span>
          <div className="text-xs text-gray-400">Category {item.category}</div>
        </div>
      </div>
    </MemoWrapper>
  );

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Modern React Demo', href: '/modern-react' },
  ];

  return (
    <motion.div
      initial={animations ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <BreadcrumbNavigation items={breadcrumbs} />
          <motion.h1 
            className="text-4xl font-bold text-gray-900 mt-4"
            initial={animations ? { scale: 0.9 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            React Virtual DOM & State Management Demo
          </motion.h1>
          <p className="text-lg text-gray-600 mt-2">
            Showcasing modern React patterns with Next.js 15, Virtual DOM optimizations, and enterprise state management
          </p>
        </header>

        {/* State Management Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User State (Zustand) */}
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-6"
            initial={animations ? { opacity: 0, x: -20 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">User State (Zustand)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  onChange={(e) => setUser({ name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  onChange={(e) => setUser({ email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter your email"
                />
              </div>
              <div className="pt-2 border-t">
                <h3 className="font-medium text-gray-700">Settings</h3>
                <div className="mt-2 space-y-2">
                  <select
                    value={settings.language}
                    onChange={(e) => updateSettings({ language: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Theme State */}
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-6"
            initial={animations ? { opacity: 0, x: 20 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Theme & UI Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={animations}
                  onChange={toggleAnimations}
                  className="mr-3"
                />
                <label className="text-sm font-medium text-gray-700">Enable Animations</label>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation State Display */}
        <motion.div 
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
          initial={animations ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Navigation State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Current Route</h3>
              <p className="text-sm bg-gray-100 p-2 rounded">{currentRoute}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Navigation History</h3>
              <div className="text-sm bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                {navigationHistory.slice(-5).map((nav, idx) => (
                  <div key={idx} className="text-xs">
                    {nav.route} {nav.duration && `(${nav.duration.toFixed(2)}ms)`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Virtual DOM Optimization Demo */}
        <motion.div 
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
          initial={animations ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Virtual DOM Optimization Demo</h2>
          <p className="text-gray-600 mb-4">
            Rendering 10,000 items efficiently using virtual scrolling and memoization
          </p>
          
          <div className="border border-gray-200 rounded-lg">
            <VirtualList
              items={largeDataset}
              itemHeight={itemHeight}
              containerHeight={virtualListHeight}
              renderItem={renderVirtualItem}
              getItemKey={(item) => item.id}
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Virtual scrolling allows smooth rendering of {largeDataset.length.toLocaleString()} items
          </div>
        </motion.div>

        {/* Lazy Loading Demo */}
        <motion.div 
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
          initial={animations ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Lazy Loading Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <LazyLoad 
                key={num}
                fallback={<div className="h-48 bg-gray-200 animate-pulse rounded"></div>}
              >
                <OptimizedImage
                  src={`https://picsum.photos/300/200?random=${num}`}
                  alt={`Demo image ${num}`}
                  width={300}
                  height={200}
                  className="rounded-lg"
                  placeholder="blur"
                />
              </LazyLoad>
            ))}
          </div>
        </motion.div>

        {/* Navigation Links */}
        <motion.div 
          className="mt-8 flex space-x-4"
          initial={animations ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <SmartLink 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </SmartLink>
          <SmartLink 
            href="/examples"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Examples
          </SmartLink>
        </motion.div>
      </div>
    </motion.div>
  );
}
