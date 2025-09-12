import React from 'react';
import type { User } from './UserApp';

interface UserStatsProps {
  users: User[];
}

export function UserStats({ users }: UserStatsProps) {
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    pending: users.filter(u => u.status === 'pending').length,
    admins: users.filter(u => u.role === 'admin').length,
    moderators: users.filter(u => u.role === 'moderator').length,
    regularUsers: users.filter(u => u.role === 'user').length
  };

  const departments = users.reduce((acc, user) => {
    if (user.department) {
      acc[user.department] = (acc[user.department] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topDepartment = Object.entries(departments)
    .sort(([, a], [, b]) => b - a)[0];

  const recentLogins = users
    .filter(u => u.lastLogin)
    .sort((a, b) => (b.lastLogin?.getTime() || 0) - (a.lastLogin?.getTime() || 0))
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-medium">↗ {stats.active}</span>
            <span className="text-gray-500 ml-1">active</span>
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-500">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      {/* Pending Users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">⏳</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-500">
              {stats.pending > 0 ? 'Requires attention' : 'All caught up'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Administrators</p>
            <p className="text-3xl font-bold text-purple-600">{stats.admins}</p>
          </div>
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">👑</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-500">
              {stats.moderators} moderators
            </span>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h3>
        {Object.keys(departments).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(departments)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{dept}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / stats.total) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            {topDepartment && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Largest department: <span className="font-medium text-gray-900">{topDepartment[0]}</span> with {topDepartment[1]} users
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No department data available</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentLogins.length > 0 ? (
          <div className="space-y-3">
            {recentLogins.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last login: {user.lastLogin && new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(new Date(user.lastLogin))}
                  </p>
                </div>
                <div className={`
                  w-2 h-2 rounded-full
                  ${user.status === 'active' ? 'bg-green-400' : 
                    user.status === 'inactive' ? 'bg-red-400' : 'bg-yellow-400'}
                `}></div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {stats.active} users logged in recently
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent login activity</p>
        )}
      </div>
    </div>
  );
}
