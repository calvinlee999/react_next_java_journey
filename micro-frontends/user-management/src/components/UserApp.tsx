'use client';

import React, { useState, useEffect } from 'react';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { UserStats } from './UserStats';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  department?: string;
}

export function UserApp() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Simulate API calls with mock data
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@company.com',
          role: 'admin',
          status: 'active',
          avatar: '👤',
          lastLogin: new Date('2024-01-15T10:30:00'),
          createdAt: new Date('2023-06-01'),
          department: 'Engineering'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          role: 'user',
          status: 'active',
          avatar: '👩',
          lastLogin: new Date('2024-01-14T15:45:00'),
          createdAt: new Date('2023-08-15'),
          department: 'Marketing'
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob.johnson@company.com',
          role: 'moderator',
          status: 'inactive',
          avatar: '👨',
          lastLogin: new Date('2024-01-10T09:20:00'),
          createdAt: new Date('2023-05-20'),
          department: 'Support'
        },
        {
          id: '4',
          name: 'Alice Brown',
          email: 'alice.brown@company.com',
          role: 'user',
          status: 'pending',
          avatar: '👩‍💼',
          createdAt: new Date('2024-01-14'),
          department: 'Sales'
        },
        {
          id: '5',
          name: 'Charlie Wilson',
          email: 'charlie.wilson@company.com',
          role: 'admin',
          status: 'active',
          avatar: '👨‍💻',
          lastLogin: new Date('2024-01-15T14:10:00'),
          createdAt: new Date('2023-03-10'),
          department: 'Engineering'
        }
      ];
      
      setUsers(mockUsers);
      setLoading(false);
    };

    loadUsers();
  }, []);

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show success notification (in real app, this would use a toast library)
      console.log('User deleted successfully');
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (selectedUser) {
      // Update existing user
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...userData }
          : user
      ));
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'user',
        status: userData.status || 'pending',
        avatar: userData.avatar || '👤',
        createdAt: new Date(),
        department: userData.department
      };
      setUsers(prev => [...prev, newUser]);
    }
    
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage users, roles, and permissions across the organization
            </p>
          </div>
          
          <button
            onClick={handleCreateUser}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add User</span>
          </button>
        </div>

        {/* Stats */}
        <UserStats users={users} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              id="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading users...</span>
          </div>
        </div>
      ) : (
        <UserList
          users={filteredUsers}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />
      )}

      {/* User Form Modal */}
      {isFormOpen && (
        <UserForm
          user={selectedUser}
          onSave={handleSaveUser}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}
