import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, UserPlus, Trash2, Check, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'user',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newUser.email.endsWith('@as.edu.au')) {
      setError('Only @as.edu.au email addresses are allowed');
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Create user record in our database
      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: newUser.email,
          role: newUser.role
        }]);

      if (dbError) throw dbError;

      // Log the action
      await supabase.from('admin_logs').insert([{
        action: 'create_user',
        details: JSON.stringify({
          created_user: newUser.email,
          role: newUser.role
        })
      }]);

      setSuccess('User added successfully');
      setShowAddUser(false);
      setNewUser({ email: '', role: 'user', password: '' });
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
    }
  };

  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      // Delete from our database
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .in('id', selectedUsers);

      if (dbError) throw dbError;

      // Log the action
      await supabase.from('admin_logs').insert([{
        action: 'delete_users',
        details: JSON.stringify({
          deleted_users: selectedUsers.length
        })
      }]);

      setSuccess(`Successfully deleted ${selectedUsers.length} user(s)`);
      setSelectedUsers([]);
      setShowDeleteConfirm(false);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting users:', err);
      setError('Failed to delete users');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_logs').insert([{
        action: 'change_user_role',
        details: JSON.stringify({
          target_user: userId,
          new_role: newRole
        })
      }]);

      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex space-x-4">
          <button
            onClick={fetchUsers}
            disabled={refreshing}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add User
          </button>
          {selectedUsers.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Selected ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-white">System Users</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading users...
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Last Sign In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.last_sign_in
                          ? new Date(user.last_sign_in).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <button
                          onClick={() => toggleUserSelection(user.id)}
                          className="text-red-500 hover:text-red-400"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No users found.
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <UserPlus className="w-8 h-8 mr-2 text-green-500" />
              Add New User
            </h2>
            
            <form onSubmit={handleAddUser} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="user@as.edu.au"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-2" />
              <h2 className="text-2xl font-bold text-white">Confirm Deletion</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete {selectedUsers.length} selected user(s)? 
              This action cannot be undone.
            </p>
            
            <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-200 text-sm">
                Warning: This will permanently remove the selected users and all their associated data.
              </p>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUsers}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Management Guide</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Adding Users</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Only @as.edu.au email addresses are allowed</li>
              <li>Passwords must meet minimum security requirements</li>
              <li>Users can be assigned either admin or regular user roles</li>
              <li>Email verification is handled automatically</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Managing Roles</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Admin users have access to additional system features</li>
              <li>Roles can be changed at any time</li>
              <li>Role changes take effect immediately</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-2">Security Notes</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>All user management actions are logged</li>
              <li>Deleted users cannot be recovered</li>
              <li>User data is automatically backed up</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;