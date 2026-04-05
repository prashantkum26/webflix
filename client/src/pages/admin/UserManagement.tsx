import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import { adminAPI } from '../../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  isVerified: boolean;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  loginCount: number;
  subscription?: {
    plan: string;
    status: 'active' | 'expired' | 'cancelled';
    expiryDate: string;
  };
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      await adminAPI.updateUser(userId, updates);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleUserDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminAPI.deleteUser(userId);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleBulkAction = async () => {
    if (!selectedUsers.length || !bulkAction) return;
    
    if (!confirm(`Are you sure you want to ${bulkAction} ${selectedUsers.length} selected users?`)) {
      return;
    }
    
    try {
      // Implement bulk actions based on selection
      for (const userId of selectedUsers) {
        switch (bulkAction) {
          case 'activate':
            await adminAPI.updateUser(userId, { isActive: true });
            break;
          case 'deactivate':
            await adminAPI.updateUser(userId, { isActive: false });
            break;
          case 'verify':
            await adminAPI.updateUser(userId, { isVerified: true });
            break;
          case 'delete':
            await adminAPI.deleteUser(userId);
            break;
        }
      }
      
      setSelectedUsers([]);
      setBulkAction('');
      fetchUsers();
    } catch (err: any) {
      console.error('Error performing bulk action:', err);
      setError(err.response?.data?.message || 'Failed to perform bulk action');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === users.length 
        ? [] 
        : users.map(user => user._id)
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-600';
      case 'admin': return 'bg-red-600';
      case 'moderator': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black">
      <AdminNav />
      
      <main className="pt-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">
              Manage user accounts, roles, and permissions
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
              <button 
                onClick={fetchUsers}
                className="ml-4 text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
                <option value="super_admin">Super Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                <span className="text-white">{selectedUsers.length} users selected</span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                >
                  <option value="">Choose Action</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="verify">Verify</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="bg-netflix-red hover:bg-red-600 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-gray-400 hover:text-white"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
            </div>
          ) : (
            <div className="bg-gray-900/50 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-600 bg-gray-700 text-netflix-red focus:ring-netflix-red"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subscription</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                            className="rounded border-gray-600 bg-gray-700 text-netflix-red focus:ring-netflix-red"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-netflix-red rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.name}</div>
                              <div className="text-gray-400 text-sm">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            <span className="text-gray-300 text-sm">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {user.isVerified && (
                              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                          <div className="text-xs text-gray-500">
                            {user.loginCount} logins
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.subscription ? (
                            <div>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                user.subscription.status === 'active' 
                                  ? 'bg-green-900 text-green-300' 
                                  : 'bg-red-900 text-red-300'
                              }`}>
                                {user.subscription.plan}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">No subscription</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/admin/users/${user._id}`)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleUserUpdate(user._id, { isActive: !user.isActive })}
                              className={`text-sm ${user.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleUserDelete(user._id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                  <div className="text-gray-400 text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && users.length === 0 && (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No users in the system yet.'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserManagement;