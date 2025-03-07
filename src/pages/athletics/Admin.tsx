import React, { useState, useEffect } from 'react';
import { Shield, Settings, Users, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAdmin(false);
        return;
      }

      // Check if user has admin role
      const { data: adminData } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single();

      setIsAdmin(adminData?.role === 'admin');
      
      if (adminData?.role === 'admin') {
        fetchSystemSettings();
      }
    } catch (err) {
      console.error('Error checking admin access:', err);
      setError('Failed to verify admin access');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      setSystemSettings(data || []);
    } catch (err) {
      console.error('Error fetching system settings:', err);
      setError('Failed to fetch system settings');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <div className="flex items-center">
          <Lock className="w-6 h-6 mr-2" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
        </div>
        <p className="mt-2">You do not have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Shield className="w-8 h-8 text-amber-600 mr-2" />
          Athletics Admin Panel
        </h1>
        <button
          onClick={fetchSystemSettings}
          disabled={refreshing}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center"
        >
          <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-lg font-semibold">User Management</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors">
              Manage Officials
            </button>
            <button className="w-full px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors">
              View Access Logs
            </button>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-lg font-semibold">System Settings</h2>
          </div>
          <div className="space-y-4">
            {systemSettings.map(setting => (
              <div key={setting.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{setting.key}</h3>
                <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                <input
                  type="text"
                  value={setting.value}
                  className="mt-2 w-full px-3 py-2 border rounded-md"
                  readOnly
                />
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-lg font-semibold">System Status</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-800">System Online</div>
              <p className="text-sm text-green-600 mt-1">All services operating normally</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">Last Backup</div>
              <p className="text-sm text-blue-600 mt-1">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Administrative Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border rounded-lg hover:bg-amber-50 text-left transition-colors">
            <h3 className="font-medium">Backup Database</h3>
            <p className="text-sm text-gray-500 mt-1">Create a full system backup</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-amber-50 text-left transition-colors">
            <h3 className="font-medium">Export Results</h3>
            <p className="text-sm text-gray-500 mt-1">Download all carnival results</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-amber-50 text-left transition-colors">
            <h3 className="font-medium">System Logs</h3>
            <p className="text-sm text-gray-500 mt-1">View detailed system logs</p>
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center mb-2">
          <Lock className="w-6 h-6 text-amber-600 mr-2" />
          <h2 className="text-lg font-semibold text-amber-800">Security Notice</h2>
        </div>
        <p className="text-amber-700">
          All administrative actions are logged and monitored. Please ensure you follow proper procedures
          when making system changes.
        </p>
      </div>
    </div>
  );
};

export default Admin;